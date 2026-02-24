import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import logo from '../assets/logo.png';
import Sidebar from './Sidebar';
import './Layout.css';

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
      <Sidebar />

      <div className="layout-content">
        {/* Navbar */}
        <header className="navbar">
          <Link
            to={user?.role === 'student' ? '/student-dashboard' : '/'}
            className="logo-link"
          >
            <img src={logo} alt="Logo" className="logo-img" />
            <span className="navbar-logo-text">JACKPTO</span>
          </Link>

          <div className="navbar-right">
            <button onClick={toggleTheme} className="btn-icon" title="Theme">
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>

            {user && (
              <div className="profile-wrapper">
                <Link to="/profile" className="profile-btn" title="Profile">
                  {user.avatar ? (
                    <div className="nav-avatar-wrapper">
                      <img src={user.avatar} alt="User Avatar" className="nav-avatar" />
                    </div>
                  ) : (
                    <User size={20} />
                  )}
                  <span className="profile-text">{user.username}</span>
                </Link>

                <button onClick={handleLogout} className="btn-icon" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
