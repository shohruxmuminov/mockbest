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

  const submitCode = async (e) => {
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
        <p className="sub">Enter the admin access code to open the Admin Panel.</p>

        {error && <div className="alert alert-err">{error}</div>}

        {/* Admin access code */}
        <form onSubmit={submitCode}>
          <div className="field">
            <label>Admin Code</label>
            <input
              className="input code-input"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter admin code"
              autoFocus
              inputMode="numeric"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading || !code}>
            {loading ? 'Signing in…' : 'Enter Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
