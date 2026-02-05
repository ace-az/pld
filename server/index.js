const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const verifications = {};
module.exports.verifications = verifications;

// Discord Bot Setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel] // Required to receive DMs
});

if (process.env.DISCORD_TOKEN) {
    client.login(process.env.DISCORD_TOKEN).then(() => {
        console.log(`Logged in as ${client.user.tag}!`);
    }).catch(err => {
        console.error('Discord login failed:', err);
    });
} else {
    console.log('No DISCORD_TOKEN found in .env, skipping Discord login.');
}

// Make discord client available in routes
app.use((req, res, next) => {
    req.discordClient = client;
    next();
});

// Discord Verification Routes
app.use('/register', require('./routes/register'));
app.use('/verify', require('./routes/verify'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/students', require('./routes/students'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('PLD Management API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
