const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Discord Bot Setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
// app.use('/api/students', require('./routes/students'));

app.get('/', (req, res) => {
    res.send('PLD Management API is running');
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
