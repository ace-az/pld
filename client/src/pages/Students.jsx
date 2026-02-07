// client/src/pages/Students.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMasterStudents, addMasterStudent, updateMasterStudent, deleteMasterStudent, bulkAddMasterStudents, deleteAllMasterStudents } from '../api';
import { UserPlus, Trash2, Edit2, Check, X, Upload, ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [discord, setDiscord] = useState('');
    const [major, setMajor] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDiscord, setEditDiscord] = useState('');
    const [editMajor, setEditMajor] = useState('');
    const [importing, setImporting] = useState(false);

    // Search and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

            const newStudent = await addMasterStudent({ name, discord, major });
            // Only add if not already in list (API returns existing student if found)
            if (!students.find(s => s.id === newStudent.id)) {
                setStudents([...students, newStudent]);
            }
            setName('');
            setDiscord('');
            setMajor('');
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
        setEditMajor(student.major || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDiscord('');
        setEditMajor('');
    };

    const handleUpdate = async (id) => {
        try {
            const updated = await updateMasterStudent(id, { name: editName, discord: editDiscord, major: editMajor });
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
                        const major = parts[2] ? parts[2].trim() : '';
                        const discordLower = discord.toLowerCase();

                        if (discord && seenDiscords.has(discordLower)) {
                            continue; // Skip if already in list or batch
                        }

                        newStudents.push({ name, discord, major });
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

    // Filter and Paginate
    const safeStudents = Array.isArray(students) ? students : [];

    const filteredStudents = safeStudents.filter(student => {
        if (!student) return false;
        const nameMatch = student.name ? student.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const discordMatch = student.discord ? student.discord.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const majorMatch = student.major ? student.major.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        return nameMatch || discordMatch || majorMatch;
    });

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) return <div className="p-4 text-center">Loading...</div>;

    if (error) {
        return (
            <div className="container" style={{ padding: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', borderColor: '#f44336' }}>
                    <h3 style={{ color: '#f44336' }}>Error Loading Students</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchStudents}>Retry</button>
                    <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginLeft: '1rem' }}>Go Back</button>
                </div>
            </div>
        );
    }

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
                <form onSubmit={handleAddStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
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
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Major</label>
                        <input
                            className="input-control"
                            value={major}
                            onChange={e => setMajor(e.target.value)}
                            placeholder="e.g. Computer Science"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                        <UserPlus size={20} />
                    </button>
                </form>
            </div>

            <div className="card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Student List ({filteredStudents.length})</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    className="input-control"
                                    style={{ marginBottom: 0, paddingLeft: '35px', paddingRight: '10px', width: '250px' }}
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
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
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Discord</th>
                                <th style={{ padding: '1rem' }}>Major</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentStudents.map(student => (
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
                                    <td style={{ padding: '1rem' }}>
                                        {editingId === student.id ? (
                                            <input
                                                className="input-control"
                                                value={editMajor}
                                                onChange={e => setEditMajor(e.target.value)}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {student.major || 'N/A'}
                                            </span>
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
                    {students.length > 0 && filteredStudents.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No students found matching your search.
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                            <button
                                className="btn-icon"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    opacity: currentPage === 1 ? 0.3 : 1,
                                    cursor: currentPage === 1 ? 'default' : 'pointer',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Page <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
                            </span>

                            <button
                                className="btn-icon"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    opacity: currentPage === totalPages ? 0.3 : 1,
                                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
