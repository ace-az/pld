// client/src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser({ username, password });
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '60vh' }}>
            <form onSubmit={handleSubmit} className="card" style={{ width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Login</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <div className="input-group">
                    <label>Username</label>
                    <input
                        className="input-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        className="input-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/register" style={{ color: 'var(--color-primary)' }}>Need an account? Register</Link>
                </div>
            </form>
        </div>
    );
}
