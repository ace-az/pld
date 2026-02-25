// server/models/sessionModel.js
const { supabase } = require('./db');
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
    const { data: selectedSets } = await supabase.from('questions').select('*').in('id', ids);

    // Aggregate questions and topic names
    let allQuestions = [];
    let topicNames = [];

    (selectedSets || []).forEach(set => {
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
        students
    };

    const { data, error } = await supabase.from('sessions').insert([session]).select().single();
    if (error) {
        console.error("Error creating session:", error);
        throw error;
    }
    return data;
}

async function joinSession(sessionId, studentData) {
    const { data: session, error: getError } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
    if (getError || !session) throw new Error('Session not found');

    // Check if student already joined (by discord handle)
    const students = session.students || [];
    const exists = students.find(s => s.discord && s.discord.toLowerCase() === studentData.discord.toLowerCase());
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

    students.push(newStudent);

    const { data, error } = await supabase.from('sessions').update({ students }).eq('id', sessionId).select().single();
    if (error) {
        console.error("Error joining session:", error);
        throw error;
    }
    return data;
}

async function getSessionsByMentor(mentorId) {
    const { data, error } = await supabase.from('sessions').select('*').eq('mentorId', mentorId);
    if (error) console.error("Error getting sessions by mentor:", error);
    return data || [];
}

async function getSessionsForStudent(username) {
    const { data: sessions, error } = await supabase.from('sessions').select('*');
    if (error) {
        console.error("Error getting sessions for student:", error);
        return [];
    }

    return sessions.filter(session => (session.students || []).some(s => s.discord && s.discord.toLowerCase() === username.toLowerCase()));
}

async function getJoinableSessions(username) {
    const now = new Date();
    const { data: sessions, error } = await supabase.from('sessions').select('*');
    if (error) {
        console.error("Error getting joinable sessions:", error);
        return [];
    }

    return sessions.filter(session => {
        const isFuture = new Date(session.createdAt) >= new Date(now.setHours(0, 0, 0, 0));
        const isCompleted = session.status === 'completed';
        const alreadyJoined = (session.students || []).some(s => s.discord && s.discord.toLowerCase() === username.toLowerCase());
        return isFuture && !isCompleted && !alreadyJoined;
    });
}

async function getSessionById(id) {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).maybeSingle();
    if (error) console.error("Error getting session by id:", error);
    return data;
}

async function updateStudentNote(sessionId, studentId, noteContent) {
    const { data: session, error: fetchErr } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
    if (fetchErr || !session) return null;

    const students = session.students || [];
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return null;

    students[studentIndex].notes = noteContent;

    const { data, error } = await supabase.from('sessions').update({ students }).eq('id', sessionId).select().single();
    if (error) {
        console.error("Error updating student note:", error);
        return null;
    }
    return students[studentIndex];
}

async function updateStudentResult(sessionId, studentId, resultSummary) {
    const { data: session, error: fetchErr } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
    if (fetchErr || !session) return null;

    const students = session.students || [];
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return null;

    students[studentIndex].result = resultSummary;

    const { data, error } = await supabase.from('sessions').update({ students }).eq('id', sessionId).select().single();
    if (error) {
        console.error("Error updating student result:", error);
        return null;
    }
    return students[studentIndex];
}

async function updateStudentQuestions(sessionId, studentId, { answered, incorrect }) {
    const { data: session, error: fetchErr } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
    if (fetchErr || !session) return null;

    const students = session.students || [];
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return null;

    if (answered) students[studentIndex].answeredQuestions = answered;
    if (incorrect) students[studentIndex].incorrectQuestions = incorrect;

    const { data, error } = await supabase.from('sessions').update({ students }).eq('id', sessionId).select().single();
    if (error) {
        console.error("Error updating student questions:", error);
        return null;
    }
    return students[studentIndex];
}

async function completeSession(sessionId) {
    const { data, error } = await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId).select().single();
    if (error) console.error("Error completing session:", error);
    return data;
}

async function deleteSession(sessionId) {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (error) console.error("Error deleting session:", error);
    return !error;
}

async function deleteAllSessions(mentorId) {
    const { error } = await supabase.from('sessions').delete().eq('mentorId', mentorId);
    if (error) console.error("Error deleting all sessions:", error);
    return !error;
}

async function updateStudentStatus(sessionId, studentId, status) {
    const { data: session, error: fetchErr } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
    if (fetchErr || !session) return null;

    const students = session.students || [];
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return null;

    students[studentIndex].status = status;

    const { data, error } = await supabase.from('sessions').update({ students }).eq('id', sessionId).select().single();
    if (error) {
        console.error("Error updating student status:", error);
        return null;
    }
    return students[studentIndex];
}

async function updateStudentGrade(sessionId, studentId, grade) {
    const { data: session, error: fetchErr } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
    if (fetchErr || !session) return null;

    const students = session.students || [];
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return null;

    students[studentIndex].grade = grade;

    const { data, error } = await supabase.from('sessions').update({ students }).eq('id', sessionId).select().single();
    if (error) {
        console.error("Error updating student grade:", error);
        return null;
    }
    return students[studentIndex];
}

async function getLeaderboard() {
    const { data: sessions, error } = await supabase.from('sessions').select('students').eq('status', 'completed');
    if (error) {
        console.error("Error getting leaderboard sessions:", error);
        return [];
    }

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

    const leaderboardStudents = Object.values(studentStats);

    // Calculate global metrics for Bayesian Average
    let totalGlobalGrade = 0;
    let totalGlobalSessions = 0;

    leaderboardStudents.forEach(s => {
        totalGlobalGrade += s.totalGrade;
        totalGlobalSessions += s.sessionsCount;
    });

    // C = global average grade across all students and sessions
    const C = totalGlobalSessions > 0 ? (totalGlobalGrade / totalGlobalSessions) : 0;

    // m = average number of sessions per student
    const m = leaderboardStudents.length > 0 ? (totalGlobalSessions / leaderboardStudents.length) : 0;

    const leaderboard = leaderboardStudents
        .map(s => {
            const v = s.sessionsCount;
            const R = v > 0 ? (s.totalGrade / v) : 0;

            // Bayesian Average Formula: (v / (v + m)) * R + (m / (v + m)) * C
            const bayesianAverage = (v + m) > 0
                ? ((v / (v + m)) * R) + ((m / (v + m)) * C)
                : 0;

            return {
                name: s.name,
                discord: s.discord,
                averageGrade: bayesianAverage.toFixed(2),
                sessionsCount: s.sessionsCount,
                totalGrade: s.totalGrade
            };
        })
        .sort((a, b) => parseFloat(b.averageGrade) - parseFloat(a.averageGrade));

    return leaderboard;
}

module.exports = { createSession, joinSession, getSessionsByMentor, getSessionsForStudent, getJoinableSessions, getSessionById, updateStudentNote, updateStudentResult, updateStudentQuestions, completeSession, deleteSession, deleteAllSessions, updateStudentStatus, updateStudentGrade, getLeaderboard };
