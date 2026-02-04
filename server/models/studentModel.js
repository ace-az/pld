// server/models/studentModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function getStudents(mentorId) {
    return db.get('students').filter({ mentorId }).value();
}

async function addStudent(mentorId, name, discord) {
    const student = {
        id: uuidv4(),
        mentorId,
        name,
        discord,
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

module.exports = { getStudents, addStudent, updateStudent, deleteStudent };
