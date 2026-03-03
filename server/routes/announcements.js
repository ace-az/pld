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

        // Send Discord DMs
        const discordClient = req.discordClient;
        if (discordClient && discordClient.isReady()) {
            const targetStudents = target === 'all'
                ? await studentModel.getStudents(req.user.id)
                : recipients;

            const discordMsg = `📢 **${title}**\n${message}\n\n— *${req.user.username}*`;

            for (const student of targetStudents) {
                if (!student.discord) continue;
                try {
                    // Search members in all guilds for the discord username
                    const guilds = discordClient.guilds.cache;
                    for (const guild of guilds.values()) {
                        const members = await guild.members.fetch();
                        const member = members.find(m =>
                            m.user.username.toLowerCase() === student.discord.toLowerCase() ||
                            m.user.tag.toLowerCase() === student.discord.toLowerCase()
                        );
                        if (member) {
                            await member.send(discordMsg).catch(() => { });
                            break;
                        }
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

module.exports = router;
