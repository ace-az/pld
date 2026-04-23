import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const toast = useToast();

    // If already auth, redirect to panel
    if (sessionStorage.getItem('adminAuth') === 'true') {
        return <Navigate to="/admin" replace />;
    }

    const handleLogin = (e) => {
        e.preventDefault();
        const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
        if (correctPassword && loginData.username === 'admin' && loginData.password === correctPassword) {
            sessionStorage.setItem('adminAuth', 'true');
            setError('');
            toast.success('Admin login successful');
            navigate('/admin');
        } else {
            setError('Invalid Admin Credentials');
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--color-primary-light)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Shield size={32} color="var(--color-primary)" />
                </div>
                <h2>Admin Access</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Secure area for system management.</p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            className="input-control"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-control"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                        />
                    </div>
                    {error && <div style={{ color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
                    <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Login as Admin</button>
                </form>
                
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-outline"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} /> Back to App
                </button>
            </div>
        </div>
    );
};

export default AdminLogin;
