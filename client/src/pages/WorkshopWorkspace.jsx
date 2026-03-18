import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play, CheckCircle, HelpCircle, Shield, X, Users, Code, Lock } from 'lucide-react';
import { getSession, toggleWorkshopPermission } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/CodeEditor';
import './SessionRun.css';

export default function WorkshopWorkspace() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    
    const [session, setSession] = useState(null);
    const [myStatus, setMyStatus] = useState(null);
    const [code, setCode] = useState('// Write your solution here\n');
    const [language, setLanguage] = useState('javascript');
    const [submitting, setSubmitting] = useState(false);
    
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [showPermissions, setShowPermissions] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState('');
    
    useEffect(() => {
        fetchSession();
    }, [id]);

    const fetchSession = async () => {
        try {
            const data = await getSession(id);
            if (!data) throw new Error("Session not found");
            setSession(data);
            
            // Find my status
            const me = data.students?.find(s => s.discord === user.discordId || s.discord === user.username);
            if (me) {
                setMyStatus(me);
                if (me.result) {
                    setTerminalOutput(me.result);
                }
            }
        } catch (err) {
            console.error('Error fetching session:', err);
            toast.error("Error loading session. Please try again.");
            if (user.role === 'mentor') navigate('/');
            else navigate('/student-dashboard');
        }
    };

    const handleTogglePermission = async (studentId, currentPerm) => {
        try {
            const newPerm = !currentPerm;
            await toggleWorkshopPermission(session.id, studentId, newPerm);
            // Optimistic update
            setSession(prev => ({
                ...prev,
                students: prev.students.map(s => s.id === studentId ? { ...s, hasWorkshopPermission: newPerm } : s)
            }));
            toast.success(`Permission ${newPerm ? 'granted' : 'revoked'}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update permission");
        }
    };

    const handleSubmitCode = async () => {
        if (!code.trim()) {
            toast.error("Please write some code before submitting.");
            return;
        }
        
        setSubmitting(true);
        setTerminalOutput("Evaluating code with AI...");
        try {
            let feedback = '';
            try {
                if (!window.puter) {
                    throw new Error("Puter.js is not loaded. Please disable adblockers or check your connection.");
                }
                
                const qText = session.questions && session.questions[currentQuestionIdx] 
                    ? (session.questions[currentQuestionIdx].text || session.questions[currentQuestionIdx])
                    : "No specific tasks provided.";

                const prompt = `You are a code evaluator.
Task: ${qText}
Student code (${language}):
\`\`\`
${code}
\`\`\`
Evaluate if the code is correct. Provide a short, actionable feedback paragraph inside a terminal summary style.`;

                const response = await window.puter.ai.chat(prompt, { model: 'claude-3-5-sonnet' });
                feedback = response.message ? response.message.content : (response.text || response);
                
            } catch (aiError) {
                console.error("AI Evaluation error:", aiError);
                throw new Error("Failed to evaluate code with AI: " + aiError.message);
            }

            // Mentors don't save their results to DB permanently because they might just be demonstrating
            if (user.role === 'student' && myStatus) {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sessions/${session.id}/students/${myStatus.id}/submit-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ code, language, feedback, sessionId: session.id })
                });
                
                if (!res.ok) throw new Error('Failed to save code submission');
            }
            
            toast.success("Code evaluated successfully!");
            setTerminalOutput(feedback);
        } catch (err) {
            console.error('Submit Code error:', err);
            setTerminalOutput("Error: " + err.message);
            toast.error(err.message || 'Failed to submit code.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!session || (!myStatus && user.role !== 'mentor')) return (
        <div className="container flex-center" style={{ height: '80vh', flexDirection: 'column' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem' }}>Loading session workspace...</p>
        </div>
    );

    const isMentor = user.role === 'mentor';
    // Mentors always have permission. Students only if explicitly granted.
    const canEdit = isMentor || (myStatus && myStatus.hasWorkshopPermission === true);

    const currentQuestion = session.questions && session.questions.length > 0
        ? session.questions[currentQuestionIdx] 
        : null;

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-app)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/workshops')} className="btn-outline" style={{ display: 'flex', alignItems: 'center', border: 'none', padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
                        <ArrowLeft size={16} /> 
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Code size={20} color="var(--color-primary)" />
                            {session.groupName.replace('[WORKSHOP] ', '')}
                        </h1>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Topic: {session.topicNames?.join(', ') || 'General'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!canEdit && !isMentor && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <Lock size={14} /> Editor Locked by Mentor
                        </span>
                    )}
                    {isMentor && (
                        <button 
                            onClick={() => setShowPermissions(true)}
                            className="btn-outline" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                        >
                            <Shield size={16} /> Manage Permissions
                        </button>
                    )}
                </div>
            </div>

            {/* Main Split Screen */}
            <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>
                
                {/* Left Pane: Question Section */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(var(--color-primary-rgb, 67, 97, 238), 0.05)' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} /> 
                            Task {currentQuestionIdx + 1} of {session.questions?.length || 0}
                        </h2>
                    </div>
                    
                    <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                        {currentQuestion ? (
                            <div>
                                {currentQuestion.topicName && (
                                    <div style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                        {currentQuestion.topicName}
                                    </div>
                                )}
                                <div>{currentQuestion.text || currentQuestion}</div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                                No specific tasks loaded for this workshop.
                            </div>
                        )}
                    </div>

                    {/* Question Navigation */}
                    {session.questions && session.questions.length > 1 && (
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-app)' }}>
                            <button 
                                onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                                disabled={currentQuestionIdx === 0}
                                className="btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                            >
                                <ArrowLeft size={16} /> Previous
                            </button>
                            <button 
                                onClick={() => setCurrentQuestionIdx(Math.min(session.questions.length - 1, currentQuestionIdx + 1))}
                                disabled={currentQuestionIdx === session.questions.length - 1}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Pane: Code Editor & Terminal */}
                <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                    
                    {/* Editor Wrap */}
                    <div style={{ flex: '3', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                <Code size={16} /> Editor {(!canEdit) && "(Read-Only)"}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="input-control"
                                    style={{ padding: '0.25rem 0.5rem', width: 'auto', height: '32px', fontSize: '0.85rem' }}
                                    disabled={!canEdit}
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="cpp">C++</option>
                                </select>
                                
                                <button 
                                    onClick={handleSubmitCode} 
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 1rem', height: '32px', fontSize: '0.85rem' }}
                                    disabled={submitting || !canEdit}
                                >
                                    {submitting ? 'Running...' : <><Play size={14} /> Run Code</>}
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <CodeEditor 
                                code={code} 
                                onChange={(value) => setCode(value)} 
                                language={language} 
                                readOnly={!canEdit}
                            />
                        </div>
                    </div>

                    {/* Terminal / Output */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#1e1e1e', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden', boxShadow: 'var(--shadow-inner)' }}>
                        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #333', color: '#888', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={14} color="#22c55e" /> Terminal Output
                        </div>
                        <div style={{ flex: 1, padding: '1rem', color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.9rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {terminalOutput || <span style={{ color: '#555' }}>Output will appear here after running your code...</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Permissions Modal (Mentor Only) */}
            {showPermissions && isMentor && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} color="var(--color-primary)" />
                                Device Permissions
                            </h3>
                            <button onClick={() => setShowPermissions(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                            Grant students permission to type code on their own device. If revoked, they can only view the code or type directly on the your device.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {session.students?.length > 0 ? (
                                session.students.map(s => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.discord}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleTogglePermission(s.id, !!s.hasWorkshopPermission)}
                                            style={{ 
                                                padding: '0.4rem 0.75rem', 
                                                borderRadius: '20px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                border: 'none',
                                                background: s.hasWorkshopPermission ? '#22c55e' : 'rgba(239, 68, 68, 0.1)',
                                                color: s.hasWorkshopPermission ? 'white' : '#ef4444'
                                            }}
                                        >
                                            {s.hasWorkshopPermission ? 'Granted' : 'Revoked'}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    No students have joined this workshop.
                                </div>
                            )}
                        </div>
                        
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowPermissions(false)} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
