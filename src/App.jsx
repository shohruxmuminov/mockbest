import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './lib/auth.jsx';
import { api } from './lib/api.js';
import { useTheme } from './lib/theme.js';
import Navbar from './components/Navbar.jsx';
import ThreeBackground from './components/ThreeBackground.jsx';
import CandidateRealtime from './components/CandidateRealtime.jsx';
import Home from './pages/Home.jsx';
import CandidateLogin from './pages/CandidateLogin.jsx';
import CandidateDashboard from './pages/CandidateDashboard.jsx';
import TestRunner from './pages/TestRunner.jsx';
import ThankYou from './pages/ThankYou.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

function Protected({ role, children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to={role === 'admin' ? '/admin' : '/login'} replace />;
  if (session.type !== role) return <Navigate to="/" replace />;
  return children;
}

function AdminGuard({ children }) {
  const { session, login } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (session?.type === 'admin') {
      setReady(true);
      return;
    }
    // Auto-login admin without any code
    api.post('/auth/admin/login')
      .then(({ token, admin }) => {
        login(token, { type: 'admin', ...admin });
        setReady(true);
      })
      .catch(() => setReady(true)); // fallback to normal redirect
  }, []);

  if (!ready) return null;
  if (!session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { theme, toggle } = useTheme();
  const { session } = useAuth();
  const loc = useLocation();
  const isRunner = loc.pathname.startsWith('/test/');

  return (
    <>
      {!isRunner && <ThreeBackground density={loc.pathname === '/' ? 1 : 0.5} />}
      {!isRunner && <Navbar theme={theme} onToggleTheme={toggle} />}
      {session?.type === 'candidate' && <CandidateRealtime />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CandidateLogin />} />
        <Route
          path="/dashboard"
          element={
            <Protected role="candidate">
              <CandidateDashboard />
            </Protected>
          }
        />
        <Route
          path="/test/:id"
          element={
            <Protected role="candidate">
              <TestRunner />
            </Protected>
          }
        />
        <Route path="/done" element={<ThankYou />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}