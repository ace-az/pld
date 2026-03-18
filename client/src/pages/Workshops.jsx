import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getSessions, createSession } from '../api';
import { Code, Calendar, Play, Plus, X, Upload } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Workshops() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Create Workshop State
    const [showCreate, setShowCreate] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [sessionMajors, setSessionMajors] = useState([]);
    const [customQuestions, setCustomQuestions] = useState([{ title: '', body: '' }]);

    // Derive mentor's majors from their profile
    const mentorMajorsList = (user?.major || '').split(',').map(m => m.trim()).filter(Boolean);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            if (sessions.length === 0) setLoading(true);
            const data = await getSessions();
            if (Array.isArray(data)) {
                const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setSessions(sorted);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            toast.error("Failed to load workshop sessions.");
        } finally {
            setLoading(false);
        }
    };

    const getMyData = (session) => {
        if (!user || !session.students) return null;
        const searchKey = user.discordId || user.username;
        if (!searchKey) return null;
        return session.students.find(s =>
            s.discord && s.discord.toLowerCase() === searchKey.toLowerCase()
        );
    };

    const handleQuestionChange = (idx, field, value) => {
        const updated = [...customQuestions];
        updated[idx][field] = value;
        setCustomQuestions(updated);
    };

    const addQuestion = () => setCustomQuestions([...customQuestions, { title: '', body: '' }]);
    
    const removeQuestion = (idx) => {
        if (customQuestions.length > 1) {
            setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
        }
    };

    const toggleMajor = (majorName) => {
        if (sessionMajors.includes(majorName)) {
            setSessionMajors(sessionMajors.filter(m => m !== majorName));
        } else {
            setSessionMajors([...sessionMajors, majorName]);
        }
    };

    const handleCreateWorkshop = async (e) => {
        e.preventDefault();
        const hasInvalidQs = customQuestions.some(q => !q.title.trim() || !q.body.trim());

        if (!groupName || sessionMajors.length === 0 || hasInvalidQs) {
            return toast.error("Select Group Name, at least one Major, and fill all questions.");
        }

        try {
            const workshopName = `[WORKSHOP] ${groupName.trim()}`;
            const majorString = sessionMajors.join(', ');
            
            const newSession = await createSession({
                groupName: workshopName,
                major: majorString,
                students: [], // No adding students explicitly for Workshops
                topicIds: [], // We use custom questions instead
                customQuestions: customQuestions,
                createdAt: new Date().toISOString(),
                scheduledTime: '00:00' // Immediate
            });
            
            toast.success("Workshop created successfully! Students empty initially, they will join.");
            setShowCreate(false);
            setGroupName('');
            setSessionMajors([]);
            setCustomQuestions([{ title: '', body: '' }]);
            
            navigate(`/workshop/${newSession.id}`);
        } catch (err) {
            console.error('Create workshop failed:', err);
            toast.error(err.message || "Failed to create workshop");
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading interactive workshops...</p>
            </div>
        );
    }

    const activeWorkshops = sessions
        .filter(s => {
            const isMentor = user.role === 'mentor';
            if (s.status === 'completed') return false;
            
            // Workshops ONLY
            if (!s.groupName?.startsWith('[WORKSHOP]')) return false;

            // If mentor, they should see their sessions. If student, only if they are in the list.
            if (!isMentor && !getMyData(s)) return false;
            
            return true;
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, color: 'var(--text-main)' }}>
                    <Code size={30} color="var(--color-primary)" />
                    Interactive Workshops
                </h1>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        onClick={fetchData} 
                        className="btn-outline" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={loading}
                    >
                        <Play size={16} /> Refresh
                    </button>
                    
                    {user?.role === 'mentor' && !showCreate && (
                        <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={16} /> Create New Workshop
                        </button>
                    )}
                    {user?.role === 'mentor' && showCreate && (
                        <button onClick={() => setShowCreate(false)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                            <X size={16} /> Cancel
                        </button>
                    )}
                </div>
            </div>

            {showCreate ? (
                <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Create New Workshop</h2>
                    <form onSubmit={handleCreateWorkshop}>
                        {/* Workshop Name */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Workshop Name</label>
                            <input
                                type="text"
                                className="input-control"
                                placeholder="e.g. Intro to Arrays"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                            />
                        </div>

                        {/* Multi-Select Majors (from mentor profile) */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Your Majors <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>(students from selected majors will be notified)</span></label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {mentorMajorsList.map(name => (
                                    <label
                                        key={name}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '20px', border: `1px solid ${sessionMajors.includes(name) ? 'var(--color-primary)' : 'var(--border-color)'}`, background: sessionMajors.includes(name) ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-app)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: sessionMajors.includes(name) ? 'bold' : 'normal', color: sessionMajors.includes(name) ? 'var(--color-primary)' : 'var(--text-main)', transition: 'all 0.15s ease' }}
                                    >
                                        <input type="checkbox" checked={sessionMajors.includes(name)} onChange={() => toggleMajor(name)} style={{ display: 'none' }} />
                                        {sessionMajors.includes(name) ? '✓ ' : ''}{name}
                                    </label>
                                ))}
                            </div>
                            {mentorMajorsList.length === 0 && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>No majors found on your profile. Update your profile first.</p>}
                            {sessionMajors.length === 0 && mentorMajorsList.length > 0 && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>Select at least one major.</p>}
                        </div>

                        {/* Custom Questions */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Questions</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {customQuestions.map((q, idx) => (
                                    <div key={idx} style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Question {idx + 1}</span>
                                            {customQuestions.length > 1 && (
                                                <button type="button" onClick={() => removeQuestion(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-control"
                                            placeholder="Question Title (e.g. Binary Search)"
                                            value={q.title}
                                            onChange={(e) => handleQuestionChange(idx, 'title', e.target.value)}
                                            style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 'bold' }}
                                        />
                                        <textarea
                                            className="input-control"
                                            placeholder="Question body... Describe the task the student needs to solve."
                                            value={q.body}
                                            onChange={(e) => handleQuestionChange(idx, 'body', e.target.value)}
                                            rows={4}
                                            style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', resize: 'vertical', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addQuestion} style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <Plus size={14} /> Add Another Question
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 'bold', fontSize: '1rem', borderRadius: '8px' }}>
                            Start Workshop
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '800px' }}>
                        Welcome to the Workshops hub! This dedicated area allows you to enter interactive collaborative sessions natively in your browser.
                    </p>

                    {activeWorkshops.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {activeWorkshops.map(session => (
                                <div key={session.id} style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    boxShadow: 'var(--shadow-sm)',
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{session.groupName.replace('[WORKSHOP] ', '')}</h3>
                                        <p style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                                            Topic: {session.topicNames?.join(', ') || 'General'}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <Calendar size={14} />
                                            <span>
                                                Created:{' '}
                                                {session.createdAt 
                                                    ? new Date(session.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                                    
                                    <Link 
                                        to={`/workshop/${session.id}`} 
                                        className="btn btn-primary"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            padding: '0.75rem',
                                            fontWeight: 'bold',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Code size={18} />
                                        Enter Interactive Workspace
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ 
                            padding: '3rem', 
                            textAlign: 'center', 
                            background: 'var(--bg-card)', 
                            borderRadius: '12px',
                            border: '1px dashed var(--border-color)',
                            color: 'var(--text-secondary)'
                        }}>
                            <Code size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto', display: 'block' }} />
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No active Workshops</h3>
                            <p>There are no active interactive programming sessions available right now. {user?.role === 'mentor' ? "Create one above!" : "Check back later!"}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
