// client/src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getSessions, getJoinableSessions, joinSession, getAnnouncements } from '../api';
import { Calendar, BookOpen, Clock, ChevronRight, Award, Brain, ChevronDown, ChevronUp, CheckCircle, BookMarked, Megaphone } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './StudentDashboard.css';

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [joinableSessions, setJoinableSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const toast = useToast();
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [data, joinableData, annData] = await Promise.all([
                getSessions(),
                getJoinableSessions(),
                getAnnouncements()
            ]);

            if (Array.isArray(data)) {
                const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setSessions(sorted);
            }
            if (Array.isArray(joinableData)) {
                setJoinableSessions(joinableData);
            }
            if (Array.isArray(annData)) {
                setAnnouncements(annData.slice(0, 3));
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (id) => {
        try {
            await joinSession(id);
            toast.success("Successfully joined the session!");
            fetchData(); // Refresh both lists
        } catch (err) {
            toast.error(err.message || "Failed to join session");
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

    const toggleExpand = (sessionId) => {
        setExpanded(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
    };

    // Computed stats
    const mySessions = sessions.filter(s => getMyData(s));
    const attendedCount = mySessions.filter(s => getMyData(s)?.status === 'present').length;
    const gradesArr = mySessions.map(s => getMyData(s)?.grade).filter(g => g && g > 0);
    const avgGrade = gradesArr.length > 0 ? (gradesArr.reduce((a, b) => a + b, 0) / gradesArr.length).toFixed(1) : '—';
    const topicsCovered = [...new Set(mySessions.map(s => s.topicName).filter(Boolean))];

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
            </div>
        );
    }

    const activeSessions = sessions
        .filter(s => s.status !== 'completed' && getMyData(s))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div>
            {/* Welcome Banner */}
            <div className="student-welcome-banner">
                <h1>Welcome back, {user?.username}! 👋</h1>
                <p className="student-welcome-subtitle">Ready for some peer learning? Here's your overview.</p>
            </div>

            {/* Stats Row */}
            <div className="student-stats-row">
                <div className="student-stat-card">
                    <div className="stat-icon-wrap blue">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{attendedCount}</h3>
                        <p>Sessions Attended</p>
                    </div>
                </div>
                <div className="student-stat-card">
                    <div className="stat-icon-wrap green">
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{avgGrade}</h3>
                        <p>Average Grade</p>
                    </div>
                </div>
                <div className="student-stat-card">
                    <div className="stat-icon-wrap purple">
                        <BookMarked size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{topicsCovered.length}</h3>
                        <p>Topics Covered</p>
                    </div>
                </div>
            </div>

            {/* AI Practice Banner */}
            <div className="student-ai-banner" onClick={() => navigate('/practice')}>
                <div className="ai-banner-content">
                    <div className="ai-banner-icon">
                        <Brain size={28} />
                    </div>
                    <div className="ai-banner-text">
                        <h2>AI Practice Mode</h2>
                        <p>Test your knowledge and level up your skills with our AI tutor.</p>
                    </div>
                </div>
                <button className="ai-banner-btn">Start Now</button>
            </div>

            {/* Announcements Mini Card */}
            {announcements.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 className="student-section-heading">
                        <span className="accent-dot" style={{ background: '#ef4444' }}></span>
                        <Megaphone size={17} style={{ marginRight: 6 }} /> Latest Announcements
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {announcements.map(ann => (
                            <div key={ann.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{ann.title}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                    {ann.message.length > 150 ? ann.message.slice(0, 150) + '…' : ann.message}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: 6 }}>— {ann.mentor_name}</div>
                            </div>
                        ))}
                    </div>
                    <Link to="/announcements" style={{ fontSize: '0.85rem', color: '#ef4444', textDecoration: 'none', display: 'inline-block', marginTop: 10 }}>
                        View all announcements →
                    </Link>
                </div>
            )}

            {/* Active & Future Sessions */}
            <div className="student-content-grid">
                {/* Active Sessions */}
                <h2 className="student-section-heading">
                    <span className="accent-dot"></span>
                    Active PLDs
                </h2>

                {activeSessions.length > 0 ? (
                    <div className="student-active-sessions">
                        {activeSessions.map(session => (
                            <div key={session.id} className="student-session-card">
                                <h3>{session.groupName}</h3>
                                <p className="session-topic">Topic: {session.topicName}</p>
                                <Link to={`/session/${session.id}`} className="btn-enter-session">
                                    Enter Session
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="student-empty-state">
                        No active sessions found.
                    </div>
                )}

                {/* Joinable Sessions */}
                <h2 className="student-section-heading" style={{ marginTop: '2.5rem' }}>
                    <span className="accent-dot blue-dot"></span>
                    Available Future Sessions
                </h2>
                {joinableSessions.length > 0 ? (
                    <div className="student-joinable-list">
                        {joinableSessions.map(session => (
                            <div key={session.id} className="joinable-session-card">
                                <div className="joinable-info">
                                    <h4>{session.groupName}</h4>
                                    <div className="joinable-meta">
                                        <Calendar size={13} />
                                        <span>{new Date(session.createdAt).toLocaleDateString()} at {session.scheduledTime || '10:00 AM'}</span>
                                    </div>
                                    <div className="joinable-topics">
                                        {session.topicNames?.map((topic, i) => (
                                            <span key={i} className="tiny-topic">{topic}</span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    className="btn-join-session"
                                    onClick={() => handleJoin(session.id)}
                                >
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="student-empty-state">
                        No sessions available for joining.
                    </div>
                )}
            </div>
        </div>
    );
}
