// server/routes/questions.js
const express = require('express');
const router = express.Router();
const questionModel = require('../models/questionModel');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question set management
 */

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get user's question sets
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of question sets
 */
router.get('/', async (req, res) => {
    try {
        const sets = await questionModel.getQuestionSets(req.user.id);
        res.json(sets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question set
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               major:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Question set created
 */
router.post('/', async (req, res) => {
    try {
        const { topic, questions, major } = req.body;
        if (!topic || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Topic and questions array are required' });
        }
        const set = await questionModel.addQuestionSet(req.user.id, topic, questions, major);
        res.json(set);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update a question set
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               major:
 *                 type: string
 *               questions:
 *                 type: array
 *     responses:
 *       200:
 *         description: Question set updated
 */
router.put('/:id', async (req, res) => {
    try {
        const set = await questionModel.updateQuestionSet(req.params.id, req.body);
        res.json(set);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/questions/{id}/share:
 *   put:
 *     summary: Share a question set with mentors
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetMentorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Question set shared
 */
router.put('/:id/share', async (req, res) => {
    try {
        const { targetMentorIds } = req.body;
        if (!Array.isArray(targetMentorIds)) {
            return res.status(400).json({ error: 'targetMentorIds must be an array' });
        }
        const set = await questionModel.shareQuestionSet(req.params.id, req.user.id, targetMentorIds);
        res.json(set);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/questions/all:
 *   delete:
 *     summary: Delete all question sets for the user
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sets deleted
 */
router.delete('/all', async (req, res) => {
    try {
        await questionModel.deleteAllQuestionSets(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a specific question set
 *     tags: [Questions]
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
 *         description: Question set deleted
 */
router.delete('/:id', async (req, res) => {
    try {
        await questionModel.deleteQuestionSet(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
