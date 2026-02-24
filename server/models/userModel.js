// server/models/userModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function createUser(username, password, discordId, role = 'student', major = '') {
    // db.read() is not needed for FileSync
    const user = {
        id: uuidv4(),
        username,
        password, // In prod, hash this! We'll do basic hashing in controller
        discordId,
        firstName: '',
        lastName: '',
        avatar: '',
        role,
        major,
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

async function findUserByDiscordId(discordId) {
    if (!discordId) return null;
    // Search effectively case-insensitive or exact? 
    // Usually Discord usernames are case-sensitive but let's do strict match for now as per registration.
    return db.get('users').find({ discordId }).value();
}

async function getAllStudentUsers() {
    return db.get('users').filter({ role: 'student' }).value();
}

async function getAllUsers() {
    return db.get('users').value();
}

async function deleteUser(id) {
    return db.get('users').remove({ id }).write();
}

async function updateUserPasswordByUserId(userId, newPassword) {
    return db.get('users')
        .find({ id: userId })
        .assign({ password: newPassword })
        .write();
}

async function updateUserProfile(userId, updates) {
    const allowed = ['username', 'firstName', 'lastName', 'discordId', 'avatar', 'major'];
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
        if (allowed.includes(key)) filteredUpdates[key] = updates[key];
    });

    return db.get('users')
        .find({ id: userId })
        .assign(filteredUpdates)
        .write();
}

module.exports = {
    createUser,
    findUserByUsername,
    findUserById,
    findUserByDiscordId,
    updateUserPassword: updateUserPasswordByUserId,
    updateUserProfile,
    getAllStudentUsers,
    getAllUsers,
    deleteUser
};
