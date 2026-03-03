// server/routes/announcements.js
const express = require('express');
const router = express.Router();
const announcementModel = require('../models/announcementModel');
const studentModel = require('../models/studentModel');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

// POST /api/announcements — mentor creates announcement
router.post('/', async (req, res) => {
    try {
        const { title, message, target, recipientDiscords } = req.body;
        if (!title || !message || !target) {
            return res.status(400).json({ error: 'title, message, and target are required' });
        }

        let recipients = [];
        if (target === 'selected' && Array.isArray(recipientDiscords) && recipientDiscords.length > 0) {
            // Fetch full student info to get names
            const allStudents = await studentModel.getStudents(req.user.id);
            recipients = allStudents.filter(s => recipientDiscords.includes(s.discord));
        }

        const ann = await announcementModel.createAnnouncement({
            mentorId: req.user.id,
            mentorName: req.user.username,
            title,
            message,
            target,
            recipients
        });

        // Send Discord DMs — only to verified students
        const discordClient = req.discordClient;
        if (discordClient && discordClient.isReady()) {
            let targetStudents = target === 'all'
                ? await studentModel.getStudents(req.user.id)
                : recipients;

            // Only DM verified students
            targetStudents = targetStudents.filter(s => s.discord_verified);

            const discordMsg = `📢 **${title}**\n${message}\n\n— *${req.user.username}*`;

            for (const student of targetStudents) {
                if (!student.discord) continue;
                try {
                    const guilds = discordClient.guilds.cache;
                    let sent = false;
                    for (const guild of guilds.values()) {
                        if (sent) break;
                        const results = await guild.members.search({ query: student.discord, limit: 10 }).catch(() => []);
                        const member = results.find(m =>
                            m.user.username.toLowerCase() === student.discord.toLowerCase() ||
                            m.user.tag?.toLowerCase() === student.discord.toLowerCase() ||
                            m.user.globalName?.toLowerCase() === student.discord.toLowerCase()
                        );
                        if (member) { await member.send(discordMsg).catch(() => { }); sent = true; }
                    }
                } catch (e) {
                    console.error(`Discord DM failed for ${student.discord}:`, e.message);
                }
            }
        }

        res.json(ann);
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/announcements — mentor gets all, student gets their own
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'mentor' || req.user.role === 'admin') {
            const data = await announcementModel.getAllAnnouncements();
            return res.json(data);
        }
        // Student: get by discordId
        const discordId = req.user.discordId || '';
        const data = await announcementModel.getAnnouncementsForStudent(discordId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/announcements/:id — mentor deletes their announcement
router.delete('/:id', async (req, res) => {
    try {
        await announcementModel.deleteAnnouncement(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/announcements/notify-groups — creates sessions + sends personalized group notifications
router.post('/notify-groups', async (req, res) => {
    try {
        const { groups, topicIds } = req.body;
        if (!Array.isArray(groups) || groups.length === 0) {
            return res.status(400).json({ error: 'groups array is required' });
        }

        const mentorId = req.user.id;
        const mentorName = req.user.username;
        const sessionModel = require('../models/sessionModel');
        const createdSessions = [];

        for (const group of groups) {
            if (!group.students || group.students.length === 0) continue;

            // 1. Create a PLD session for this group
            let session = null;
            if (Array.isArray(topicIds) && topicIds.length > 0) {
                try {
                    session = await sessionModel.createSession(
                        mentorId,
                        group.name,
                        group.students,
                        topicIds
                    );
                    createdSessions.push(session);
                } catch (e) {
                    console.error(`Session creation failed for ${group.name}:`, e.message);
                }
            }

            // 2. Create a targeted announcement for this group's students only
            const teammateNames = group.students.map(s => s.name).join(', ');
            const annMessage = `You've been assigned to **${group.name}**!\n\n**Your teammates:** ${teammateNames}`;
            try {
                await announcementModel.createAnnouncement({
                    mentorId,
                    mentorName,
                    title: `PLD Group Assignment — ${group.name}`,
                    message: annMessage,
                    target: 'selected',
                    recipients: group.students   // [{name, discord}]
                });
            } catch (e) {
                console.error(`Announcement failed for ${group.name}:`, e.message);
            }

            // 3. Send personalized Discord DM — only if student is verified
            const discordClient = req.discordClient;
            if (discordClient && discordClient.isReady()) {
                // Re-fetch verified status from DB for accuracy
                const allMasterStudents = await studentModel.getStudents(mentorId);
                const verifiedSet = new Set(
                    allMasterStudents.filter(s => s.discord_verified).map(s => s.discord?.toLowerCase())
                );

                for (const student of group.students) {
                    if (!student.discord || !verifiedSet.has(student.discord.toLowerCase())) {
                        if (student.discord) console.log(`Skipping DM for unverified student: ${student.discord}`);
                        continue;
                    }
                    const otherTeammates = group.students.filter(s => s.id !== student.id).map(s => s.name);
                    const teammatesStr = otherTeammates.length > 0 ? otherTeammates.join(', ') : 'None';
                    const dm = `👥 **PLD Group Assignment**\n\nHey **${student.name}**! You've been placed in **${group.name}**.\n\n**Your teammates:** ${teammatesStr}\n\n— *${mentorName}*`;
                    try {
                        const guilds = discordClient.guilds.cache;
                        let sent = false;
                        for (const guild of guilds.values()) {
                            if (sent) break;
                            try {
                                const results = await guild.members.search({ query: student.discord, limit: 10 });
                                const member = results.find(m =>
                                    m.user.username.toLowerCase() === student.discord.toLowerCase() ||
                                    m.user.tag?.toLowerCase() === student.discord.toLowerCase() ||
                                    m.user.globalName?.toLowerCase() === student.discord.toLowerCase()
                                );
                                if (member) {
                                    await member.send(dm).catch(e => console.warn(`DM to ${student.discord} failed:`, e.message));
                                    sent = true;
                                }
                            } catch (e) {
                                console.error(`Discord search failed in guild:`, e.message);
                            }
                        }
                        if (!sent) console.warn(`Could not find Discord user: ${student.discord}`);
                    } catch (e) {
                        console.error(`Discord DM outer error for ${student.discord}:`, e.message);
                    }
                }
            }
        }

        const totalStudents = groups.reduce((n, g) => n + g.students.length, 0);
        res.json({ success: true, notified: totalStudents, sessions: createdSessions.length });
    } catch (err) {
        console.error('Notify groups error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
