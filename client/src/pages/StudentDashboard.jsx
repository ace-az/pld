// client/src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getSessions } from '../api';
import { BookOpen, Calendar, ChevronDown, ChevronUp, Award } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const data = await getSessions();
                setSessions(data.reverse());
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const getMyData = (session) => {
        if (!session.students || !user) return null;
        const searchKey = user.discordId || user.username;
        if (!searchKey) return null;
        return session.students.find(s =>
            s.discord && s.discord.toLowerCase() === searchKey.toLowerCase()
        );
    };

    const toggleExpand = (sessionId) => {
        setExpanded(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
        );
    }

    const activeSessions = sessions.filter(s => s.status !== 'completed');

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1>Student Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Welcome, {user?.username}!
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Active Sessions Column */}
                <div>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Active PLDs</h2>

                    {activeSessions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activeSessions.map(session => (
                                <div key={session.id} className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>{session.groupName}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                        Topic: {session.topicName}
                                    </p>
                                    <Link
                                        to={`/session/${session.id}`}
                                        className="btn btn-primary"
                                        style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                                    >
                                        Enter Session
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No active sessions found.
                        </div>
                    )}
                </div>

                {/* Reports Column */}
                <div>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Performance Reports</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                        {sessions.length === 0 ? (
                            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No reports available yet.
                            </div>
                        ) : (
                            sessions.map(session => {
                                const myData = getMyData(session);
                                if (!myData) return null;
                                const isExpanded = expanded[session.id];

                                return (
                                    <div key={session.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, marginRight: '1rem' }}>
                                                <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-primary)' }}>{session.groupName}</h3>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Calendar size={12} />
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: myData.status === 'absent' ? '#d32f2f' : '#4CAF50',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {myData.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.8rem',
                                                background: 'var(--bg-app)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <BookOpen size={14} color="var(--color-primary)" />
                                                <span>{session.topicName || 'General'}</span>
                                            </div>

                                            {myData.grade > 0 && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(33, 150, 243, 0.1)',
                                                    color: '#2196F3',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(33, 150, 243, 0.3)',
                                                    fontWeight: 'bold'
                                                }}>
                                                    <Award size={14} />
                                                    <span>Grade: {myData.grade}/5</span>
                                                </div>
                                            )}
                                        </div>

                                        {(myData.answeredQuestions?.length > 0 || myData.incorrectQuestions?.length > 0) && session.questions && (
                                            <div style={{ marginBottom: '1rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Questions Review
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {session.questions
                                                        .filter((q, idx) => myData.answeredQuestions?.includes(q.id || idx))
                                                        .map((q, idx) => (
                                                            <div key={`ans-${idx}`} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span>
                                                                <span style={{ color: 'var(--text-main)' }}>{q.text || q}</span>
                                                            </div>
                                                        ))
                                                    }
                                                    {session.questions
                                                        .filter((q, idx) => myData.incorrectQuestions?.includes(q.id || idx))
                                                        .map((q, idx) => (
                                                            <div key={`inc-${idx}`} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                                <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>✗</span>
                                                                <span style={{ color: 'var(--text-secondary)' }}>{q.text || q}</span>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}

                                        {myData.result ? (
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <button
                                                    onClick={() => toggleExpand(session.id)}
                                                    className="btn-outline"
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.9rem',
                                                        padding: '0.5rem',
                                                        marginTop: 'auto'
                                                    }}
                                                >
                                                    {isExpanded ? 'Hide Feedback' : 'View Feedback'}
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>

                                                {isExpanded && (
                                                    <div style={{
                                                        marginTop: '1rem',
                                                        padding: '1rem',
                                                        background: 'var(--bg-app)',
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem',
                                                        lineHeight: '1.6',
                                                        border: '1px solid var(--border-color)',
                                                        whiteSpace: 'pre-wrap',
                                                        animation: 'fadeIn 0.2s ease'
                                                    }}>
                                                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>AI Analysis:</strong>
                                                        <div style={{ color: 'var(--text-secondary)' }}>
                                                            {myData.result
                                                                .replace(/^Style \d+ - .*?:\s*/i, '')
                                                                .replace(/^"|"$/g, '')
                                                                .replace(/\*\*/g, '')
                                                                .replace(/###/g, '')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', marginTop: 'auto', padding: '0.5rem' }}>
                                                No feedback available yet.
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
