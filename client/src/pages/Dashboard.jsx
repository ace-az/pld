// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Plus, Users, ArrowRight, Trash2, X, Search, BookOpen, HelpCircle, Upload } from 'lucide-react';
import { getSessions, createSession, deleteSession, getMasterStudents, getQuestionSets, deleteAllSessions } from '../api';

export default function Dashboard() {
    const { user } = useAuth();
    const location = useLocation();
    const [sessions, setSessions] = useState([]);
    const [masterStudents, setMasterStudents] = useState([]);
    const [questionSets, setQuestionSets] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    // New Session Form State
    const [groupName, setGroupName] = useState('');
    const [topicIds, setTopicIds] = useState([]); // Array of selected topic IDs
    const [students, setStudents] = useState([{ name: '', discord: '' }]);
    const [searchIndex, setSearchIndex] = useState(-1);
    const [filteredStudents, setFilteredStudents] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
        if (showCreate) {
            fetchMasterData();
        }
    }, [showCreate]);

    // Restore showCreate state and form data when returning from Questions page
    useEffect(() => {
        if (location.state?.returnToSessionCreation) {
            setShowCreate(true);

            // Restore form data from localStorage
            const savedFormData = localStorage.getItem('sessionFormData');
            if (savedFormData) {
                try {
                    const formData = JSON.parse(savedFormData);
                    setGroupName(formData.groupName || '');
                    setTopicIds(formData.topicIds || []);
                    setStudents(formData.students || [{ name: '', discord: '' }]);

                    // Clear the saved data after restoring
                    localStorage.removeItem('sessionFormData');
                } catch (err) {
                    console.error('Error restoring form data:', err);
                }
            }
        }
    }, [location]);

    const fetchSessions = async () => {
        try {
            const data = await getSessions();
            if (Array.isArray(data)) {
                setSessions(data.reverse()); // Show newest first
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [studentsData, setsData] = await Promise.all([
                getMasterStudents(),
                getQuestionSets()
            ]);

            if (Array.isArray(studentsData)) setMasterStudents(studentsData);
            if (Array.isArray(setsData)) {
                setQuestionSets(setsData);
                // Removed auto-select logic to let user explicitly choose
            }
        } catch (err) {
            console.error('Error fetching master data:', err);
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

        if (topicIds.length === 0) {
            alert("Please select at least one topic for this session. Create one in Question Bank first.");
            return;
        }

        try {
            const newSession = await createSession({
                groupName,
                students: validStudents,
                topicIds
            });
            setSessions([newSession, ...sessions]);
            setShowCreate(false);
            setGroupName('');
            setTopicIds([]);
            setStudents([{ name: '', discord: '' }]);
        } catch (err) {
            alert(err.message || "Failed to create session");
        }
    };

    const handleDeleteSession = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session? This cannot be undone.")) return;

        try {
            await deleteSession(id);
            setSessions(sessions.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting session:', err);
            alert("Error deleting session");
        }
    };

    const handleDeleteAllSessions = async () => {
        if (!window.confirm("CAUTION: Are you sure you want to delete ALL sessions? This action is permanent and cannot be undone.")) return;

        try {
            await deleteAllSessions();
            setSessions([]);
        } catch (err) {
            console.error('Error deleting all sessions:', err);
            alert("Error deleting sessions");
        }
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n');
                const seenDiscords = new Set();
                const newStudents = [];

                // Skip header if it exists
                const startIdx = (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('discord')) ? 1 : 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const parts = line.includes(';') ? line.split(';') : line.split(',');
                    if (parts.length >= 1) {
                        const name = parts[0].trim();
                        const discord = parts[1] ? parts[1].trim() : '';

                        if (discord && seenDiscords.has(discord)) {
                            continue; // Skip internal duplicates
                        }

                        newStudents.push({ name, discord });
                        if (discord) seenDiscords.add(discord);
                    }
                }

                if (newStudents.length > 0) {
                    setStudents(newStudents);
                    alert(`Successfully loaded ${newStudents.length} students into the session!`);
                } else {
                    alert('No valid student data found in file.');
                }
            } catch (err) {
                console.error('CSV parse error:', err);
                alert('Failed to parse CSV file.');
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsText(file);
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
                    <div className="flex-between">
                        <h3>Create New Group</h3>
                        <button
                            type="button"
                            onClick={() => {
                                // Save current form data to localStorage
                                localStorage.setItem('sessionFormData', JSON.stringify({
                                    groupName,
                                    topicIds,
                                    students
                                }));
                                // Navigate to questions page
                                navigate('/questions', { state: { from: 'session-creation' } });
                            }}
                            className="btn btn-outline flex-center"
                            style={{ fontSize: '0.8rem', gap: '0.4rem' }}
                        >
                            <HelpCircle size={14} /> Manage Question Bank
                        </button>
                    </div>
                    <form onSubmit={handleCreateSession}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Select Topics</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <select
                                        className="input-control"
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            if (id && !topicIds.includes(id)) {
                                                setTopicIds([...topicIds, id]);
                                                e.target.value = ""; // Reset select
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select a topic to add...</option>
                                        {questionSets.filter(qs => !topicIds.includes(qs.id)).map(set => (
                                            <option key={set.id} value={set.id}>{set.topic}</option>
                                        ))}
                                        {questionSets.length === 0 && <option disabled>No topics available</option>}
                                    </select>
                                </div>

                                {/* Selected Topics List */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '40px' }}>
                                    {topicIds.length > 0 ? topicIds.map(id => {
                                        const topic = questionSets.find(q => q.id === id);
                                        return topic ? (
                                            <div key={id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.4rem 0.8rem',
                                                background: 'var(--color-primary)',
                                                color: 'white',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                boxShadow: 'var(--shadow-sm)'
                                            }}>
                                                <span>{topic.topic}</span>
                                                <X
                                                    size={14}
                                                    style={{ cursor: 'pointer', opacity: 0.8 }}
                                                    onClick={() => setTopicIds(topicIds.filter(tid => tid !== id))}
                                                    onMouseOver={e => e.target.style.opacity = 1}
                                                    onMouseOut={e => e.target.style.opacity = 0.8}
                                                />
                                            </div>
                                        ) : null;
                                    }) : (
                                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                                            No topics selected. Please select at least one.
                                        </div>
                                    )}
                                </div>

                                {questionSets.length === 0 && (
                                    <small style={{ color: '#f44336', marginTop: '4px', display: 'block' }}>
                                        Please{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                localStorage.setItem('sessionFormData', JSON.stringify({
                                                    groupName,
                                                    topicIds,
                                                    students
                                                }));
                                                navigate('/questions', { state: { from: 'session-creation' } });
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#f44336',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                padding: 0,
                                                font: 'inherit'
                                            }}
                                        >
                                            add a topic
                                        </button>{' '}
                                        first.
                                    </small>
                                )}
                            </div>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline flex-center"
                                    onClick={handleAddStudentRow}
                                >
                                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Student
                                </button>
                                <div>
                                    <input
                                        type="file"
                                        id="session-csv-upload"
                                        accept=".csv"
                                        style={{ display: 'none' }}
                                        onChange={handleCsvUpload}
                                    />
                                    <label htmlFor="session-csv-upload" className="btn btn-outline flex-center" style={{ cursor: 'pointer', width: '100%' }}>
                                        <Upload size={16} style={{ marginRight: '0.5rem' }} /> Import CSV
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '45px' }}>
                            {questionSets.length > 0 ? 'Start Session Setup' : 'Create Topic First'}
                        </button>
                    </form>
                </div>
            )}

            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h2>Your Sessions</h2>
                {sessions.length > 0 && (
                    <button
                        onClick={handleDeleteAllSessions}
                        className="btn btn-outline"
                        style={{ color: '#f44336', borderColor: '#f44336', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                        <Trash2 size={14} style={{ marginRight: '0.4rem' }} /> Delete All
                    </button>
                )}
            </div>

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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    background: session.status === 'completed' ? '#4CAF50' : '#FF9800',
                                    color: 'white',
                                    fontSize: '0.8rem'
                                }}>
                                    {session.status.toUpperCase()}
                                </span>
                                {session.topicName && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <BookOpen size={12} /> {session.topicName}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} /> {session.students?.length || 0} Students
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
