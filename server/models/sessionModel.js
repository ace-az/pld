// server/models/sessionModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function createSession(mentorId, groupName, studentsData, topicIds) {
    // studentsData = [{ name, discord }]
    const students = studentsData.map(s => ({
        id: uuidv4(),
        name: s.name,
        discord: s.discord,
        notes: '',
        status: 'present', // Default status
        result: null // AI result
    }));

    // topicIds is expected to be an array
    const ids = Array.isArray(topicIds) ? topicIds : [topicIds];

    // Fetch snapshot of questions from all selected topic sets
    const selectedSets = db.get('questions').filter(q => ids.includes(q.id)).value();

    // Aggregate questions and topic names
    let allQuestions = [];
    let topicNames = [];

    selectedSets.forEach(set => {
        if (set.questions) {
            // Add topic context to each question for better UI inside the session
            const contextQuestions = set.questions.map(q => ({
                ...(typeof q === 'string' ? { text: q } : q),
                topicName: set.topic
            }));
            allQuestions = [...allQuestions, ...contextQuestions];
        }
        topicNames.push(set.topic);
    });

    const session = {
        id: uuidv4(),
        mentorId,
        groupName,
        topicIds: ids,
        topicNames: topicNames, // Array of selected topic names
        topicName: topicNames.join(', '), // Comma separated string for backward compatibility/simpler display
        questions: allQuestions, // Combined snapshot of questions
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

async function deleteAllSessions(mentorId) {
    db.get('sessions')
        .remove({ mentorId })
        .write();
    return true;
}

async function updateStudentStatus(sessionId, studentId, status) {
    const session = db.get('sessions').find({ id: sessionId }).value();
    if (!session) return null;

    const student = session.students.find(s => s.id === studentId);
    if (!student) return null;

    student.status = status; // 'present' or 'absent'

    // Optional: Clear notes/result if marked absent? 
    // For now, let's keep them but UI will disable editing.
    // If regenerating report, we might skip absent students.

    db.write();
    return student;
}

module.exports = { createSession, getSessionsByMentor, getSessionById, updateStudentNote, updateStudentResult, completeSession, deleteSession, deleteAllSessions, updateStudentStatus };
