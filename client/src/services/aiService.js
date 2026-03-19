// client/src/services/aiService.js
// All AI logic has been migrated to the server-side /api/ai routes.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
    } : { 'Content-Type': 'application/json' };
}

/**
 * Generates a friendly Discord feedback message via server-side AI
 */
export async function generateFeedback(studentName, projectName, mentorNotes) {
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-feedback`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ studentName, projectName, mentorNotes })
        });
        const data = await res.json();
        return data.feedback || "Failed to generate feedback.";
    } catch (err) {
        console.error("AI Generation Error:", err);
        return "Failed to generate feedback due to network error.";
    }
}

/**
 * AI Tutor chat interface via server-side AI
 */
export async function chatWithTutor(sessionId, studentId, message, mentorReport, studentLevel, chatHistory, sessionData) {
    try {
        // 1. Save student message locally
        await saveMessageToBackend(sessionId, studentId, 'user', message);

        // 2. Get AI response from server
        const res = await fetch(`${API_URL}/api/ai/chat-tutor`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                message, 
                mentorReport, 
                studentLevel, 
                chatHistory 
            })
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const aiText = data.content;

        // 3. Save AI message
        await saveMessageToBackend(sessionId, studentId, 'model', aiText);
        return aiText;
    } catch (error) {
        console.error("Chat Error:", error);
        throw error;
    }
}

/**
 * Persists chat messages to database
 */
async function saveMessageToBackend(sessionId, studentId, role, content) {
    try {
        const res = await fetch(`${API_URL}/api/chat/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ sessionId, studentId, role, content })
        });
        if (!res.ok) throw new Error('Failed to save message');
    } catch (err) {
        console.error("Backend Save Error:", err);
    }
}

// --- Practice Minigame Functions (Now Server-Side) ---

export async function generatePracticeQuestions(topic, difficulty, count) {
    try {
        const res = await fetch(`${API_URL}/api/ai/generate-practice`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ topic, difficulty, count })
        });
        const data = await res.json();
        return data.questions || null;
    } catch (err) {
        console.error("AI Practice Gen Error:", err);
        return null;
    }
}

export async function evaluatePracticeAnswer(question, answer, topic, difficulty) {
    try {
        const res = await fetch(`${API_URL}/api/ai/evaluate-practice`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ question, answer, topic, difficulty })
        });
        return await res.json();
    } catch (err) {
        console.error("AI Practice Eval Error:", err);
        return null;
    }
}
