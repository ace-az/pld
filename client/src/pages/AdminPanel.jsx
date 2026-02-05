// client/src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsers, deleteUserAccount } from '../api';
import { Shield, Trash2, User, Key, LogOut, ArrowLeft } from 'lucide-react';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginData.username === 'admin' && loginData.password === 'admin123') {
            setIsAuthenticated(true);
            setError('');
            fetchUsers();
        } else {
            setError('Invalid Admin Credentials');
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAdminUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users from server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;

        try {
            await deleteUserAccount(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting user: ' + err.message);
        }
    };

    if (!isAuthenticated) {
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
                        <button className="btn btn-primary" style={{ width: '100%' }}>Login as Admin</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--color-primary)', padding: '0.5rem', borderRadius: '8px' }}>
                        <Shield size={24} color="white" />
                    </div>
                    <h1>Admin Panel</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={() => setIsAuthenticated(false)}>
                        <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Logout
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Dashboard
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>User Accounts ({users.length})</h2>
                    <button className="btn-icon" onClick={fetchUsers} title="Refresh List">
                        <Key size={18} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'var(--bg-card)' }}>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)' }}>User</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)' }}>Discord</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)' }}>Role</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)' }}>Major</th>
                                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600' }}>{u.username}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {u.id}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{u.discordId}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge ${u.role === 'mentor' ? 'badge-success' : 'badge-warning'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{u.major || '-'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    style={{ color: 'var(--color-primary)' }}
                                                    title="Delete Account"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate(-1)}
                className="btn-outline flex-center"
                style={{ marginTop: '2rem', border: 'none', gap: '0.5rem' }}
            >
                <ArrowLeft size={18} /> Go Back
            </button>
        </div>
    );
};

export default AdminPanel;
