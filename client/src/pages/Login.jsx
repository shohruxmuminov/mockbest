import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api.js';
import './Login.css';

export default function Login() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidateCode, setCandidateCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCandidateLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (candidateCode.length !== 14) {
      setError('Candidate code must be exactly 14 digits.');
      return;
    }

    try {
      const data = await api.post('/auth/candidate', { code: candidateCode });
      login(data.token, { type: 'candidate', ...data.candidate });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const data = await api.post('/auth/admin/code', { code: adminCode });
      login(data.token, { type: 'admin', ...data.admin });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <div className="glass-panel login-panel">
        <div className="text-center mb-4">
          <img src="/assets/ielts-logo-placeholder.png" alt="IELTS Logo" className="logo" />
          <h2 className="mt-2">{isAdmin ? 'Admin Portal' : 'Candidate Portal'}</h2>
          <p className="text-light">Prepare Smart. Score High.</p>
        </div>

        {error && <div className="error-message mb-3">{error}</div>}

        {!isAdmin ? (
          <form onSubmit={handleCandidateLogin} className="d-flex flex-column gap-3">
            <div>
              <label className="text-light mb-2 d-flex">Enter 14-Digit Candidate Code</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. 12345678901234"
                value={candidateCode}
                onChange={(e) => setCandidateCode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={14}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Access Dashboard</button>
            <p className="text-center mt-3" style={{ fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setIsAdmin(true)}>
              Admin Login
            </p>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="d-flex flex-column gap-3">
            <div>
              <label className="text-light mb-2 d-flex">Admin Access Code</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Enter admin code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <button type="submit" className="btn btn-secondary w-100">Enter Admin Panel</button>
            <p className="text-center mt-3" style={{ fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setIsAdmin(false)}>
              Candidate Login
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
