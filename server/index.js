const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const dns = require('node:dns');
const { assertJwtSecretOrThrow } = require('./utils/envValidation');

// Fix for Node.js 17+ on Render silently hanging on Discord IPv6 WebSockets
dns.setDefaultResultOrder('ipv4first');

dotenv.config();
assertJwtSecretOrThrow();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Normalize double slashes in URL
app.use((req, res, next) => {
    req.url = req.url.replace(/\/{2,}/g, '/');
    next();
});

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

client.on('debug', console.log);
client.on('error', console.error);
client.on('warn', console.warn);
client.on('ready', () => console.log('Client has emitted the ready event!'));

if (process.env.DISCORD_TOKEN) {
    const t = process.env.DISCORD_TOKEN;
    console.log(`[DISCORD] Connecting with token starting with ${t.substring(0, 5)}... length: ${t.length}`);

    console.log('[DIAGNOSTICS] Pinging Discord API natively to check for Render IP blocks...');
    fetch('https://discord.com/api/v10/gateway/bot', {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
        signal: AbortSignal.timeout(10000)
    }).then(async res => {
        console.log(`[DIAGNOSTICS] SUCCESS! Status: ${res.status} ${res.statusText}`);
        const body = await res.text();
        console.log(`[DIAGNOSTICS] Body: ${body.substring(0, 150)}`);
    }).catch(err => {
        console.error('[DIAGNOSTICS] FAILED TO PING DISCORD:', err.message);
    });

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
app.use('/api/profile', require('./routes/profile'));
app.use('/api/users', require('./routes/users'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/majors', require('./routes/majors'));


app.get('/', (req, res) => {
    res.send('PLD Management API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
