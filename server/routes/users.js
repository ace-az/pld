// server/routes/users.js
const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/mentors:
 *   get:
 *     summary: Get all mentors
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of mentors
 */
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await userModel.getMentors();
        res.json(mentors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin only routes (Ideally protected, but relying on authMiddleware atm)

/**
 * @swagger
 * /api/users/admin:
 *   get:
 *     summary: Get all users (Admin view)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all users
 */
router.get('/admin', async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/admin/{id}:
 *   delete:
 *     summary: Delete user (Admin)
 *     tags: [Users]
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
 *         description: User deleted
 */
router.delete('/admin/:id', async (req, res) => {
    try {
        await userModel.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
