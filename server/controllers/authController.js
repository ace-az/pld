// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, findUserByUsername, findUserByDiscordId, updateUserPassword } = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const { verifications } = require('../index'); // Share memory store from index.js

const SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res) => {
    try {
        const { username, password, discordId, major } = req.body; // user registers with own user/pass + discord username
        if (!username || !password || !discordId) return res.status(400).json({ error: 'Missing fields (Username, Password, or Discord ID)' });

        const existing = await findUserByUsername(username);
        if (existing) return res.status(400).json({ error: 'Username taken' });

        const existingDiscord = await findUserByDiscordId(discordId);
        if (existingDiscord) return res.status(400).json({ error: 'This Discord account is already registered.' });

        // Auto-assign Role from Discord
        let role = 'student'; // Default fallback
        const client = req.discordClient;
        if (client) {
            const guildId = process.env.DISCORD_GUILD_ID;
            const studentRoleId = process.env.DISCORD_STUDENT_ROLE_ID;
            const mentorRoleId = process.env.DISCORD_MENTOR_ROLE_ID;

            try {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    // Try to match discordId (which might be username) to a member
                    // Since registration form asks for "Discord Username", let's search.
                    // Ideally we should use ID, but user provided username.
                    const members = await guild.members.fetch({ query: discordId, limit: 10 });
                    const member = members.find(m => m.user.username.toLowerCase() === discordId.toLowerCase());

                    if (member) {
                        if (member.roles.cache.has(mentorRoleId)) role = 'mentor';
                        else if (member.roles.cache.has(studentRoleId)) role = 'student';
                    }
                }
            } catch (discordErr) {
                console.error("Failed to fetch discord role on register:", discordErr);
                // Fallback to student? Or error? Let's fallback but log.
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // We pass 'role' here which is now auto-detected
        const user = await createUser(username, hashedPassword, discordId, role, major);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, discordId: user.discordId }, SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                discordId: user.discordId,
                avatar: user.avatar,
                firstName: user.firstName,
                lastName: user.lastName,
                major: user.major
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await findUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, discordId: user.discordId }, SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                discordId: user.discordId,
                avatar: user.avatar,
                firstName: user.firstName,
                lastName: user.lastName,
                major: user.major
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { discordUsername } = req.body;
        if (!discordUsername) return res.status(400).json({ error: 'Discord username required' });

        const user = await findUserByDiscordId(discordUsername);
        if (!user) return res.status(404).json({ error: 'Account not found with this Discord username' });

        const client = req.discordClient;
        if (!client) return res.status(500).json({ error: 'Discord Client not initialized' });

        const guildId = process.env.DISCORD_GUILD_ID;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(500).json({ error: 'Bot is not in the configured server' });

        // Find user in discord
        let member;
        try {
            const members = await guild.members.fetch({ query: discordUsername, limit: 10 });
            member = members.find(m => m.user.username.toLowerCase() === discordUsername.toLowerCase());
        } catch (err) {
            console.error('Member fetch error:', err);
        }

        if (!member) {
            return res.status(404).json({ error: `Discord user '${discordUsername}' not found in the server.` });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verifications[discordUsername] = {
            code,
            type: 'password_reset',
            username: user.username,
            timestamp: Date.now()
        };

        try {
            await member.send(`Your PLD Password Reset Code is: **${code}**`);
            res.json({ success: true, message: `Reset code sent to ${discordUsername} via Discord DM.` });
        } catch (dmError) {
            console.error("DM Error", dmError);
            return res.status(500).json({ error: 'Failed to send DM. Please allow DMs from this server.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { discordUsername, code, newPassword } = req.body;
        if (!discordUsername || !code || !newPassword) return res.status(400).json({ error: 'Missing fields' });

        const record = verifications[discordUsername];
        if (!record || record.type !== 'password_reset') {
            return res.status(400).json({ error: 'No reset request found or code expired. Please request a new code.' });
        }

        if (record.code !== code) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updateUserPassword(record.username, hashedPassword);

        // Clean up
        delete verifications[discordUsername];

        res.json({ success: true, message: 'Password updated successfully. You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
