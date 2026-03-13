// client/src/pages/History.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Calendar, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import { getSessions, deleteSession } from '../api';
import { useConfirm } from '../context/ConfirmContext';
import './History.css';

export default function History() {
    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState('all'); // all, completed, active
    const [visibleCount, setVisibleCount] = useState(7);
    const navigate = useNavigate();
    const { confirm } = useConfirm();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await getSessions();
            if (Array.isArray(data)) setSessions(data.reverse());
        } catch (err) { console.error('Fetch sessions:', err); }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm('Are you sure you want to delete this session?');
        if (!isConfirmed) return;
        try {
            await deleteSession(id);
            fetchSessions();
        } catch (err) { console.error('Delete session:', err); }
    };

    const filteredSessions = sessions.filter(s => {
        if (filter === 'completed') return s.status === 'completed';
        if (filter === 'active') return s.status === 'active';
        return true;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="history-page">
            <button 
                className="btn-back-premium" 
                onClick={() => navigate('/')}
            >
                <ArrowLeft size={18} />
                Back to Dashboard
            </button>
            <div className="history-header">
                <h1>PLD History</h1>
                <p>View all your past and ongoing PLD sessions</p>
            </div>

            <div className="history-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Sessions
                </button>
                <button
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
                <button
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active
                </button>
            </div>

            <div className="history-list">
                {filteredSessions.length > 0 ? (
                    <>
                        {filteredSessions.slice(0, visibleCount).map(session => (
                            <div key={session.id} className="history-card">
                                <div className="history-card-left">
                                    <div className="history-icon">
                                        <FileText size={24} />
                                    </div>
                                    <div className="history-info">
                                        <h3>{session.groupName}</h3>
                                        <p className="history-topic">{session.topicName || 'No topic'}</p>
                                        <div className="history-meta">
                                            <span><Users size={14} /> {session.students?.length || 0} students</span>
                                            <span><Calendar size={14} /> {formatDate(session.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="history-card-right">
                                    <span className={`status-badge ${session.status}`}>
                                        {session.status === 'completed' ? 'Completed' : 'Active'}
                                    </span>
                                    <div className="history-actions">
                                        <button
                                            className="btn-view"
                                            onClick={() => navigate(`/session/${session.id}`)}
                                        >
                                            View <ArrowRight size={16} />
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(session.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredSessions.length > visibleCount && (
                            <div className="show-more-wrapper">
                                <button
                                    className="btn-show-more"
                                    onClick={() => setVisibleCount(prev => prev + 7)}
                                >
                                    Show More
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-sessions">
                        <FileText size={48} />
                        <h3>No sessions found</h3>
                        <p>Start a new PLD session from the Dashboard</p>
                    </div>
                )}
            </div>
        </div>
    );
}
