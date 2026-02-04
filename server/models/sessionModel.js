// server/models/sessionModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function createSession(mentorId, groupName, studentsData, topicId) {
    // studentsData = [{ name, discord }]
    const students = studentsData.map(s => ({
        id: uuidv4(),
        name: s.name,
        discord: s.discord,
        notes: '',
        result: null // AI result
    }));

    // Fetch snapshot of questions from the topic set
    const questionSet = db.get('questions').find({ id: topicId }).value();
    const questions = questionSet ? questionSet.questions : [];

    const session = {
        id: uuidv4(),
        mentorId,
        groupName,
        topicId,
        topicName: questionSet ? questionSet.topic : 'General',
        questions, // Snapshot of questions at creation
        status: 'active', // active, completed
        createdAt: new Date().toISOString(),
        students
    };

    db.get('sessions').push(session).write();
    return session;
}

async function getSessionsByMentor(mentorId) {
    return db.get('sessions').filter({ mentorId }).value();
}

async function getSessionById(id) {
    return db.get('sessions').find({ id }).value();
}

async function updateStudentNote(sessionId, studentId, noteContent) {
    const session = db.get('sessions').find({ id: sessionId }).value();
    if (!session) return null;

    const student = session.students.find(s => s.id === studentId);
    if (!student) return null;

    // Direct mutation works in lowdb v1 because objects are references, 
    // but .write() must be called on the chain or DB instance to persist.
    // Cleanest way in v1 is to use .assign() or similar, but for deep nested update:
    student.notes = noteContent;
    db.write(); // Persist changes

    return student;
}

async function updateStudentResult(sessionId, studentId, resultSummary) {
    const session = db.get('sessions').find({ id: sessionId }).value();
    if (!session) return null;

    const student = session.students.find(s => s.id === studentId);
    if (!student) return null;

    student.result = resultSummary;
    db.write(); // Persist
    return student;
}

async function completeSession(sessionId) {
    db.get('sessions')
        .find({ id: sessionId })
        .assign({ status: 'completed' })
        .write();

    // Return updated
    return db.get('sessions').find({ id: sessionId }).value();
}

async function deleteSession(sessionId) {
    db.get('sessions')
        .remove({ id: sessionId })
        .write();
    return true;
}

module.exports = { createSession, getSessionsByMentor, getSessionById, updateStudentNote, updateStudentResult, completeSession, deleteSession };
