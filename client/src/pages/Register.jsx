// client/src/pages/Register.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', password: '', discordId: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '60vh' }}>
            <form onSubmit={handleSubmit} className="card" style={{ width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Register</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <div className="input-group">
                    <label>Username</label>
                    <input
                        className="input-control"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        className="input-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Discord Username (Optional)</label>
                    <input
                        className="input-control"
                        placeholder="For notifications"
                        value={formData.discordId}
                        onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--color-primary)' }}>Have an account? Login</Link>
                </div>
            </form>
        </div>
    );
}
