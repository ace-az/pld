import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Calendar, History, HelpCircle, MessageSquare, Trophy, LogOut, LayoutDashboard, Brain, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const menuItems = [
  { name: "Students", path: "/students", icon: <Users size={20} />, mentorOnly: true },
  { name: "Calendar", path: "/calendar", icon: <Calendar size={20} />, mentorOnly: true },
  { name: "History", path: "/history", icon: <History size={20} /> },
  { name: "Questions", path: "/questions", icon: <HelpCircle size={20} />, mentorOnly: true },
  { name: "Performance Reports", path: "/student-reports", icon: <FileText size={20} />, studentOnly: true },
  { name: "AI Practice Mode", path: "/practice", icon: <Brain size={20} />, studentOnly: true },
  { name: "Discord", path: "https://discord.com", icon: <MessageSquare size={20} />, external: true },
  { name: "Leader Board", path: "/leaderboard", icon: <Trophy size={20} /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isStudent = user?.role === 'student';

  const filteredMenuItems = menuItems.filter(item => {
    if (item.mentorOnly && isStudent) return false;
    if (item.studentOnly && !isStudent) return false;
    return true;
  });

  const isActive = (path) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  const handleExternalClick = (e, path, name) => {
    if (name === "Discord") {
      const confirmLeave = window.confirm("Do you want to go to Discord?");
      if (!confirmLeave) {
        e.preventDefault();
      }
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo-container">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="sidebar-avatar" />
          ) : (
            <span style={{ color: "white", fontWeight: "900", fontSize: "1.2rem" }}>P</span>
          )}
        </div>
        <span className="logo-text">{isStudent ? 'PLD Student' : 'PLD Mentor'}</span>
      </div>

      <ul className="menu">
        {filteredMenuItems.map((item) => (
          <li key={item.name}>
            {item.external ? (
              <a
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="menu-item"
                onClick={(e) => handleExternalClick(e, item.path, item.name)}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </a>
            ) : (
              <Link
                to={item.path}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="sidebar-bottom">
        <button className="btn-logout" onClick={logout}>
          <span className="icon"><LogOut size={20} /></span>
          <span className="text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
