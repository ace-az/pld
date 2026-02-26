// server/routes/users.js
const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/mentors', async (req, res) => {
    try {
        const mentors = await userModel.getMentors();
        res.json(mentors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
