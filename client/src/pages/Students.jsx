// client/src/pages/Students.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMasterStudents, addMasterStudent, updateMasterStudent, deleteMasterStudent, bulkAddMasterStudents, deleteAllMasterStudents } from '../api';
import { UserPlus, Trash2, Edit2, Check, X, Upload, ArrowLeft } from 'lucide-react';

export default function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [discord, setDiscord] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDiscord, setEditDiscord] = useState('');
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await getMasterStudents();
            setStudents(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch students');
            setLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const studentExists = students.some(s => s.discord && s.discord.toLowerCase() === discord.trim().toLowerCase());
            if (studentExists) {
                alert('A student with this Discord account already exists.');
                return;
            }

            const newStudent = await addMasterStudent({ name, discord });
            // Only add if not already in list (API returns existing student if found)
            if (!students.find(s => s.id === newStudent.id)) {
                setStudents([...students, newStudent]);
            }
            setName('');
            setDiscord('');
        } catch (err) {
            alert('Error adding student');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await deleteMasterStudent(id);
            setStudents(students.filter(s => s.id !== id));
        } catch (err) {
            alert('Error deleting student');
        }
    };

    const startEdit = (student) => {
        setEditingId(student.id);
        setEditName(student.name);
        setEditDiscord(student.discord);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDiscord('');
    };

    const handleUpdate = async (id) => {
        try {
            const updated = await updateMasterStudent(id, { name: editName, discord: editDiscord });
            setStudents(students.map(s => s.id === id ? updated : s));
            cancelEdit();
        } catch (err) {
            alert('Error updating student');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("CAUTION: Are you sure you want to delete ALL students? This action is permanent and cannot be undone.")) return;

        try {
            await deleteAllMasterStudents();
            setStudents([]);
        } catch (err) {
            console.error('Error deleting all students:', err);
            alert("Error deleting students");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n');
                const seenDiscords = new Set(students.map(s => s.discord?.toLowerCase()).filter(Boolean));
                const newStudents = [];

                // Skip header if it exists
                const startIdx = (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('discord')) ? 1 : 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Support both comma and semicolon
                    const parts = line.includes(';') ? line.split(';') : line.split(',');
                    if (parts.length >= 1) {
                        const name = parts[0].trim();
                        const discord = parts[1] ? parts[1].trim() : '';
                        const discordLower = discord.toLowerCase();

                        if (discord && seenDiscords.has(discordLower)) {
                            continue; // Skip if already in list or batch
                        }

                        newStudents.push({ name, discord });
                        if (discord) seenDiscords.add(discordLower);
                    }
                }

                if (newStudents.length > 0) {
                    const created = await bulkAddMasterStudents(newStudents);
                    setStudents(prev => [...prev, ...created]);
                    alert(`Successfully imported ${created.length} students!`);
                } else {
                    alert('No new student data found (duplicates are hidden).');
                }
            } catch (err) {
                console.error('Import error:', err);
                alert('Failed to parse or import CSV file.');
            } finally {
                setImporting(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="students-container">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <button onClick={() => navigate('/')} className="btn-outline" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', border: 'none', padding: 0 }}>
                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Dashboard
                    </button>
                    <h1>Manage Students</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="file"
                        id="csv-upload"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        disabled={importing}
                    />
                    <label htmlFor="csv-upload" className="btn btn-outline flex-center" style={{ cursor: 'pointer', opacity: importing ? 0.5 : 1 }}>
                        <Upload size={20} style={{ marginRight: '0.5rem' }} /> {importing ? 'Importing...' : 'Import CSV'}
                    </label>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Add New Student</h3>
                <form onSubmit={handleAddStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Full Name</label>
                        <input
                            className="input-control"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. John Doe"
                            required
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Discord Account</label>
                        <input
                            className="input-control"
                            value={discord}
                            onChange={e => setDiscord(e.target.value)}
                            placeholder="e.g. john_doe#1234"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                        <UserPlus size={20} />
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Student List ({students.length})</h3>
                    {students.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="btn btn-outline flex-center"
                            style={{ color: '#f44336', borderColor: '#f44336', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                            <Trash2 size={16} style={{ marginRight: '0.4rem' }} /> Delete All
                        </button>
                    )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Discord</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {editingId === student.id ? (
                                            <input
                                                className="input-control"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                            />
                                        ) : student.name}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {editingId === student.id ? (
                                            <input
                                                className="input-control"
                                                value={editDiscord}
                                                onChange={e => setEditDiscord(e.target.value)}
                                            />
                                        ) : (
                                            <code style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                                                {student.discord || 'N/A'}
                                            </code>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {editingId === student.id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleUpdate(student.id)} className="btn-icon" style={{ color: '#4CAF50' }}>
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={cancelEdit} className="btn-icon" style={{ color: '#f44336' }}>
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => startEdit(student)} className="btn-icon" style={{ color: 'var(--text-secondary)' }}>
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(student.id)} className="btn-icon" style={{ color: '#f44336' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No students added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
