// server/routes/students.js
const express = require('express');
const router = express.Router();
const studentModel = require('../models/studentModel');
const userModel = require('../models/userModel');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        // 1. Get manually added students for this mentor
        const students = await studentModel.getStudents(req.user.id);

        // 2. Get all registered users with role 'student' (Global pool)
        const studentUsers = await userModel.getAllStudentUsers();

        // 3. Merge: Prioritize manually added students (they might have custom notes/names)
        // Add users who are NOT in the students list yet.
        const discordSet = new Set(students.map(s => s.discord ? s.discord.toLowerCase() : ''));

        const mergedList = [...students];

        studentUsers.forEach(user => {
            const discord = user.discordId ? user.discordId.toLowerCase() : '';
            if (discord && !discordSet.has(discord)) {
                mergedList.push({
                    id: user.id, // Use User ID
                    mentorId: 'global', // Placeholder
                    name: user.username, // Default to username
                    discord: user.discordId,
                    major: user.major || '',
                    createdAt: user.createdAt,
                    isUser: true // Flag to indicate source
                });
                discordSet.add(discord); // Prevent duplicates if multiple users have same discord? (Shouldn't happen)
            }
        });

        res.json(mergedList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, discord, major } = req.body;
        const student = await studentModel.addStudent(req.user.id, name, discord, major);
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/bulk', async (req, res) => {
    try {
        const { students } = req.body; // Array of { name, discord }
        if (!Array.isArray(students)) {
            return res.status(400).json({ error: 'Data must be an array of students' });
        }
        const created = await studentModel.bulkAddStudents(req.user.id, students);
        res.json(created);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const student = await studentModel.updateStudent(req.params.id, req.body);
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/all', async (req, res) => {
    try {
        await studentModel.deleteAllStudents(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await studentModel.deleteStudent(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
