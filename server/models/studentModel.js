// server/models/studentModel.js
const { supabase } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function getStudents(mentorId) {
    const { data, error } = await supabase.from('students').select('*').eq('mentorId', mentorId);
    if (error) console.error("Error getting students:", error);
    return data || [];
}

async function addStudent(mentorId, name, discord, major) {
    if (discord) {
        const { data: exists } = await supabase.from('students').select('*').eq('mentorId', mentorId).eq('discord', discord).maybeSingle();
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

    const { data, error } = await supabase.from('students').insert([student]).select().single();
    if (error) {
        console.error("Error adding student:", error);
        throw error;
    }
    return data;
}

async function updateStudent(id, updateData) {
    const { data, error } = await supabase.from('students').update(updateData).eq('id', id).select().single();
    if (error) {
        console.error("Error updating student:", error);
        throw error;
    }
    return data;
}

async function deleteStudent(id) {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) console.error("Error deleting student:", error);
    return !error;
}

async function bulkAddStudents(mentorId, studentsArray) {
    const { data: existingStudents } = await supabase.from('students').select('discord').eq('mentorId', mentorId);
    const existingDiscordNames = new Set(
        (existingStudents || []).map(s => s.discord).filter(Boolean)
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
        const { error } = await supabase.from('students').insert(newStudents);
        if (error) console.error("Error bulk adding students:", error);
    }

    return newStudents;
}

async function deleteAllStudents(mentorId) {
    const { error } = await supabase.from('students').delete().eq('mentorId', mentorId);
    if (error) console.error("Error deleting all students:", error);
    return !error;
}

module.exports = { getStudents, addStudent, updateStudent, deleteStudent, bulkAddStudents, deleteAllStudents };
