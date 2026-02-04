// client/src/pages/Questions.jsx
import { useState, useEffect } from 'react';
import { getQuestionSets, addQuestionSet, deleteQuestionSet } from '../api';
import { HelpCircle, Trash2, Plus, X, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export default function Questions() {
    const [questionSets, setQuestionSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState(['']); // Array of question strings

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
            const newSet = await addQuestionSet({ topic, questions: validQs });
            setQuestionSets([newSet, ...questionSets]);
            setTopic('');
            setQuestions(['']);
        } catch (err) {
            console.error('Error adding question set:', err);
            alert('Error adding question set: ' + (err.message || 'Unknown error'));
        }
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

            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                <h3>Create New Question Set</h3>
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
                        Save Question Set
                    </button>
                </form>
            </div>

            <h2>Available Topics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {questionSets.map(set => (
                    <div key={set.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                <BookOpen size={20} /> {set.topic}
                            </h3>
                            <button onClick={() => handleDeleteSet(set.id)} className="btn-icon" style={{ color: '#f44336', padding: '4px' }} title="Delete Set">
                                <X size={18} />
                            </button>
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
