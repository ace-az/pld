// server/models/studentModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function getStudents(mentorId) {
    return db.get('students').filter({ mentorId }).value();
}

async function addStudent(mentorId, name, discord, major) {
    if (discord) {
        const exists = db.get('students').find({ mentorId, discord }).value();
        if (exists) return exists;
    }

    const student = {
        id: uuidv4(),
        mentorId,
        name,
        discord,
        major: major || '',
        createdAt: new Date().toISOString()
    };
    db.get('students').push(student).write();
    return student;
}

async function updateStudent(id, data) {
    const student = db.get('students').find({ id }).assign(data).write();
    return student;
}

async function deleteStudent(id) {
    db.get('students').remove({ id }).write();
    return true;
}

async function bulkAddStudents(mentorId, studentsArray) {
    const existingDiscordNames = new Set(
        db.get('students').filter({ mentorId }).value().map(s => s.discord).filter(Boolean)
    );

    const newStudents = [];
    const processedDiscordNames = new Set();

    for (const s of studentsArray) {
        const discord = s.discord ? s.discord.trim() : '';

        // Skip if discord exists in DB OR already processed in this batch
        if (discord && (existingDiscordNames.has(discord) || processedDiscordNames.has(discord))) {
            continue;
        }

        newStudents.push({
            id: uuidv4(),
            mentorId,
            name: s.name,
            discord: discord,
            major: s.major || '',
            createdAt: new Date().toISOString()
        });

        if (discord) {
            processedDiscordNames.add(discord);
        }
    }

    if (newStudents.length > 0) {
        const currentStudents = db.get('students').value();
        db.set('students', [...currentStudents, ...newStudents]).write();
    }

    return newStudents;
}

async function deleteAllStudents(mentorId) {
    db.get('students')
        .remove({ mentorId })
        .write();
    return true;
}

module.exports = { getStudents, addStudent, updateStudent, deleteStudent, bulkAddStudents, deleteAllStudents };
