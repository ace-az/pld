// client/src/components/Layout.jsx
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, GraduationCap, HelpCircle, Trophy, Settings } from 'lucide-react';

export default function Layout({ children }) {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <header className="navbar" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)' }}>
                <div className="brand">
                    <Link to={user?.role === 'student' ? "/student-dashboard" : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={24} color="#d32f2f" />
                        <span style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>JACKPTO</span>
                    </Link>
                </div>
                <div className="nav-items flex-center" style={{ gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: '500' }}>v 0.0.2</span>
                    <button onClick={toggleTheme} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                    </button>

                    {user && (
                        <div className="user-menu flex-center" style={{ gap: '1rem' }}>
                            <Link to="/leaderboard" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                <Trophy size={18} /> <span>Leaderboard</span>
                            </Link>
                            {user.role !== 'student' && (
                                <>
                                    <Link to="/students" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                        <GraduationCap size={18} /> <span>Students</span>
                                    </Link>
                                    <Link to="/questions" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                        <HelpCircle size={18} /> <span>Questions</span>
                                    </Link>
                                </>
                            )}
                            <span style={{ color: 'var(--text-main)' }}>{user.username}</span>
                            <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem' }}>
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </header>
            <main className="content container" style={{ padding: '2rem 0' }}>
                {children}
            </main>
        </div>
    );
}
