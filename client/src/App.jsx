// client/src/App.jsx
// Triggering Vercel rebuild 2
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import SessionRun from './pages/SessionRun';
import WorkshopWorkspace from './pages/WorkshopWorkspace';
import Workshops from './pages/Workshops';
import Students from './pages/Students';
import Questions from './pages/Questions';
import StudentDashboard from './pages/StudentDashboard';
import DeclareMajor from './pages/DeclareMajor';
import StudentReportsPage from './pages/StudentReportsPage';
import Leaderboard from './pages/Leaderboard';
import AIPractice from './pages/AIPractice';
import AdminPanel from './pages/AdminPanel';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Announcements from './pages/Announcements';

import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function MentorRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return <Navigate to="/student-dashboard" />;
  if (!user.major || user.major === 'Undeclared') return <Navigate to="/declare-major" />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <MentorRoute>
                <Dashboard />
              </MentorRoute>
            } />
            <Route path="/session/:id" element={
              <PrivateRoute>
                <SessionRun />
              </PrivateRoute>
            } />
            <Route path="/workshops" element={
              <PrivateRoute>
                <Workshops />
              </PrivateRoute>
            } />
            <Route path="/workshop/:id" element={
              <PrivateRoute>
                <WorkshopWorkspace />
              </PrivateRoute>
            } />
            <Route path="/students" element={
              <MentorRoute>
                <Students />
              </MentorRoute>
            } />
            <Route path="/questions" element={
              <MentorRoute>
                <Questions />
              </MentorRoute>
            } />
            <Route path="/leaderboard" element={
              <PrivateRoute>
                <Leaderboard />
              </PrivateRoute>
            } />
            <Route path="/history" element={
              <MentorRoute>
                <History />
              </MentorRoute>
            } />
            <Route path="/calendar" element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            } />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/practice" element={
              <PrivateRoute>
                <AIPractice />
              </PrivateRoute>
            } />
            <Route path="/student-dashboard" element={
              <PrivateRoute>
                <StudentDashboard />
              </PrivateRoute>
            } />
            <Route path="/declare-major" element={
              <PrivateRoute>
                <DeclareMajor />
              </PrivateRoute>
            } />
            <Route path="/student-reports" element={
              <PrivateRoute>
                <StudentReportsPage />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/announcements" element={
              <PrivateRoute>
                <Announcements />
              </PrivateRoute>
            } />
          </Routes>
        </Layout>
      </ConfirmProvider>
    </ToastProvider>
  );
}

