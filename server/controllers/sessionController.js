// server/controllers/sessionController.js
const sessionModel = require('../models/sessionModel');

const userModel = require('../models/userModel');

exports.createSession = async (req, res) => {
    try {
        const { groupName, students, topicIds } = req.body; // students: [{name, discord}], topicIds: [id1, id2]

        if (!groupName || !students || students.length === 0 || !topicIds || (Array.isArray(topicIds) && topicIds.length === 0)) {
            return res.status(400).json({ error: 'Missing required fields (Group Name, Students, and Topics)' });
        }

        const session = await sessionModel.createSession(req.user.id, groupName, students, topicIds);
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMySessions = async (req, res) => {
    try {
        console.log(`[getMySessions] User requesting: ${req.user.username} (${req.user.role})`);
        let sessions;
        if (req.user.role === 'student') {
            // For students, fetch sessions where they are included via their Discord username
            // We must fetch the latest user data to get the correct discordId, as the token might just have the portal username
            const fullUser = await userModel.findUserById(req.user.id);
            console.log(`[getMySessions] Full user found:`, fullUser ? fullUser.username : 'null');

            if (!fullUser || !fullUser.discordId) {
                console.log(`[getMySessions] No discordId for user ${req.user.username}`);
                return res.json([]); // No discord ID linked, so no sessions
            }
            console.log(`[getMySessions] Searching sessions for discordId: ${fullUser.discordId}`);
            sessions = await sessionModel.getSessionsForStudent(fullUser.discordId);
            console.log(`[getMySessions] Found ${sessions.length} sessions`);
        } else {
            // For mentors (or default), fetch by mentorId
            sessions = await sessionModel.getSessionsByMentor(req.user.id);
        }
        res.json(sessions);
    } catch (err) {
        console.error('[getMySessions] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSession = async (req, res) => {
    try {
        const session = await sessionModel.getSessionById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Security Check: If student, ensure they are in this session
        if (req.user.role === 'student') {
            const isInSession = session.students.some(s => s.discord === req.user.username);
            if (!isInSession) {
                return res.status(403).json({ error: 'Access denied: You are not in this session.' });
            }
        }

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

exports.updateGrade = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { grade } = req.body;
        const updated = await sessionModel.updateStudentGrade(sessionId, studentId, grade);
        if (!updated) return res.status(404).json({ error: 'Student or Session not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateQuestions = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { answered, incorrect } = req.body;
        const updated = await sessionModel.updateStudentQuestions(sessionId, studentId, { answered, incorrect });
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

        // If absent, we shouldn't really be sending "feedback", but we might notify them of absence.
        // The toggleStatus endpoint handles absence notification.
        // This endpoint is for AI result feedback.

        if (!student.result) return res.status(400).json({ error: 'No feedback generated to send' });
        if (!student.discord) return res.status(400).json({ error: 'No Discord username provided' });

        const gradeText = student.grade ? `**Total Grade: ${student.grade}/5**\n\n` : '';
        const messageContent = gradeText + student.result;

        const result = await sendDiscordDM(req.discordClient, student.discord, messageContent);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { status } = req.body; // 'present' or 'absent'

        const updatedStudent = await sessionModel.updateStudentStatus(sessionId, studentId, status);
        if (!updatedStudent) return res.status(404).json({ error: 'Student or session not found' });

        // Notification is now deferred to "Send All"

        res.json(updatedStudent);
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
        console.log(`[Batch Send] Starting batch for session ${sessionId}`);

        for (const student of session.students) {
            console.log(`[Batch Send] Processing student: ${student.name}, Status: ${student.status}`);

            // Check for Absent Status
            // Normalize status check just in case
            if (student.status === 'absent') {
                if (student.discord) {
                    const message = `Hello ${student.name},\n\nYou have been marked as absent for the PLD session "${session.groupName || 'today'}".\nPlease note that you must use your 1 PTO for this absence.\n\nBest regards,\nPLD Manager`;
                    const result = await sendDiscordDM(req.discordClient, student.discord, message);
                    results.push({
                        student: student.name,
                        discord: student.discord,
                        success: result.success,
                        error: result.error,
                        type: 'absent_notification'
                    });
                } else {
                    results.push({
                        student: student.name,
                        success: false,
                        error: 'Absent but no Discord username',
                        type: 'absent_notification'
                    });
                }
                continue; // Move to next student
            }

            // Normal Feedback Logic for Present Students
            if (student.result && student.discord) {
                const gradeText = student.grade ? `**Total Grade: ${student.grade}/5**\n\n` : '';
                const messageContent = gradeText + student.result;
                const result = await sendDiscordDM(req.discordClient, student.discord, messageContent);
                results.push({
                    student: student.name,
                    discord: student.discord,
                    success: result.success,
                    error: result.error,
                    type: 'feedback'
                });
            } else {
                results.push({
                    student: student.name,
                    success: false,
                    error: 'Missing result or discord username',
                    type: 'feedback'
                });
            }
        }

        res.json({ summary: results });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await sessionModel.getLeaderboard();
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
