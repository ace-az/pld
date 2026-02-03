// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, findUserByUsername } = require('../models/userModel');

const SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res) => {
    try {
        const { username, password, discordId, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

        const existing = await findUserByUsername(username);
        if (existing) return res.status(400).json({ error: 'Username taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await createUser(username, hashedPassword, discordId, role);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
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

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
