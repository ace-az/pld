const express = require("express");
const router = express.Router();
const generateCode = require("../utils/generateCode");
const verifications = require("../utils/verificationStore");
const { findUserByDiscordId } = require('../models/userModel');

router.post("/", async (req, res) => {
    const { discordUsername } = req.body;
    if (!discordUsername) return res.status(400).send("Discord username required");

    const existingDiscord = await findUserByDiscordId(discordUsername);
    if (existingDiscord) return res.status(400).send("This Discord account is already registered.");

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    verifications[discordUsername] = { code, expiresAt };

    // Send DM using the Discord bot
    try {
        // Fetch all users from the guild and find by username
        const guilds = req.discordClient.guilds.cache;
        let targetUser = null;

        for (const guild of guilds.values()) {
            const members = await guild.members.fetch();
            const member = members.find(m =>
                m.user.username.toLowerCase() === discordUsername.toLowerCase() ||
                (m.user.tag && m.user.tag.toLowerCase() === discordUsername.toLowerCase())
            );
            if (member) {
                targetUser = member.user;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).send("Discord user not found. Make sure the username is correct and the bot is in a server with this user.");
        }

        await targetUser.send(`Your verification code is: **${code}**`);
        res.send("✅ Verification code sent via Discord DM!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to send DM. Make sure the user allows DMs from this bot.");
    }
});

module.exports = router;
