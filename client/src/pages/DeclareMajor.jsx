// client/src/pages/DeclareMajor.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMajors, updateUserProfile } from '../api';
import { BookOpen } from 'lucide-react';

export default function DeclareMajor() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [majors, setMajors] = useState([]);
    const [selectedMajor, setSelectedMajor] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMajors = async () => {
            try {
                const data = await getMajors();
                setMajors(data);
            } catch (err) {
                console.error("Failed to load majors", err);
                setError('Failed to load available majors. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchMajors();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMajor) {
            setError('Please select a major.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const res = await updateUserProfile({ major: selectedMajor });

            // Update auth context and local storage
            const storedToken = localStorage.getItem('token');
            const updatedUser = {
                ...res.user,
                avatar: res.user?.avatar_url || res.user?.avatar || user?.avatar || ''
            };
            login(storedToken, updatedUser);

            navigate('/student-dashboard');
        } catch (err) {
            setError(err.message || 'Failed to update major.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '60vh', flexDirection: 'column' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading majors...</p>
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '60vh' }}>
            <form onSubmit={handleSubmit} className="card" style={{ width: '450px', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                    <BookOpen size={48} />
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>Welcome to PLD{user?.username ? `, ${user.username}` : ''}!</h2>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Before you can proceed to your dashboard, please tell us what you're studying so we can personalize your experience.
                </p>

                {error && <div style={{ color: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <div className="input-group">
                    <label>Select your Major</label>
                    <select
                        className="input-control"
                        value={selectedMajor}
                        onChange={(e) => setSelectedMajor(e.target.value)}
                        required
                        style={{ cursor: 'pointer', padding: '0.75rem' }}
                        disabled={saving}
                    >
                        <option value="">Select your major…</option>
                        {majors.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', fontSize: '1rem' }}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Continue to Dashboard'}
                </button>
            </form>
        </div>
    );
}
