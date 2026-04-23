// server/routes/majors.js
const express = require('express');
const router = express.Router();
const majorModel = require('../models/majorModel');
const authMiddleware = require('../utils/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Majors
 *   description: Major operations
 */

/**
 * @swagger
 * /api/majors:
 *   get:
 *     summary: Get all majors
 *     tags: [Majors]
 *     responses:
 *       200:
 *         description: Array of majors
 */
router.get('/', async (req, res) => {
    try {
        const majors = await majorModel.getMajors();
        res.json(majors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/majors:
 *   post:
 *     summary: Add a new major
 *     tags: [Majors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Major added
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Major name is required' });

        // Admin check could go here if we had robust roles, but we'll accept it for now
        const major = await majorModel.addMajor(name);
        res.json(major);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/majors/{id}:
 *   delete:
 *     summary: Delete a major
 *     tags: [Majors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Major deleted
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await majorModel.deleteMajor(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
