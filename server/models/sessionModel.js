// server/models/sessionModel.js
const { supabase } = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');

async function createSession(mentorId, groupName, studentsData, topicIds) {
    // studentsData = [{ name, discord, major }]
    const students = studentsData.map(s => ({
        id: uuidv4(),
        name: s.name,
        discord: s.discord,
        major: s.major || '',
        notes: '',
        grade: 0,
        status: 'present',
        result: null,
        answeredQuestions: [],
        incorrectQuestions: []
    }));

    const ids = Array.isArray(topicIds) ? topicIds : [topicIds];

    // Fetch snapshot of questions from all selected topic sets
    // Supabase .in() expects an array
    const { data: selectedSets, error: qError } = await supabase
        .from('questions')
        .select('*')
        .in('id', ids);

    if (qError) {
        console.error('Error fetching questions for session:', qError);
        throw qError;
    }

    let allQuestions = [];
    let topicNames = [];

    selectedSets.forEach(set => {
        if (set.questions) {
            // Add topic context to each question
            const contextQuestions = set.questions.map(q => ({
                ...(typeof q === 'string' ? { text: q } : q),
                topicName: set.topic
            }));
            allQuestions = [...allQuestions, ...contextQuestions];
        }
        topicNames.push(set.topic);
    });

    const sessionData = {
        mentorId,
        groupName,
        topicIds: ids,
        topicNames: topicNames,
        topicName: topicNames.join(', '),
        questions: allQuestions,
        status: 'active',
        students
    };

    const { data, error } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()
        .single();

    if (error) {
        console.error('Error creating session:', error);
        throw error;
    }

    return data;
}

async function getSessionsByMentor(mentorId) {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('mentorId', mentorId);

    if (error) {
        console.error('Error getting sessions by mentor:', error);
        return [];
    }
    return data;
}

async function getSessionsForStudent(username) {
    // Filter sessions where 'students' JSONB column contains an object with discord: username
    // Use the @> contains operator
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .contains('students', JSON.stringify([{ discord: username }]));

    if (error) {
        console.error('Error getting sessions for student:', error);
        return [];
    }
    return data;
}

async function getSessionById(id) {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting session by id:', error);
        return null;
    }
    return data;
}

// Helper to update a specific student in the session
async function updateSessionStudent(sessionId, studentId, updateFn) {
    // 1. Fetch
    const { data: session, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (fetchError || !session) return null;

    // 2. Modify
    const studentIndex = session.students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return null;

    const updatedStudent = { ...session.students[studentIndex] };
    updateFn(updatedStudent);

    const newStudents = [...session.students];
    newStudents[studentIndex] = updatedStudent;

    // 3. Update
    const { error: updateError } = await supabase
        .from('sessions')
        .update({ students: newStudents })
        .eq('id', sessionId);

    if (updateError) {
        console.error('Error updating session student:', updateError);
        return null;
    }
    return updatedStudent;
}

async function updateStudentNote(sessionId, studentId, noteContent) {
    return updateSessionStudent(sessionId, studentId, (s) => {
        s.notes = noteContent;
    });
}

async function updateStudentResult(sessionId, studentId, resultSummary) {
    return updateSessionStudent(sessionId, studentId, (s) => {
        s.result = resultSummary;
    });
}

async function updateStudentQuestions(sessionId, studentId, { answered, incorrect }) {
    return updateSessionStudent(sessionId, studentId, (s) => {
        if (answered) s.answeredQuestions = answered;
        if (incorrect) s.incorrectQuestions = incorrect;
    });
}

async function completeSession(sessionId) {
    const { data, error } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) {
        console.error('Error completing session:', error);
        return null; // Or throw
    }
    return data;
}

async function deleteSession(sessionId) {
    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error('Error deleting session:', error);
        return false;
    }
    return true;
}

async function deleteAllSessions(mentorId) {
    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('mentorId', mentorId);

    if (error) {
        console.error('Error deleting all sessions:', error);
        return false;
    }
    return true;
}

async function updateStudentStatus(sessionId, studentId, status) {
    return updateSessionStudent(sessionId, studentId, (s) => {
        s.status = status;
    });
}

async function updateStudentGrade(sessionId, studentId, grade) {
    return updateSessionStudent(sessionId, studentId, (s) => {
        s.grade = grade;
    });
}

async function getLeaderboard() {
    // Cannot do complex aggregation on JSONB inside supabase easily without stored procedures.
    // We will fetch all completed sessions and aggregate in JS, same as before.
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'completed');

    if (error) {
        console.error('Error getting leaderboard data:', error);
        return [];
    }

    const studentStats = {};

    sessions.forEach(session => {
        if (!session.students || !Array.isArray(session.students)) return;

        session.students.forEach(student => {
            if (!student.discord || student.status === 'absent') return;
            const grade = student.grade || 0;
            if (grade === 0) return;

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

module.exports = { createSession, getSessionsByMentor, getSessionsForStudent, getSessionById, updateStudentNote, updateStudentResult, updateStudentQuestions, completeSession, deleteSession, deleteAllSessions, updateStudentStatus, updateStudentGrade, getLeaderboard };
