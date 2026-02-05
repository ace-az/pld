// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SessionRun from './pages/SessionRun';
import Students from './pages/Students';
import Questions from './pages/Questions';
import StudentDashboard from './pages/StudentDashboard';
import StudentReportsPage from './pages/StudentReportsPage';
import Leaderboard from './pages/Leaderboard';
import AIPractice from './pages/AIPractice';
import AdminPanel from './pages/AdminPanel';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function MentorRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return <Navigate to="/student-dashboard" />;
  return children;
}

export default function App() {
  return (
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
        <Route path="/student-reports" element={
          <PrivateRoute>
            <StudentReportsPage />
          </PrivateRoute>
        } />
      </Routes>
    </Layout>
  );
}

