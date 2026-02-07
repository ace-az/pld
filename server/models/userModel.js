// server/models/userModel.js
const { supabase } = require('../utils/supabaseClient');

async function createUser(username, password, discordId, role = 'student', major = '') {
    const { data, error } = await supabase
        .from('users')
        .insert([
            { username, password, "discordId": discordId, role, major }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating user:', error);
        throw error;
    }
    return data;
}

async function findUserByUsername(username) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error finding user by username:', error);
    }
    return data;
}

async function findUserById(id) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) console.error('Error finding user by id:', error);
    return data;
}

async function findUserByDiscordId(discordId) {
    if (!discordId) return null;
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('discordId', discordId) // Note: confirm column name case sensitivity in Supabase
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error finding user by discordId:', error);
    }
    return data;
}

async function getAllStudentUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student');

    if (error) console.error('Error getting student users:', error);
    return data || [];
}

async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) console.error('Error getting all users:', error);
    return data || [];
}

async function deleteUser(id) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting user:', error);
        return false;
    }
    return true;
}

async function updateUserPassword(username, newPassword) {
    const { data, error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('username', username)
        .select()
        .single();

    if (error) {
        console.error('Error updating password:', error);
        throw error;
    }
    return data;
}

module.exports = {
    createUser,
    findUserByUsername,
    findUserById,
    findUserByDiscordId,
    updateUserPassword,
    getAllStudentUsers,
    getAllUsers,
    deleteUser
};
