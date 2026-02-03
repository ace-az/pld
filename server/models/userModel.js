// server/models/userModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function createUser(username, password, discordId, role = 'student') {
    // db.read() is not needed for FileSync
    const user = {
        id: uuidv4(),
        username,
        password, // In prod, hash this! We'll do basic hashing in controller
        discordId,
        role,
        createdAt: new Date().toISOString()
    };
    db.get('users').push(user).write();
    return user;
}

async function findUserByUsername(username) {
    return db.get('users').find({ username }).value();
}

async function findUserById(id) {
    return db.get('users').find({ id }).value();
}

module.exports = { createUser, findUserByUsername, findUserById };
