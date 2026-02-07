// server/models/questionModel.js
const { supabase } = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');

async function getQuestionSets(mentorId) {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('mentorId', mentorId);

    if (error) {
        console.error('Error getting question sets:', error);
        return [];
    }
    return data;
}

async function addQuestionSet(mentorId, topic, questions) {
    // 1. Check if topic already exists for this mentor
    const { data: existingSet } = await supabase
        .from('questions')
        .select('*')
        .eq('mentorId', mentorId)
        .eq('topic', topic)
        .single();

    if (existingSet) {
        // Topic exists: Append new unique questions
        const existingQuestions = existingSet.questions || [];
        const existingTexts = new Set(existingQuestions.map(q => (typeof q === 'string' ? q : q.text).trim().toLowerCase()));

        const newUniqueQuestions = questions.filter(q => {
            const text = (typeof q === 'string' ? q : q.text).trim().toLowerCase();
            return !existingTexts.has(text);
        });

        if (newUniqueQuestions.length === 0) {
            return existingSet; // Nothing to add
        }

        const newQuestionsWithIds = newUniqueQuestions.map(q => ({ id: uuidv4(), text: q }));
        const updatedQuestions = [...existingQuestions, ...newQuestionsWithIds];

        const { data: updatedSet, error: updateError } = await supabase
            .from('questions')
            .update({ questions: updatedQuestions })
            .eq('id', existingSet.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating question set (append):', updateError);
            throw updateError;
        }
        return updatedSet;
    }

    // 2. New Topic: Create new
    const questionsWithIds = questions.map(q => ({ id: uuidv4(), text: q }));

    const { data, error } = await supabase
        .from('questions')
        .insert([
            {
                mentorId,
                topic,
                questions: questionsWithIds
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error adding question set:', error);
        throw error;
    }
    return data;
}

async function updateQuestionSet(id, data) {
    const updateData = {};
    if (data.topic) updateData.topic = data.topic;
    if (data.questions) {
        updateData.questions = data.questions.map(q => ({ id: uuidv4(), text: q }));
    }

    const { data: updated, error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating question set:', error);
        return null;
    }
    return updated;
}

async function deleteQuestionSet(id) {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting question set:', error);
        return false;
    }
    return true;
}

async function getQuestionSetById(id) {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting question set by id:', error);
        return null;
    }
    return data;
}

async function deleteAllQuestionSets(mentorId) {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('mentorId', mentorId);

    if (error) {
        console.error('Error deleting all question sets:', error);
        return false;
    }
    return true;
}

module.exports = { getQuestionSets, addQuestionSet, updateQuestionSet, deleteQuestionSet, getQuestionSetById, deleteAllQuestionSets };
