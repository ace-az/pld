import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play, CheckCircle, HelpCircle, Shield, X, Users, Code, Lock } from 'lucide-react';
import { getSession, toggleWorkshopPermission, updateWorkshopCode } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/CodeEditor';
import './SessionRun.css';
import { Panel, Group, Separator } from 'react-resizable-panels';

const ResizeHandle = ({ direction = 'horizontal' }) => (
    <Separator 
        style={{ 
            width: direction === 'horizontal' ? '8px' : '100%', 
            height: direction === 'vertical' ? '8px' : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
            zIndex: 10
        }}
    >
        <div style={{ 
            width: direction === 'horizontal' ? '2px' : '30px', 
            height: direction === 'vertical' ? '2px' : '30px',
            background: 'var(--border-color)', 
            borderRadius: '1px',
            transition: 'background 0.2s',
        }} className="resize-handle-inner" />
    </Separator>
);

export default function WorkshopWorkspace() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    
    const [session, setSession] = useState(null);
    const [myStatus, setMyStatus] = useState(null);
    const [allSubmissions, setAllSubmissions] = useState({}); // { [index]: { code, language, output, feedback } }
    const [code, setCode] = useState('# Write Python here\n');
    const [language, setLanguage] = useState('python');
    const [submitting, setSubmitting] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [showPermissions, setShowPermissions] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState('');
    const [aiReviewEnabled, setAiReviewEnabled] = useState(() => {
        const saved = localStorage.getItem('aiReviewEnabled');
        return saved !== null ? JSON.parse(saved) : false; // Default to OFF
    });

    useEffect(() => {
        localStorage.setItem('aiReviewEnabled', JSON.stringify(aiReviewEnabled));
    }, [aiReviewEnabled]);

    const [studentIdentifier, setStudentIdentifier] = useState('');
    const [addingStudent, setAddingStudent] = useState(false);
    const [masterStudents, setMasterStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [lastLocalChange, setLastLocalChange] = useState(0);

    const isMentor = user.role === 'mentor';
    const canEdit = isMentor || (myStatus && myStatus.hasWorkshopPermission === true);
    
    useEffect(() => {
        fetchSession();
        fetchMasterStudents();

        // Start polling for real-time collaboration
        const interval = setInterval(fetchSession, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchMasterStudents = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setMasterStudents(data);
        } catch (err) {
            console.error('Error fetching master students:', err);
        }
    };

    useEffect(() => {
        if (studentIdentifier.trim().length > 1) {
            const filtered = masterStudents.filter(s => 
                s.name.toLowerCase().includes(studentIdentifier.toLowerCase()) || 
                (s.discord && s.discord.toLowerCase().includes(studentIdentifier.toLowerCase()))
            );
            setFilteredStudents(filtered.slice(0, 5));
        } else {
            setFilteredStudents([]);
        }
    }, [studentIdentifier, masterStudents]);

    // Initial load of submissions when myStatus is first set
    useEffect(() => {
        if (myStatus?.submissions) {
            setAllSubmissions(myStatus.submissions);
            // Also set initial question state if it exists
            const initialSub = myStatus.submissions[0];
            if (initialSub) {
                setCode(initialSub.code || '// Write your solution here\n');
                setLanguage(initialSub.language || 'javascript');
                setTerminalOutput(initialSub.output || '');
            }
        }
    }, [myStatus?.id]); // Only runs when myStatus (the student record) is loaded/changed

    // Handle question switching
    useEffect(() => {
        const sub = allSubmissions[currentQuestionIdx];
        if (sub) {
            setCode(sub.code || '');
            setLanguage(sub.language || 'python');
            setTerminalOutput(sub.output || '');
        } else {
            // New question - clear or set defaults
            const defaultCode = language === 'python' ? '# Write Python here\n' : '// Write JS here\n';
            setCode(defaultCode);
            setTerminalOutput('');
        }
    }, [currentQuestionIdx]);

    // REAL-TIME SYNC: Update local state from server
    useEffect(() => {
        if (!session?.workshop_data) return;
        const { code: serverCode, language: serverLang, questionIndex: serverIdx, updatedBy } = session.workshop_data;
        
        // Don't sync if we are the one who just updated it
        if (updatedBy === user.id) return;
        
        // Don't sync if we are looking at a different question
        if (serverIdx !== currentQuestionIdx) return;

        // CRITICAL: Don't sync if we are currently typing (avoids cursor jumps)
        const timeSinceLastType = Date.now() - lastLocalChange;
        if (timeSinceLastType < 2500) return;

        if (serverCode !== undefined && serverCode !== code) {
            setCode(serverCode);
        }
        if (serverLang !== undefined && serverLang !== language) {
            setLanguage(serverLang);
        }
    }, [session?.workshop_data, currentQuestionIdx]);

    // REAL-TIME SYNC: Save local state to server (Debounced)
    useEffect(() => {
        if (!canEdit) return;
        if (Date.now() - lastLocalChange > 5000) return; // Only save if actually changed recently
        
        const timer = setTimeout(async () => {
            try {
                await updateWorkshopCode(id, { 
                    code, 
                    language, 
                    questionIndex: currentQuestionIdx 
                });
            } catch (err) {
                console.error("Failed to sync code:", err);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [code, language, currentQuestionIdx, id, canEdit]);

    const handleQuestionSwitch = (newIdx) => {
        // Save current active buffer to local state before switching
        setAllSubmissions(prev => ({
            ...prev,
            [currentQuestionIdx]: {
                code,
                language,
                output: terminalOutput
            }
        }));
        setCurrentQuestionIdx(newIdx);
    };

    const handleLanguageChange = (newLang) => {
        const oldLang = language;
        setLanguage(newLang);
        setLastLocalChange(Date.now());

        // If the current code is just the default boilerplate for the old language, update it
        const jsBoilerplate = '// Write JS here\n';
        const jsBoilerplateAlt = '// Write your solution here\n';
        const pythonBoilerplate = '# Write Python here\n';
        
        if (code === jsBoilerplate || code === jsBoilerplateAlt || code === pythonBoilerplate || !code.trim()) {
            const newDefault = val === 'python' ? '# Write Python here\n' : '// Write JS here\n';
            setCode(newDefault);
        }

        // Also update local state
        setAllSubmissions(prev => ({
            ...prev,
            [currentQuestionIdx]: {
                ...(allSubmissions[currentQuestionIdx] || {}),
                language: val
            }
        }));
    };

    const fetchSession = async () => {
        try {
            const data = await getSession(id);
            if (!data) throw new Error("Session not found");
            setSession(data);
            
            const me = data.students?.find(s => s.discord === user.discordId || s.discord === user.username);
            if (me) {
                setMyStatus(me);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load session");
        }
    };

    const handleTogglePermission = async (studentId, currentPerm) => {
        try {
            const newPerm = !currentPerm;
            await toggleWorkshopPermission(session.id, studentId, newPerm);
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

    const handleBulkPermission = async (grant) => {
        try {
            const studentIds = session.students?.map(s => s.id) || [];
            if (studentIds.length === 0) return;

            // Sequentially or parallel? Parallel is faster.
            await Promise.all(studentIds.map(id => toggleWorkshopPermission(session.id, id, grant)));
            
            setSession(prev => ({
                ...prev,
                students: prev.students.map(s => ({ ...s, hasWorkshopPermission: grant }))
            }));
            toast.success(`Permissions ${grant ? 'granted' : 'revoked'} for all students`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update bulk permissions");
        }
    };

    const handleAddStudent = async (identifierOverride) => {
        const idToUse = identifierOverride || studentIdentifier;
        if (!idToUse.trim()) return;
        
        setAddingStudent(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/sessions/${session.id}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ identifier: idToUse })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add student');
            
            setSession(data);
            setStudentIdentifier('');
            setFilteredStudents([]);
            toast.success("Student added to session!");
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setAddingStudent(false);
        }
    };

    const handleSubmitCode = async () => {
        if (!code.trim()) { toast.error("Please write some code."); return; }
        setSubmitting(true);
        setTerminalOutput("Executing...");
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        try {
            // 1. Execute only first
            const execRes = await fetch(`${apiUrl}/api/ai/execute-only`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ code, language })
            });
            const execData = await execRes.json();
            if (!execRes.ok) throw new Error(execData.error || 'Execution failed');
            const executionOutput = `$ ${language} execution\n${execData.executionOutput || '(No output)'}`;
            
            let finalOutput = executionOutput;
            let feedback = null;

            if (aiReviewEnabled) {
                setTerminalOutput(`${executionOutput}\n\nAI is reviewing your code...`);

                // 2. AI Feedback
                const aiRes = await fetch(`${apiUrl}/api/ai/evaluate-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ code, language, question: currentQuestion.text || currentQuestion })
                });
                const aiData = await aiRes.json();
                if (!aiRes.ok) throw new Error(aiData.error || 'AI evaluation failed');
                feedback = aiData.feedback;
                finalOutput = `${executionOutput}\n\n--- AI FEEDBACK ---\n${feedback}`;
            } else {
                finalOutput = `${executionOutput}\n\n(AI Review is currently disabled. Use the toggle to enable it.)`;
            }

            setTerminalOutput(finalOutput);

            // 3. Save to Server
            if (user.role === 'student' && myStatus) {
                await fetch(`${apiUrl}/api/sessions/${session.id}/students/${myStatus.id}/submit-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ 
                        code, 
                        language, 
                        feedback: feedback, 
                        sessionId: session.id,
                        questionIndex: currentQuestionIdx,
                        output: finalOutput
                    })
                });
            }
            
            // Sync final state to local allSubmissions
            setAllSubmissions(prev => ({
                ...prev,
                [currentQuestionIdx]: {
                    code,
                    language,
                    output: finalOutput,
                    feedback
                }
            }));
            toast.success(aiReviewEnabled ? "Code evaluated!" : "Code executed!");

        } catch (err) {
            setTerminalOutput("Error: " + err.message);
            toast.error(err.message || 'Failed to submit code.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!session || (!myStatus && user.role !== 'mentor')) return null;

    const currentQuestion = session.questions && session.questions.length > 0 ? session.questions[currentQuestionIdx] : null;

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-app)' }}>
            <style>{`
                .resize-handle-inner:hover { background: var(--color-primary) !important; filter: drop-shadow(0 0 4px var(--color-primary-rgb, 67, 97, 238)); }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .premium-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(10, 11, 14, 0.7);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .premium-modal-container {
                    background: rgba(26, 27, 30, 0.8) !important;
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    width: 440px;
                    max-width: 100%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>

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
                        <button onClick={() => setShowPermissions(true)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                            <Shield size={16} /> Manage Permissions
                        </button>
                    )}
                </div>
            </div>

            {/* Main Split Screen */}
            <Group orientation="horizontal" style={{ flex: 1, height: '100%', gap: '0' }}>
                
                {/* Left Pane: Question Section */}
                <Panel defaultSize={30} minSize={20}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
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
                                    No specific tasks loaded.
                                </div>
                            )}
                        </div>

                        {session.questions && session.questions.length > 1 && (
                            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-app)' }}>
                                <button onClick={() => handleQuestionSwitch(Math.max(0, currentQuestionIdx - 1))} disabled={currentQuestionIdx === 0} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                    <ArrowLeft size={16} /> Previous
                                </button>
                                <button onClick={() => handleQuestionSwitch(Math.min(session.questions.length - 1, currentQuestionIdx + 1))} disabled={currentQuestionIdx === session.questions.length - 1} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                    Next <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </Panel>

                <ResizeHandle direction="horizontal" />

                {/* Right Pane: Code Editor & Terminal */}
                <Panel defaultSize={70}>
                    <Group orientation="vertical" style={{ height: '100%' }}>
                        <Panel defaultSize={70} minSize={30}>
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                        <Code size={16} /> Editor {(!canEdit) && "(Read-Only)"}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', padding: '2px 8px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: aiReviewEnabled ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                                                AI Review: {aiReviewEnabled ? 'ON' : 'OFF'}
                                            </span>
                                            <div 
                                                style={{ 
                                                    position: 'relative', 
                                                    width: '32px', 
                                                    height: '18px', 
                                                    background: aiReviewEnabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', 
                                                    borderRadius: '9px', 
                                                    cursor: 'pointer', 
                                                    transition: 'background 0.3s ease' 
                                                }} 
                                                onClick={() => setAiReviewEnabled(!aiReviewEnabled)}
                                            >
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    top: '2px', 
                                                    left: aiReviewEnabled ? '16px' : '2px', 
                                                    width: '14px', 
                                                    height: '14px', 
                                                    background: 'white', 
                                                    borderRadius: '50%', 
                                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                                                }} />
                                            </div>
                                        </div>
                                        <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="input-control" style={{ padding: '0.25rem 0.5rem', width: 'auto', height: '32px', fontSize: '0.85rem' }} disabled={!canEdit}>
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                            <option value="cpp">C++</option>
                                        </select>
                                        <button onClick={handleSubmitCode} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 1rem', height: '32px', fontSize: '0.85rem' }} disabled={submitting || !canEdit}>
                                            {submitting ? 'Running...' : <><Play size={14} /> Run Code</>}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <CodeEditor 
                                        code={code} 
                                        onChange={(value) => {
                                            setCode(value);
                                            setLastLocalChange(Date.now());
                                        }} 
                                        language={language} 
                                        readOnly={!canEdit} 
                                    />
                                </div>
                            </div>
                        </Panel>

                        <ResizeHandle direction="vertical" />

                        <Panel defaultSize={30} minSize={10}>
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden', boxShadow: 'var(--shadow-inner)' }}>
                                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #333', color: '#888', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={14} color="#22c55e" /> Terminal Output
                                </div>
                                <div style={{ flex: 1, padding: '1rem', color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.9rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                    {terminalOutput || <span style={{ color: '#555' }}>Output will appear here after running your code...</span>}
                                </div>
                            </div>
                        </Panel>
                    </Group>
                </Panel>
            </Group>

            {/* Permissions Modal (Mentor Only) */}
            {showPermissions && isMentor && (
                <div className="premium-modal-backdrop" onClick={() => setShowPermissions(false)}>
                    <div className="premium-modal-container" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'rgba(var(--color-primary-rgb, 67, 97, 238), 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                                    <Shield size={22} color="var(--color-primary)" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Device Permissions</h3>
                            </div>
                            <button onClick={() => setShowPermissions(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Grant specific students permission to type code on their own device during this workshop session.
                            </p>

                            {/* Add Student Section */}
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Username or Discord ID..." 
                                        value={studentIdentifier}
                                        onChange={(e) => setStudentIdentifier(e.target.value)}
                                        className="input-control"
                                        style={{ flex: 1, height: '38px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)' }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                                    />
                                    <button 
                                        onClick={() => handleAddStudent()} 
                                        disabled={addingStudent || !studentIdentifier.trim()}
                                        className="btn btn-primary" 
                                        style={{ height: '38px', padding: '0 1rem', fontSize: '0.85rem' }}
                                    >
                                        {addingStudent ? 'Adding...' : 'Add Student'}
                                    </button>
                                </div>
                                
                                {filteredStudents.length > 0 && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '100%', 
                                        left: 0, 
                                        right: 0, 
                                        background: 'var(--bg-card)', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: '8px', 
                                        marginTop: '4px', 
                                        zIndex: 100, 
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}>
                                        {filteredStudents.map(s => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => handleAddStudent(s.discord || s.username)}
                                                style={{ 
                                                    padding: '0.75rem 1rem', 
                                                    cursor: 'pointer', 
                                                    borderBottom: '1px solid var(--border-color)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--text-main)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--color-primary)';
                                                    e.currentTarget.style.color = '#fff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--text-main)';
                                                }}
                                            >
                                                <span style={{ fontWeight: '500' }}>{s.name}</span>
                                                <code style={{ fontSize: '0.8rem', opacity: 0.7, color: 'inherit' }}>{s.discord}</code>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {session.students && session.students.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <button onClick={() => handleBulkPermission(true)} className="btn-outline" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
                                        Grant All
                                    </button>
                                    <button onClick={() => handleBulkPermission(false)} className="btn-outline" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                                        Revoke All
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                {session.students && session.students.length > 0 ? (
                                    session.students.map(s => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'all 0.2s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>
                                                    {s.name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{s.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.discord}</div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ position: 'relative', width: '44px', height: '24px', background: s.hasWorkshopPermission ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.3s ease' }} onClick={() => handleTogglePermission(s.id, !!s.hasWorkshopPermission)}>
                                                <div style={{ position: 'absolute', top: '2px', left: s.hasWorkshopPermission ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '50%' }}>
                                            <Users size={32} opacity={0.3} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>No Students Joined</div>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Students will appear here once they join.</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowPermissions(false)} className="btn btn-primary" style={{ minWidth: '100px', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 'bold' }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
