import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LogoMark } from '../components/Logo.jsx';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (session?.type === 'admin') nav('/admin', { replace: true });
  }, [session, nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, admin } = await api.post('/auth/admin/code', { code });
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
        <p className="sub">
          Enter the admin access code to continue.
        </p>

        {error && <div className="alert alert-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Admin Access Code</label>
            <input
              className="input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 4-digit code"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading || !code}>
            {loading ? 'Signing in…' : 'Sign in as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
