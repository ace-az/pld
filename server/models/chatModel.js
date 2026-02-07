// server/models/chatModel.js
const { supabase } = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');

async function getChatHistory(sessionId, studentId) {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('sessionId', sessionId)
        .eq('studentId', studentId)
        .single();

    if (error) {
        // It's manually acceptable if no chat exists yet
        return [];
    }
    return data ? data.messages : [];
}

async function addMessage(sessionId, studentId, role, content) {
    const timestamp = new Date().toISOString();
    const newMessage = { role, content, timestamp };

    // Check if chat exists
    const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('sessionId', sessionId)
        .eq('studentId', studentId)
        .single();

    if (!chat) {
        // Create new
        const { error: insertError } = await supabase
            .from('chats')
            .insert([{
                sessionId,
                studentId,
                messages: [newMessage],
                createdAt: timestamp,
                updatedAt: timestamp
            }]);

        if (insertError) {
            console.error('Error creating chat:', insertError);
            throw insertError;
        }
    } else {
        // Update existing
        // We need to fetch existing messages first (already done above in 'chat')
        const updatedMessages = [...(chat.messages || []), newMessage];

        const { error: updateError } = await supabase
            .from('chats')
            .update({
                messages: updatedMessages,
                updatedAt: timestamp
            })
            .eq('id', chat.id);

        if (updateError) {
            console.error('Error updating chat:', updateError);
            throw updateError;
        }
    }

    return newMessage;
}

async function clearChat(sessionId, studentId) {
    const { error } = await supabase
        .from('chats')
        .delete()
        .eq('sessionId', sessionId)
        .eq('studentId', studentId);

    if (error) {
        console.error('Error clearing chat:', error);
        return false;
    }
    return true;
}

module.exports = { getChatHistory, addMessage, clearChat };
