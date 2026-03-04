// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, findUserByUsername, findUserByDiscordId, updateUserPassword } = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const { verifications } = require('../index'); // Share memory store from index.js
const { getJwtSecret } = require('../utils/jwtSecret');

exports.register = async (req, res) => {
    try {
        const { username, password, discordId, firstName, lastName } = req.body; // user registers with own user/pass + discord username
        if (!username || !password || !discordId || !firstName || !lastName) return res.status(400).json({ error: 'Missing required configuration fields' });

        if (/\s/.test(username)) {
            return res.status(400).json({ error: 'Username cannot contain spaces' });
        }

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
        const user = await createUser(username, hashedPassword, discordId, role, 'Undeclared', firstName, lastName);

        // Auto-verify: mark the student as discord_verified in the students table
        // Or if they don't exist yet, insert them so mentors can see them.
        if (discordId && role === 'student') {
            try {
                const { supabase } = require('../models/db');

                // First check if they already exist in the roster
                const { data: existingStudent } = await supabase
                    .from('students')
                    .select('id')
                    .ilike('discord', discordId)
                    .maybeSingle();

                if (existingStudent) {
                    await supabase
                        .from('students')
                        .update({ discord_verified: true, name: `${firstName} ${lastName}` })
                        .eq('id', existingStudent.id);
                } else {
                    // Insert them into the roster so they appear in "Manage Students"
                    // We assume mentorId can be null for self-registered students until claimed
                    const { v4: uuidv4 } = require('uuid');
                    await supabase.from('students').insert([{
                        id: uuidv4(),
                        mentorId: null,
                        name: `${firstName} ${lastName}`,
                        discord: discordId,
                        major: 'Undeclared',
                        discord_verified: true,
                        createdAt: new Date().toISOString()
                    }]);
                }
            } catch (e) {
                console.warn('[Register] Could not auto-verify or insert student record:', e.message);
            }
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, discordId: user.discordId }, getJwtSecret(), { expiresIn: '7d' });
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

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, discordId: user.discordId }, getJwtSecret(), { expiresIn: '7d' });
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

exports.discordCallback = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'OAuth code missing' });
        }

        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const redirectUri = process.env.REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            console.error("Missing Discord OAuth credentials in environment variables.");
            return res.status(500).json({ error: 'Server is missing Discord OAuth configuration.' });
        }

        // 1. Exchange the code for an access token using standard fetch
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
        });

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: tokenParams,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Failed to exchange code:', errorData);
            return res.status(400).json({ error: 'Failed to exchange Discord authorization code' });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Fetch the user's Discord profile
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!userResponse.ok) {
            return res.status(400).json({ error: 'Failed to fetch Discord user profile' });
        }

        const discordUser = await userResponse.json();
        const discordUsername = discordUser.username; // Note: In newer Discord, tag might be just username

        // 3. Check if user already exists
        let user = await findUserByDiscordId(discordUsername);

        // Auto-assign role just like standard register
        let role = 'student'; // Default fallback
        const client = req.discordClient;
        if (client) {
            const guildId = process.env.DISCORD_GUILD_ID;
            const studentRoleId = process.env.DISCORD_STUDENT_ROLE_ID;
            const mentorRoleId = process.env.DISCORD_MENTOR_ROLE_ID;

            try {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    const members = await guild.members.fetch({ query: discordUsername, limit: 10 });
                    const member = members.find(m => m.user.username.toLowerCase() === discordUsername.toLowerCase());

                    if (member) {
                        if (member.roles.cache.has(mentorRoleId)) role = 'mentor';
                        else if (member.roles.cache.has(studentRoleId)) role = 'student';
                    }
                }
            } catch (discordErr) {
                console.error("Failed to fetch discord role on OAuth login:", discordErr);
            }
        }

        if (!user) {
            // Register them automatically with a random password because they are using OAuth
            const randomPassword = uuidv4();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            // Major can be updated later by the user
            user = await createUser(discordUsername, hashedPassword, discordUsername, role, "Undeclared");
        } else {
            // Optional: Update their role dynamically every time they log in if they got promoted/demoted
            // We'd need an `updateUserRole` in model.
        }

        // Auto-verify in students table: they logged in via Discord → they're in the server
        if (role === 'student' && discordUsername) {
            try {
                const { supabase } = require('../models/db');

                const { data: existingStudent } = await supabase
                    .from('students')
                    .select('id')
                    .ilike('discord', discordUsername)
                    .maybeSingle();

                if (existingStudent) {
                    await supabase
                        .from('students')
                        .update({ discord_verified: true })
                        .eq('id', existingStudent.id);
                } else {
                    // Insert them into the roster so they appear in "Manage Students"
                    const { v4: uuidv4 } = require('uuid');
                    await supabase.from('students').insert([{
                        id: uuidv4(),
                        mentorId: null,
                        name: discordUsername,
                        discord: discordUsername,
                        major: 'Undeclared',
                        discord_verified: true,
                        createdAt: new Date().toISOString()
                    }]);
                }
            } catch (e) {
                console.warn('[OAuth] Could not auto-verify or insert student record:', e.message);
            }
        }

        // 4. Generate JWT Token
        const jwtToken = jwt.sign({ id: user.id, username: user.username, role: user.role, discordId: user.discordId }, getJwtSecret(), { expiresIn: '7d' });

        res.json({
            token: jwtToken,
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
        console.error('Discord OAuth Error:', err);
        res.status(500).json({ error: 'Discord Authentication Failed' });
    }
};
