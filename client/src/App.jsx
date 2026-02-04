// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SessionRun from './pages/SessionRun';
import Students from './pages/Students';
import Questions from './pages/Questions';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/session/:id" element={
          <PrivateRoute>
            <SessionRun />
          </PrivateRoute>
        } />
        <Route path="/students" element={
          <PrivateRoute>
            <Students />
          </PrivateRoute>
        } />
        <Route path="/questions" element={
          <PrivateRoute>
            <Questions />
          </PrivateRoute>
        } />
      </Routes>
    </Layout>
  );
}
