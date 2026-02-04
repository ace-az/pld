// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Users, ArrowRight, Trash2, X, Search } from 'lucide-react';
import { getSessions, createSession, deleteSession, getMasterStudents } from '../api';

export default function Dashboard() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [masterStudents, setMasterStudents] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    // New Session Form State
    const [groupName, setGroupName] = useState('');
    const [students, setStudents] = useState([{ name: '', discord: '' }]);
    const [searchIndex, setSearchIndex] = useState(-1);
    const [filteredStudents, setFilteredStudents] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
        if (showCreate) {
            fetchMasterStudents();
        }
    }, [showCreate]);

    const fetchSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data.reverse()); // Show newest first
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMasterStudents = async () => {
        try {
            const data = await getMasterStudents();
            setMasterStudents(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddStudentRow = () => {
        setStudents([...students, { name: '', discord: '' }]);
    };

    const handleRemoveStudentRow = (index) => {
        const newStudents = students.filter((_, i) => i !== index);
        setStudents(newStudents.length ? newStudents : [{ name: '', discord: '' }]);
    };

    const handleStudentChange = (index, field, value) => {
        const newStudents = [...students];
        newStudents[index][field] = value;
        setStudents(newStudents);

        if (field === 'name') {
            if (value.trim()) {
                const filtered = masterStudents.filter(s =>
                    s.name.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredStudents(filtered);
                setSearchIndex(index);
            } else {
                setFilteredStudents([]);
                setSearchIndex(-1);
            }
        }
    };

    const selectStudent = (index, student) => {
        const newStudents = [...students];
        newStudents[index].name = student.name;
        newStudents[index].discord = student.discord;
        setStudents(newStudents);
        setFilteredStudents([]);
        setSearchIndex(-1);
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();

        const validStudents = students.filter(s => s.name.trim());
        if (validStudents.length === 0) {
            alert("Please add at least one student name");
            return;
        }

        try {
            const newSession = await createSession({ groupName, students: validStudents });
            setSessions([newSession, ...sessions]);
            setShowCreate(false);
            setGroupName('');
            setStudents([{ name: '', discord: '' }]);
        } catch (err) {
            alert("Failed to create session");
        }
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session? This cannot be undone.")) return;

        try {
            await deleteSession(id);
            setSessions(sessions.filter(s => s.id !== id));
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
                            <label>Students</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {students.map((student, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <input
                                                className="input-control"
                                                value={student.name}
                                                onChange={e => handleStudentChange(idx, 'name', e.target.value)}
                                                placeholder="Student Name"
                                                autoComplete="off"
                                                style={{ marginBottom: 0 }}
                                            />
                                            {searchIndex === idx && filteredStudents.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 10,
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto'
                                                }}>
                                                    {filteredStudents.map(s => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => selectStudent(idx, s)}
                                                            style={{
                                                                padding: '0.5rem 1rem',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid var(--border-color)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between'
                                                            }}
                                                            className="suggestion-item"
                                                        >
                                                            <span>{s.name}</span>
                                                            <code style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{s.discord}</code>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            className="input-control"
                                            value={student.discord}
                                            onChange={e => handleStudentChange(idx, 'discord', e.target.value)}
                                            placeholder="Discord (optional)"
                                            style={{ flex: 1, marginBottom: 0 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStudentRow(idx)}
                                            className="btn-icon"
                                            style={{ color: '#f44336' }}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleAddStudentRow}
                                style={{ marginTop: '1rem', width: '100%' }}
                            >
                                <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Another Student
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            Start Session Setup
                        </button>
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
