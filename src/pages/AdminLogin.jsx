import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LogoMark } from '../components/Logo.jsx';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (session?.type === 'admin') {
      nav('/admin', { replace: true });
      return;
    }
    // Auto-login: directly sign in without code
    autoLogin();
  }, [session, nav]);

  const autoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { token, admin } = await api.post('/auth/admin/login');
      login(token, { type: 'admin', ...admin });
      nav('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-wrap">
      <div className="card auth-card">
        <LogoMark size={52} />
        <h2>Admin Sign In</h2>
        <p className="sub">{loading ? 'Signing in...' : 'Redirecting to Admin Panel...'}</p>

        {error && (
          <>
            <div className="alert alert-err">{error}</div>
            <button className="btn btn-primary btn-block" onClick={autoLogin} style={{ marginTop: 12 }}>
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
