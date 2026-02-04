// server/routes/students.js
const express = require('express');
const router = express.Router();
const studentModel = require('../models/studentModel');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const students = await studentModel.getStudents(req.user.id);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, discord } = req.body;
        const student = await studentModel.addStudent(req.user.id, name, discord);
        res.json(student);
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

router.delete('/:id', async (req, res) => {
    try {
        await studentModel.deleteStudent(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
