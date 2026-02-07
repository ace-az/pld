// server/models/studentModel.js
const { supabase } = require('../utils/supabaseClient');

async function getStudents(mentorId) {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('mentorId', mentorId);

    if (error) {
        console.error('Error getting students:', error);
        return [];
    }
    return data;
}

async function addStudent(mentorId, name, discord, major) {
    // Check existence
    if (discord) {
        const { data: existing } = await supabase
            .from('students')
            .select('*')
            .eq('mentorId', mentorId)
            .eq('discord', discord)
            .single();

        if (existing) return existing;
    }

    const { data, error } = await supabase
        .from('students')
        .insert([
            { mentorId, name, discord, major }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error adding student:', error);
        throw error;
    }
    return data;
}

async function updateStudent(id, data) {
    const { data: updated, error } = await supabase
        .from('students')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating student:', error);
        return null;
    }
    return updated;
}

async function deleteStudent(id) {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting student:', error);
        return false;
    }
    return true;
}

async function bulkAddStudents(mentorId, studentsArray) {
    // Fetch existing students for this mentor to avoid duplicates
    const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('discord')
        .eq('mentorId', mentorId);

    if (fetchError) {
        console.error('Error fetching existing students for bulk add:', fetchError);
        return [];
    }

    const existingDiscordNames = new Set(
        existingStudents.map(s => s.discord).filter(Boolean)
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
            mentorId,
            name: s.name,
            discord: discord,
            major: s.major || ''
        });

        if (discord) {
            processedDiscordNames.add(discord);
        }
    }

    if (newStudents.length > 0) {
        const { data, error } = await supabase
            .from('students')
            .insert(newStudents)
            .select();

        if (error) {
            console.error('Error bulk adding students:', error);
            throw error;
        }
        return data;
    }

    return [];
}

async function deleteAllStudents(mentorId) {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('mentorId', mentorId);

    if (error) {
        console.error('Error deleting all students:', error);
        return false;
    }
    return true;
}

module.exports = { getStudents, addStudent, updateStudent, deleteStudent, bulkAddStudents, deleteAllStudents };
