// server/models/chatModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

// Ensure 'chats' collection exists
if (!db.get('chats').value()) {
    db.defaults({ chats: [] }).write();
}

async function getChatHistory(sessionId, studentId) {
    const chat = db.get('chats')
        .find({ sessionId, studentId })
        .value();

    return chat ? chat.messages : [];
}

async function addMessage(sessionId, studentId, role, content) {
    let chat = db.get('chats')
        .find({ sessionId, studentId })
        .value();

    const timestamp = new Date().toISOString();
    const newMessage = { role, content, timestamp };

    if (!chat) {
        // Create new chat entry if it doesn't exist
        chat = {
            id: uuidv4(),
            sessionId,
            studentId,
            messages: [newMessage],
            createdAt: timestamp,
            updatedAt: timestamp
        };
        db.get('chats').push(chat).write();
    } else {
        // Append message to existing chat
        db.get('chats')
            .find({ sessionId, studentId })
            .get('messages')
            .push(newMessage)
            .write();

        // Update timestamp
        db.get('chats')
            .find({ sessionId, studentId })
            .assign({ updatedAt: timestamp })
            .write();
    }

    return newMessage;
}

async function clearChat(sessionId, studentId) {
    db.get('chats')
        .remove({ sessionId, studentId })
        .write();
    return true;
}

module.exports = { getChatHistory, addMessage, clearChat };
