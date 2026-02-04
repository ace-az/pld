// server/controllers/sessionController.js
const sessionModel = require('../models/sessionModel');

exports.createSession = async (req, res) => {
    try {
        const { groupName, students, topicId } = req.body; // students: [{name, discord}]
        if (!groupName || !students || students.length === 0 || !topicId) {
            return res.status(400).json({ error: 'Missing required fields (Group Name, Students, and Topic)' });
        }

        const session = await sessionModel.createSession(req.user.id, groupName, students, topicId);
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMySessions = async (req, res) => {
    try {
        const sessions = await sessionModel.getSessionsByMentor(req.user.id);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSession = async (req, res) => {
    try {
        const session = await sessionModel.getSessionById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { notes } = req.body;
        const updated = await sessionModel.updateStudentNote(sessionId, studentId, notes);
        if (!updated) return res.status(404).json({ error: 'Student or Session not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Saving AI Result - NO LONGER SENDS DM
exports.saveResult = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { result } = req.body;
        const updated = await sessionModel.updateStudentResult(sessionId, studentId, result);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.endSession = async (req, res) => {
    try {
        const { id } = req.params;
        await sessionModel.completeSession(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        await sessionModel.deleteSession(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAllSessions = async (req, res) => {
    try {
        await sessionModel.deleteAllSessions(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Helper to find user and send DM
async function sendDiscordDM(discordClient, username, message) {
    if (!discordClient || !process.env.DISCORD_TOKEN) {
        console.log(`[Demo] Sent DM to ${username}`);
        return { success: true, message: 'Simulated Send (No Bot Token)' };
    }

    try {
        console.log(`Attempting to find user with username: ${username}`);
        let targetUser = null;
        const guilds = discordClient.guilds.cache;

        if (!discordClient.isReady()) {
            return { success: false, error: 'Discord bot is not ready.' };
        }

        for (const [guildId, guild] of guilds) {
            try {
                const members = await guild.members.fetch({ query: username, limit: 1 });
                const member = members.find(m => m.user.username.toLowerCase() === username.toLowerCase() || m.user.tag.toLowerCase() === username.toLowerCase());
                if (member) {
                    targetUser = member.user;
                    break;
                }
            } catch (err) {
                console.error(`Error fetching members in guild ${guild.name}:`, err);
            }
        }

        if (!targetUser) {
            console.log(`User ${username} not found in any common guild.`);
            return { success: false, error: `User '${username}' not found in bot servers.` };
        }

        console.log(`Found user: ${targetUser.tag}, sending DM...`);
        await targetUser.send(message);
        console.log(`DM sent successfully to ${targetUser.tag}`);
        return { success: true, message: `Sent to ${username}` };

    } catch (err) {
        console.error('Failed to send DM:', err);
        return { success: false, error: `Failed to send to ${username}: ${err.message}` };
    }
}

// Explicit Endpoint for Sending DM
exports.sendFeedback = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const session = await sessionModel.getSessionById(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const student = session.students.find(s => s.id === studentId);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        if (!student.result) return res.status(400).json({ error: 'No feedback generated to send' });
        if (!student.discord) return res.status(400).json({ error: 'No Discord username provided' });

        const result = await sendDiscordDM(req.discordClient, student.discord, student.result);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Validates and sends to ALL students
exports.sendAllFeedback = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await sessionModel.getSessionById(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const results = [];

        for (const student of session.students) {
            if (student.result && student.discord) {
                const result = await sendDiscordDM(req.discordClient, student.discord, student.result);
                results.push({
                    student: student.name,
                    discord: student.discord,
                    success: result.success,
                    error: result.error
                });
            } else {
                results.push({
                    student: student.name,
                    success: false,
                    error: 'Missing result or discord username'
                });
            }
        }

        res.json({ summary: results });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
