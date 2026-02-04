// server/routes/sessions.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.post('/', sessionController.createSession);
router.get('/', sessionController.getMySessions);
router.get('/:id', sessionController.getSession);
router.put('/:sessionId/students/:studentId/notes', sessionController.updateNote);
router.put('/:sessionId/students/:studentId/result', sessionController.saveResult);
router.put('/:sessionId/students/:studentId/status', sessionController.toggleStatus);
router.post('/:sessionId/students/:studentId/send', sessionController.sendFeedback);
router.post('/:sessionId/send-all', sessionController.sendAllFeedback);
router.delete('/all', sessionController.deleteAllSessions);
router.delete('/:id', sessionController.deleteSession);
router.post('/:id/end', sessionController.endSession);

module.exports = router;
