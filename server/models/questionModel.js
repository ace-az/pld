// server/models/questionModel.js
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function getQuestionSets(mentorId) {
    return db.get('questions').filter({ mentorId }).value();
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
    db.get('questions').push(questionSet).write();
    return questionSet;
}

async function updateQuestionSet(id, data) {
    // data might contain topic and/or questions (array of strings)
    const updateData = {};
    if (data.topic) updateData.topic = data.topic;
    if (data.questions) {
        updateData.questions = data.questions.map(q => ({ id: uuidv4(), text: q }));
    }

    db.get('questions').find({ id }).assign(updateData).write();
    return db.get('questions').find({ id }).value();
}

async function deleteQuestionSet(id) {
    db.get('questions').remove({ id }).write();
    return true;
}

async function getQuestionSetById(id) {
    return db.get('questions').find({ id }).value();
}

async function deleteAllQuestionSets(mentorId) {
    db.get('questions')
        .remove({ mentorId })
        .write();
    return true;
}

module.exports = { getQuestionSets, addQuestionSet, updateQuestionSet, deleteQuestionSet, getQuestionSetById, deleteAllQuestionSets };
