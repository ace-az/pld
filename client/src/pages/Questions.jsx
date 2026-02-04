// client/src/pages/Questions.jsx
import { useState, useEffect } from 'react';
import { getQuestionSets, addQuestionSet, deleteQuestionSet, deleteAllQuestionSets, updateQuestionSet } from '../api';
import { HelpCircle, Trash2, Plus, X, BookOpen, AlertCircle, RefreshCw, FileText, Upload, Edit3 } from 'lucide-react';
import * as mammoth from 'mammoth';

export default function Questions() {
    const [questionSets, setQuestionSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState(['']); // Array of question strings
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchQuestionSets();
    }, []);

    const fetchQuestionSets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getQuestionSets();
            if (Array.isArray(data)) {
                setQuestionSets(data);
            } else {
                console.error('API returned non-array data:', data);
                setQuestionSets([]);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching question sets:', err);
            setError(err.message || 'Failed to fetch question sets. Please check your connection.');
            setLoading(false);
        }
    };

    const handleAddQuestionRow = () => {
        setQuestions([...questions, '']);
    };

    const handleRemoveQuestionRow = (index) => {
        const newQs = questions.filter((_, i) => i !== index);
        setQuestions(newQs.length ? newQs : ['']);
    };

    const handleQuestionChange = (index, value) => {
        const newQs = [...questions];
        newQs[index] = value;
        setQuestions(newQs);
    };

    const handleAddSet = async (e) => {
        e.preventDefault();
        const validQs = questions.filter(q => q && q.trim());
        if (!topic.trim() || validQs.length === 0) {
            alert("Please provide a topic and at least one question.");
            return;
        }

        try {
            if (editingId) {
                const updated = await updateQuestionSet(editingId, { topic, questions: validQs });
                setQuestionSets(questionSets.map(s => s.id === editingId ? updated : s));
                alert("Question set updated successfully!");
                cancelEdit();
            } else {
                const newSet = await addQuestionSet({ topic, questions: validQs });
                setQuestionSets([newSet, ...questionSets]);
                setTopic('');
                setQuestions(['']);
            }
        } catch (err) {
            console.error('Error saving question set:', err);
            alert('Error saving question set: ' + (err.message || 'Unknown error'));
        }
    };

    const startEdit = (set) => {
        setEditingId(set.id);
        setTopic(set.topic);
        setQuestions(set.questions.map(q => q.text || q));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTopic('');
        setQuestions(['']);
    };

    const handleDeleteSet = async (id) => {
        if (!window.confirm('Are you sure you want to delete this topic and all its questions?')) return;
        try {
            await deleteQuestionSet(id);
            setQuestionSets(questionSets.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting set:', err);
            alert('Error deleting question set');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("CAUTION: Are you sure you want to delete ALL question topics? This action is permanent and cannot be undone.")) return;

        try {
            await deleteAllQuestionSets();
            setQuestionSets([]);
        } catch (err) {
            console.error('Error deleting all topics:', err);
            alert("Error deleting topics");
        }
    };

    const handleWordUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Extract topic as filename (without extension)
        const fileName = file.name.replace(/\.[^/.]+$/, "");

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer });
                const text = result.value;

                // Improved parser: specifically look for matches starting with a number
                const questionRegex = /(?:^|\n)\s*\d+[\.\)\-]\s+([\s\S]*?)(?=\n\s*\d+[\.\)\-]\s+|$)/g;
                const matches = [...text.matchAll(questionRegex)];

                const cleanedQuestions = matches
                    .map(m => m[1].trim())
                    .filter(q => q.length > 0);

                if (cleanedQuestions.length > 0) {
                    // Create directly in database like student importation
                    const newSet = await addQuestionSet({
                        topic: fileName,
                        questions: cleanedQuestions
                    });

                    setQuestionSets([newSet, ...questionSets]);
                    alert(`Successfully imported "${fileName}" with ${cleanedQuestions.length} questions!`);
                } else {
                    alert('Could not find any numbered questions in the file.\n\nRequired format: 1. Question, 2. Question, etc.');
                }
            } catch (err) {
                console.error('Word parse error:', err);
                alert('Error importing Word file: ' + err.message);
            } finally {
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (loading) return (
        <div className="container flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading Question Bank...</p>
        </div>
    );

    if (error) return (
        <div className="container" style={{ padding: '2rem' }}>
            <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #f44336' }}>
                <AlertCircle size={48} color="#f44336" style={{ marginBottom: '1rem' }} />
                <h2>Oops! Something went wrong</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
                <button onClick={fetchQuestionSets} className="btn btn-primary flex-center" style={{ margin: '0 auto' }}>
                    <RefreshCw size={18} style={{ marginRight: '0.5rem' }} /> Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="questions-container">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <HelpCircle size={32} color="var(--color-primary)" />
                    <h1>Question Bank</h1>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)', background: editingId ? 'rgba(var(--color-primary-rgb), 0.05)' : 'var(--bg-card)' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{editingId ? 'Edit Question Set' : 'Create New Question Set'}</h3>
                    {editingId && (
                        <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                            Cancel Edit
                        </button>
                    )}
                </div>
                <form onSubmit={handleAddSet}>
                    <div className="input-group">
                        <label>Topic Name (e.g. Arrays, Recursion, Git)</label>
                        <input
                            className="input-control"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="Enter topic..."
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Questions</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {questions.map((q, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        className="input-control"
                                        value={q}
                                        onChange={e => handleQuestionChange(idx, e.target.value)}
                                        placeholder={`Question ${idx + 1}`}
                                        style={{ marginBottom: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestionRow(idx)}
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
                            onClick={handleAddQuestionRow}
                            style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.85rem' }}
                        >
                            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Another Question
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '45px' }}>
                        {editingId ? 'Update Question Set' : 'Save Question Set'}
                    </button>

                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <input
                            type="file"
                            id="word-upload"
                            accept=".docx"
                            style={{ display: 'none' }}
                            onChange={handleWordUpload}
                        />
                        <label htmlFor="word-upload" className="btn btn-outline flex-center" style={{ width: '100%', cursor: 'pointer', gap: '0.5rem' }}>
                            <FileText size={18} /> Import from Word (.docx)
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                            Format: Numbered list (1. Question, 2. Question...)
                        </p>
                    </div>
                </form>
            </div>

            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Available Topics</h2>
                {questionSets.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        className="btn btn-outline flex-center"
                        style={{ color: '#f44336', borderColor: '#f44336', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <Trash2 size={16} style={{ marginRight: '0.4rem' }} /> Delete All Topics
                    </button>
                )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {questionSets.map(set => (
                    <div key={set.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', flex: 1 }}>
                                <BookOpen size={20} /> {set.topic}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                    onClick={() => startEdit(set)}
                                    className="btn-icon"
                                    style={{ color: 'var(--text-secondary)', padding: '5px' }}
                                    title="Edit Set"
                                >
                                    <Edit3 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSet(set.id)}
                                    className="btn-icon"
                                    style={{ color: '#f44336', padding: '5px' }}
                                    title="Delete Set"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            {set.questions && Array.isArray(set.questions) ? (
                                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                    {set.questions.map((q, idx) => (
                                        <li key={q.id || idx} style={{ marginBottom: '0.5rem' }}>{q.text || q}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>No questions in this set.</p>
                            )}
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{set.questions?.length || 0} questions</span>
                            <span>{set.createdAt ? new Date(set.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                    </div>
                ))}
            </div>
            {questionSets.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '12px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                    <HelpCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No question sets yet. Create your first one above!</p>
                </div>
            )}
        </div>
    );
}
