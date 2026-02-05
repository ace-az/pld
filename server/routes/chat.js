// server/routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/history', chatController.getHistory);
router.post('/save', chatController.saveMessage);

module.exports = router;
