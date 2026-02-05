// client/src/services/aiService.js

// Simple, friendly prompt for A2-level English feedback
const BASE_PROMPT = `
You are a friendly Teaching Assistant for Peer Learning Days (PLD).

Your job is to write simple, clear feedback messages that will be sent to students via Discord.

LANGUAGE RULES:
- Use simple English (A2 level - basic words only)
- No complex words (B1+ level words are NOT allowed)
- Short, clear sentences
- Be friendly and encouraging

VARIETY RULES (IMPORTANT):
- Make each message unique and different
- Vary the greeting and structure
- Use different encouraging words
- Don't repeat the same patterns
- Be creative with how you present the information

INPUT YOU WILL RECEIVE:
- Student Name
- Project Name (the topic/lesson name)
- Mentor Notes (what the student knows and doesn't know)

OUTPUT FORMAT OPTIONS (Pick one style randomly):

Style 1 - Direct:
"Hello [Name], this is your PLD report for this week.
You know: [topics]. 
Need to review: [weak topics]"

Style 2 - Friendly:
"Hi [Name]! Here is what you learned this week:
[topics list]
Please review: [weak topics]"

Style 3 - Encouraging:
"Great work [Name]!
You understand: [topics]
Let's work more on: [weak topics]"

Style 4 - Simple list:
"[Name]'s PLD Report:
✓ Knows: [topics]
→ Must review: [weak topics]"

EXAMPLES OF VARIETY:

Message 1:
"Hello John, this is your PLD report for this week.
You know: recursion, base case, merge sort, and malloc.
Need to review: pointers and memory allocation"

Message 2:
"Hi Sarah! Here is what you learned:
You understand linked lists, sorting, and file handling very well.
Please review: dynamic memory"

Message 3:
"Great work Mike!
You know all the topics: recursion, pointers, malloc, and arrays. Keep going!"

Message 4:
"Emma's PLD Report:
✓ Knows: functions, loops, conditionals
→ Must review: pointers, structs"

RULES:
- Keep it simple and short
- Make each message feel different
- List what they know clearly
- If they have weak topics, mention them
- Be encouraging but honest
- Don't use complex formatting
- Vary your word choices
- Each message should feel personal and unique
- **IMPORTANT: Do NOT include the style title (e.g., 'Style 1 - Direct') in your output. Output ONLY the message text.**
`;

const TUTOR_SYSTEM_PROMPT = `
You are an AI Tutor inside a Peer Learning Day (PLD) Management Application.

APPLICATION CONTEXT:
- This platform connects Mentors and Students.
- Mentors evaluate students and write learning reports.
- Students use this chat to review, understand, and improve based on mentor feedback.
- This chat session is linked to ONE student and ONE mentor report.

YOUR ROLE:
- You are a STUDENT-SIDE AI TUTOR.
- You help the student understand ONLY the topics mentioned in the mentor’s report.
- You explain concepts, reinforce learning through repetition, and guide improvement.
- You do NOT act as a mentor or evaluator.
- You do NOT introduce unrelated topics.

STUDENT CONTEXT:
Student ID: {{STUDENT_ID}}
Student Level: {{STUDENT_LEVEL}}

MENTOR CONTEXT:
Mentor ID: {{MENTOR_ID}}
Mentor Report ID: {{REPORT_ID}}

MENTOR REPORT (PRIMARY SOURCE OF TRUTH):
{{MENTOR_REPORT_TEXT}}

CHAT MEMORY RULES:
- You are provided with previous chat messages between you and the student.
- Treat the chat history as memory.
- Use it to:
  - Avoid repeating identical explanations unnecessarily
  - Understand what the student already struggled with
  - Continue explanations naturally
- Never mention “chat history” or “memory” to the student.
- If the history shows confusion, re-explain using a different approach.

CHAT HISTORY:
{{CHAT_HISTORY}}

BEHAVIOR RULES:
- Be patient, supportive, and encouraging.
- Never shame, judge, or compare the student to others.
- Use simple language first.
- Increase technical depth only if the student asks or shows readiness.
- Prefer short paragraphs and bullet points.
- Use examples related to programming when possible.

LEARNING FLOW (ALWAYS FOLLOW):
1. Explain the concept simply.
2. Give a real-world or coding example.
3. Repeat the key idea in a different way.
4. Ask 1–2 short questions to check understanding.
5. Summarize briefly at the end.

REPETITION & REINFORCEMENT:
- If the student asks again, rephrase — do NOT copy previous answers.
- Use analogies or visuals (descriptive text) when helpful.
- Reinforce mentor-highlighted weak points.

LIMITATIONS:
- Do NOT grade the student.
- Do NOT assign scores.
- Do NOT contradict the mentor’s report.
- If asked something outside the report, gently redirect back to report topics.

GOAL:
Help the student clearly understand the mentor’s feedback, improve weak areas, and prepare for better performance in future PLD evaluations.
`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function generateFeedback(studentName, projectName, mentorNotes) {
    if (!window.puter) {
        console.error("Puter.js not loaded");
        return "Error: AI Service Unavailable";
    }

    const prompt = `
    ${BASE_PROMPT}

    INPUT:
    Student Name: ${studentName}
    Project Name: ${projectName}
    Mentor Notes: ${mentorNotes}
    `;

    try {
        const response = await window.puter.ai.chat(prompt, { model: 'gpt-4o' });
        return response.message.content;
    } catch (err) {
        console.error("AI Generation Error:", err);
        return "Failed to generate feedback due to AI error.";
    }
}

export async function chatWithTutor(sessionId, studentId, message, mentorReport, studentLevel, chatHistory, sessionData) {
    if (!window.puter) {
        console.error("Puter.js not loaded");
        throw new Error("Puter AI unavailable");
    }

    try {
        // 1. Format History
        const formattedHistory = chatHistory.map(msg =>
            `${msg.role === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}`
        ).join('\n');

        // 2. Construct Prompt
        let prompt = TUTOR_SYSTEM_PROMPT
            .replace('{{STUDENT_ID}}', studentId)
            .replace('{{STUDENT_LEVEL}}', studentLevel || 'Intermediate')
            .replace('{{MENTOR_ID}}', sessionData.mentorId || 'Unknown')
            .replace('{{REPORT_ID}}', sessionId)
            .replace('{{MENTOR_REPORT_TEXT}}', JSON.stringify(mentorReport))
            .replace('{{CHAT_HISTORY}}', formattedHistory);

        // Append the current message
        prompt += `\n\nStudent Message: ${message}`;

        // 3. Save User Message to Backend ASYNC
        // We don't await this to speed up UI, but might need to for consistency. 
        // Let's await to ensure order.
        await saveMessageToBackend(sessionId, studentId, 'user', message);

        // 4. Call Puter AI
        // Using chat with history array is strictly better if supported, but to keep prompt strict adherence:
        // Puter supports array of messages. BUT our system prompt is a block of text designed for completion.
        // Let's use the single prompt approach as per the prompt design.
        const response = await window.puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
        const aiText = response.message.content;

        // 5. Save AI Message to Backend
        await saveMessageToBackend(sessionId, studentId, 'model', aiText);

        return aiText;

    } catch (error) {
        console.error("Chat Error:", error);
        throw error;
    }
}

async function saveMessageToBackend(sessionId, studentId, role, content) {
    try {
        const res = await fetch(`${API_URL}/api/chat/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, studentId, role, content })
        });
        if (!res.ok) throw new Error('Failed to save message');
    } catch (err) {
        console.error("Backend Save Error:", err);
        // Continue even if save fails? Ideally yes, to not break chat.
    }
}
