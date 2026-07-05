import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCandidateLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 14) {
      setError('Candidate code must be exactly 14 digits.');
      return;
    }

    try {
      const res = await fetch('/api/candidate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      
      if (data.success) {
        login({ ...data.candidate, role: 'candidate' });
        navigate('/candidate');
      } else {
        setError(data.message || 'Invalid Candidate Code');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        login({ email, role: 'admin' });
        navigate('/admin');
      } else {
        setError('Unauthorized Admin Account');
      }
    } catch (err) {
      setError('Connection failed.');
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
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
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
              <label className="text-light mb-2 d-flex">Admin Google Email</label>
              <input 
                type="email" 
                className="input" 
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary w-100">Sign in with Google</button>
            <p className="text-center mt-3" style={{ fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setIsAdmin(false)}>
              Candidate Login
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
