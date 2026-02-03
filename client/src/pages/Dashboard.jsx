// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Users, ArrowRight, Trash2 } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    // New Session Form State
    const [groupName, setGroupName] = useState('');
    const [studentsText, setStudentsText] = useState(''); // "Name, Discord\nName, Discord"

    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/sessions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data.reverse()); // Show newest first
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        // ... (existing create logic kept briefly for context if needed, but we are just adding delete below)
        // Parse students
        const students = studentsText.split('\n').filter(line => line.trim()).map(line => {
            const parts = line.split(',');
            return {
                name: parts[0].trim(),
                discord: parts[1] ? parts[1].trim() : ''
            };
        });

        if (students.length === 0) {
            alert("Please add at least one student");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ groupName, students })
            });

            if (res.ok) {
                const newSession = await res.json();
                setSessions([newSession, ...sessions]);
                setShowCreate(false);
                setGroupName('');
                setStudentsText('');
            }
        } catch (err) {
            alert("Failed to create session");
        }
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session? This cannot be undone.")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== id));
            } else {
                alert("Failed to delete session");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting session");
        }
    };

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h1>Welcome, {user.username}</h1>
                <button className="btn btn-primary flex-center" onClick={() => setShowCreate(!showCreate)}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> {showCreate ? 'Cancel' : 'New PLD Session'}
                </button>
            </div>

            {showCreate && (
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                    <h3>Create New Group</h3>
                    <form onSubmit={handleCreateSession}>
                        <div className="input-group">
                            <label>Group Name</label>
                            <input
                                className="input-control"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                placeholder="e.g. Alpha Squad - Week 5"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Students (One per line: "Name, DiscordUsername")</label>
                            <textarea
                                className="input-control"
                                rows={5}
                                value={studentsText}
                                onChange={e => setStudentsText(e.target.value)}
                                placeholder="John Doe, john#1234&#10;Jane Smith, jane.smith"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Start Session Setup</button>
                    </form>
                </div>
            )}

            <h2>Your Sessions</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {sessions.map(session => (
                    <div key={session.id} className="card" style={{ position: 'relative' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, marginRight: '1rem' }}>
                                <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-primary)' }}>{session.groupName}</h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(session.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                background: session.status === 'completed' ? '#4CAF50' : '#FF9800',
                                color: 'white',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap'
                            }}>
                                {session.status.toUpperCase()}
                            </span>
                        </div>

                        <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} /> {session.students.length} Students
                        </div>

                        <div className="flex-between">
                            <Link to={`/session/${session.id}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: 1, justifyContent: 'center', marginRight: '0.5rem' }}>
                                {session.status === 'active' ? 'Resume' : 'Report'} <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                            </Link>
                            <button
                                onClick={() => handleDeleteSession(session.id)}
                                className="btn-icon"
                                style={{ color: 'white', padding: '0.5rem', border: 'none', background: 'var(--color-primary)', borderRadius: '4px' }}
                                title="Delete Session"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No sessions found. Create one to get started!</div>
                )}
            </div>
        </div>
    );
}
