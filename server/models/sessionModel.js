// server/models/sessionModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function createSession(mentorId, groupName, studentsData = [], topicIds, customDate = null, scheduledTime = null) {
    // studentsData = [{ name, discord }]
    const students = (studentsData || []).map(s => ({
        id: uuidv4(),
        name: s.name,
        discord: s.discord,
        major: s.major || '',
        notes: '',
        grade: 0, // Default grade
        status: 'present', // Default status
        result: null, // AI result
        answeredQuestions: [], // Tracking covered questions IDs
        incorrectQuestions: [] // Tracking incorrect questions IDs
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
        createdAt: customDate || new Date().toISOString(),
        scheduledTime, // Added field for 3 am, etc.
        students
    };

    db.get('sessions').push(session).write();
    return session;
}

async function joinSession(sessionId, studentData) {
    const session = db.get('sessions').find({ id: sessionId }).value();
    if (!session) throw new Error('Session not found');

    // Check if student already joined (by discord handle)
    const exists = session.students.find(s => s.discord.toLowerCase() === studentData.discord.toLowerCase());
    if (exists) return session;

    const newStudent = {
        id: uuidv4(),
        name: studentData.name,
        discord: studentData.discord,
        major: studentData.major || '',
        notes: '',
        grade: 0,
        status: 'present',
        result: null,
        answeredQuestions: [],
        incorrectQuestions: []
    };

    session.students.push(newStudent);
    db.write();
    return session;
}

async function getSessionsByMentor(mentorId) {
    return db.get('sessions').filter({ mentorId }).value();
}

async function getSessionsForStudent(username) {
    // Filter sessions where any student in the 'students' array matches the username
    // Note: session.students contains objects like { name, discord, id }
    // We should match by 'discord' username since that's our unique identifier from login
    return db.get('sessions')
        .filter(session => session.students.some(s => s.discord && s.discord.toLowerCase() === username.toLowerCase()))
        .value();
}

async function getJoinableSessions(username) {
    // Return future sessions that the student is NOT already part of
    const now = new Date();
    return db.get('sessions')
        .filter(session => {
            const isFuture = new Date(session.createdAt) >= new Date(now.setHours(0, 0, 0, 0));
            const isCompleted = session.status === 'completed';
            const alreadyJoined = session.students.some(s => s.discord && s.discord.toLowerCase() === username.toLowerCase());
            return isFuture && !isCompleted && !alreadyJoined;
        })
        .value();
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

async function updateStudentQuestions(sessionId, studentId, { answered, incorrect }) {
    const session = db.get('sessions').find({ id: sessionId }).value();
    if (!session) return null;

    const student = session.students.find(s => s.id === studentId);
    if (!student) return null;

    if (answered) student.answeredQuestions = answered;
    if (incorrect) student.incorrectQuestions = incorrect;

    db.write();
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

async function updateStudentGrade(sessionId, studentId, grade) {
    const session = db.get('sessions').find({ id: sessionId }).value();
    if (!session) return null;

    const student = session.students.find(s => s.id === studentId);
    if (!student) return null;

    student.grade = grade;
    db.write();
    return student;
}

// Aggregate grades across all completed sessions per student and return sorted leaderboard
async function getLeaderboard() {
    const sessions = db.get('sessions').filter({ status: 'completed' }).value();

    // Map: discordId -> { name, totalGrade, count }
    const studentStats = {};

    sessions.forEach(session => {
        if (!session.students) return;

        session.students.forEach(student => {
            if (!student.discord || student.status === 'absent') return;
            const grade = student.grade || 0;
            if (grade === 0) return; // Skip ungraded

            const key = student.discord.toLowerCase();
            if (!studentStats[key]) {
                studentStats[key] = {
                    name: student.name,
                    discord: student.discord,
                    totalGrade: 0,
                    sessionsCount: 0,
                    grades: []
                };
            }
            studentStats[key].totalGrade += grade;
            studentStats[key].sessionsCount += 1;
            studentStats[key].grades.push(grade);
        });
    });

    // Convert to array and calculate averages
    const leaderboard = Object.values(studentStats)
        .map(s => ({
            name: s.name,
            discord: s.discord,
            averageGrade: s.sessionsCount > 0 ? (s.totalGrade / s.sessionsCount).toFixed(2) : 0,
            sessionsCount: s.sessionsCount,
            totalGrade: s.totalGrade
        }))
        .sort((a, b) => parseFloat(b.averageGrade) - parseFloat(a.averageGrade));

    return leaderboard;
}

module.exports = { createSession, joinSession, getSessionsByMentor, getSessionsForStudent, getJoinableSessions, getSessionById, updateStudentNote, updateStudentResult, updateStudentQuestions, completeSession, deleteSession, deleteAllSessions, updateStudentStatus, updateStudentGrade, getLeaderboard };
