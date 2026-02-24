// server/models/questionModel.js
const { supabase } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function getQuestionSets(mentorId) {
    const { data, error } = await supabase.from('questions').select('*').eq('mentorId', mentorId);
    if (error) console.error("Error getting question sets:", error);
    return data || [];
}

async function addQuestionSet(mentorId, topic, questions) {
    // questions should be an array of strings
    const questionSet = {
        id: uuidv4(),
        mentorId,
        topic,
        questions: questions.map(q => ({ id: uuidv4(), text: q })),
        createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase.from('questions').insert([questionSet]).select().single();
    if (error) {
        console.error("Error adding question set:", error);
        throw error;
    }
    return data;
}

async function updateQuestionSet(id, updateData) {
    // updateData might contain topic and/or questions (array of strings)
    const payload = {};
    if (updateData.topic) payload.topic = updateData.topic;
    if (updateData.questions) {
        payload.questions = updateData.questions.map(q => ({ id: uuidv4(), text: q }));
    }

    const { data, error } = await supabase.from('questions').update(payload).eq('id', id).select().single();
    if (error) {
        console.error("Error updating question set:", error);
        throw error;
    }
    return data;
}

async function deleteQuestionSet(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) console.error("Error deleting question set:", error);
    return !error;
}

async function getQuestionSetById(id) {
    const { data, error } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
    if (error) console.error("Error getting question set by id:", error);
    return data;
}

async function deleteAllQuestionSets(mentorId) {
    const { error } = await supabase.from('questions').delete().eq('mentorId', mentorId);
    if (error) console.error("Error deleting all question sets:", error);
    return !error;
}

module.exports = { getQuestionSets, addQuestionSet, updateQuestionSet, deleteQuestionSet, getQuestionSetById, deleteAllQuestionSets };
