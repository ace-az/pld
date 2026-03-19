const express = require('express');
const router = express.Router();
const { OpenRouter } = require('@openrouter/sdk');
const authMiddleware = require('../utils/authMiddleware');
const codeExecution = require('../services/codeExecution');

const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || ''
});

// --- AI Prompts (Migrated from Client) ---

const BASE_FEEDBACK_PROMPT = `
You are a friendly Teaching Assistant for Peer Learning Days (PLD).
Your job is to write simple, clear feedback messages that will be sent to students via Discord (A2 level English).
Short, clear sentences. Be friendly and encouraging.
Vary the greeting and structure. Don't repeat the same patterns.
Output ONLY the message text.
`;

const TUTOR_SYSTEM_PROMPT = `
You are an AI Tutor inside a Peer Learning Day (PLD) platform.
You help the student understand ONLY the topics mentioned in the mentor’s report.
Explain concepts simply, give examples, and ask 1-2 check questions.
Do NOT grade the student. Do NOT act as a mentor.
`;

// Helper for OpenRouter Chat
const askAI = async (prompt, systemPrompt = '') => {
    if (!process.env.OPENROUTER_API_KEY) return 'AI not configured.';
    
    try {
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const completion = await openrouter.chat.send({
            chatGenerationParams: {
                model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
                messages
            }
        });
        return completion.choices?.[0]?.message?.content || completion.message?.content || '';
    } catch (err) {
        console.error('[AI] OpenRouter Error:', err.message);
        throw err;
    }
};

// POST /api/ai/execute-only
router.post('/execute-only', authMiddleware, async (req, res) => {
    try {
        const { code, language } = req.body;
        
        // Validation
        const validation = codeExecution.validateCode(language, code);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Rate limiting based on user ID
        const rateLimit = codeExecution.checkRateLimit(req.user.id);
        if (!rateLimit.allowed) {
            return res.status(429).json({ error: rateLimit.error });
        }

        const execResult = await codeExecution.executeCode(language, code);
        
        // Piston return format: success, language, output, stdout, stderr, exitCode, executionTime
        // Or if error: success: false, error: '...', message: '...'

        if (!execResult.success) {
            return res.json({ 
                success: false,
                error: execResult.error,
                message: codeExecution.sanitizeOutput(execResult.message),
                exitCode: execResult.exitCode
            });
        }

        const executionOutput = codeExecution.sanitizeOutput(execResult.output);

        res.json({ 
            success: true,
            language: execResult.language,
            output: executionOutput,
            stdout: codeExecution.sanitizeOutput(execResult.stdout),
            stderr: codeExecution.sanitizeOutput(execResult.stderr),
            exitCode: execResult.exitCode,
            executionTime: execResult.executionTime,
            executionOutput // Keeping compatibility for client
        });
    } catch (err) {
        console.error('[AI Route Error]:', err);
        const errorMessage = err.message || 'An unexpected error occurred';
        res.status(500).json({ 
            success: false,
            error: 'server_error',
            message: errorMessage
        });
    }
});

// POST /api/ai/evaluate-code (Workshop)
router.post('/evaluate-code', authMiddleware, async (req, res) => {
    try {
        const { code, language, question } = req.body;

        // Validation
        const validation = codeExecution.validateCode(language, code);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Rate limiting based on user ID
        const rateLimit = codeExecution.checkRateLimit(req.user.id);
        if (!rateLimit.allowed) {
            return res.status(429).json({ error: rateLimit.error });
        }

        const execResult = await codeExecution.executeCode(language, code);
        
        const executionOutput = codeExecution.sanitizeOutput(execResult.success ? execResult.output : execResult.message);
        const displayOutput = execResult.success 
            ? executionOutput 
            : `ERROR:\n${executionOutput}${execResult.stdout ? '\nSTDOUT:\n' + codeExecution.sanitizeOutput(execResult.stdout) : ''}`;

        const prompt = `Task: ${question}\nCode (${language}):\n${code}\nOutput: ${executionOutput}\nEvaluate work. Brief feedback.`;
        const feedback = await askAI(prompt, 'You are a code evaluator.');

        res.json({ 
            success: execResult.success,
            executionOutput: displayOutput, // compatibility
            output: executionOutput,
            stdout: codeExecution.sanitizeOutput(execResult.stdout),
            stderr: codeExecution.sanitizeOutput(execResult.stderr),
            exitCode: execResult.exitCode,
            feedback 
        });
    } catch (err) {
        console.error('[AI Route Error]:', err);
        const errorMessage = err.message || 'An unexpected error occurred';
        res.status(500).json({ 
            success: false,
            error: 'server_error',
            message: errorMessage
        });
    }
});

// POST /api/ai/generate-practice
router.post('/generate-practice', async (req, res) => {
    try {
        const { topic, difficulty, count } = req.body;
        const prompt = `Generate ${count || 3} practice questions for: ${topic} (${difficulty}). Return ONLY a JSON array of strings. e.g. ["Q1", "Q2"]`;
        
        const content = await askAI(prompt, 'You are an AI Practice Bot.');
        const match = content.match(/\[.*\]/s);
        const questions = match ? JSON.parse(match[0]) : [content];
        
        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

// POST /api/ai/evaluate-practice
router.post('/evaluate-practice', async (req, res) => {
    try {
        const { question, answer, topic, difficulty } = req.body;
        const prompt = `Topic: ${topic}\nDifficulty: ${difficulty}\nQ: ${question}\nStudent: ${answer}\nEvaluate. Return ONLY JSON: {"score": 0-100, "feedback": "...", "correctAnswer": "..."}`;
        
        const content = await askAI(prompt, 'You are an AI Practice Bot.');
        const match = content.match(/\{.*\}/s);
        const evaluation = match ? JSON.parse(match[0]) : { score: 0, feedback: "Format error", correctAnswer: "" };
        
        res.json(evaluation);
    } catch (err) {
        res.status(500).json({ error: 'Failed to evaluate answer' });
    }
});

// POST /api/ai/chat-tutor
router.post('/chat-tutor', async (req, res) => {
    try {
        const { message, mentorReport, studentLevel, chatHistory } = req.body;
        
        const historyText = chatHistory?.map(m => `${m.role}: ${m.content}`).join('\n') || '';
        const prompt = `Report: ${JSON.stringify(mentorReport)}\nLevel: ${studentLevel}\nHistory:\n${historyText}\nStudent: ${message}`;
        
        const response = await askAI(prompt, TUTOR_SYSTEM_PROMPT);
        res.json({ content: response });
    } catch (err) {
        res.status(500).json({ error: 'Tutor unavailable' });
    }
});

// POST /api/ai/generate-feedback (Discord)
router.post('/generate-feedback', async (req, res) => {
    try {
        const { studentName, projectName, mentorNotes } = req.body;
        const prompt = `Student: ${studentName}\nProject: ${projectName}\nNotes: ${mentorNotes}`;
        
        const feedback = await askAI(prompt, BASE_FEEDBACK_PROMPT);
        res.json({ feedback });
    } catch (err) {
        res.status(500).json({ error: 'Feedback failed' });
    }
});

module.exports = router;
