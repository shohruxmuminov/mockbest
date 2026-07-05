import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
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

  const openLogin = (adminMode = false) => {
    setIsAdmin(adminMode);
    setError('');
    setCode('');
    setEmail('');
    setShowLoginModal(true);
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar d-flex align-items-center justify-content-between">
        <div className="nav-logo d-flex align-items-center gap-2">
          {/* Extracting only the logo from the ielts logo.png */}
          <div className="logo-crop-container">
            <img src="/logo/ielts logo.png" alt="IELTS" className="ielts-nav-logo" />
          </div>
          <span className="logo-text">Mock Test</span>
        </div>
        <div className="nav-links d-flex gap-4">
          <a href="#home" className="active">Home</a>
          <a href="#tests">Mock Tests</a>
          <a href="#practice">Practice</a>
          <a href="#results">Results</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions d-flex align-items-center gap-3">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </button>
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </button>
          <button className="btn btn-secondary btn-admin" onClick={() => openLogin(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Admin
          </button>
          <button className="btn btn-primary btn-signin" onClick={() => openLogin(false)}>Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section d-flex align-items-center justify-content-between">
        {/* Background IELTS text */}
        <div className="bg-ielts-text">IELTS</div>

        <div className="hero-left d-flex flex-column gap-3">
          <div className="badge-platform">
            <span className="dot"></span>
            The Best IELTS Mock Test Platform
          </div>
          <h1 className="hero-title">Prepare Smart.<br/>Score High.</h1>
          <p className="hero-subtitle">
            Experience real IELTS practice with our high-quality mock tests and detailed feedback.
          </p>
          <div className="hero-buttons d-flex gap-3">
            <button className="btn btn-primary btn-large" onClick={() => openLogin(false)}>
              Start Mock Test &rarr;
            </button>
            <button className="btn btn-secondary btn-large d-flex align-items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Explore Tests
            </button>
          </div>
          <div className="hero-stats d-flex gap-4 mt-4">
            <div className="stat-item">
              <h3>15K+</h3>
              <p>Tests Taken</p>
            </div>
            <div className="stat-item">
              <h3>4.9/5</h3>
              <p>Average Score</p>
            </div>
            <div className="stat-item">
              <h3>98%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>

        <div className="hero-right d-flex flex-column gap-3">
          {/* Card 1 */}
          <div className="glass-panel profile-card d-flex align-items-center gap-3">
            <div className="avatar-container">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Shohrukh" alt="Shohrukh" className="avatar" />
            </div>
            <div>
              <h4>Muminov Shohrukh</h4>
              <p className="profile-role">WEBSITE DEVELOPER</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel profile-card d-flex align-items-center gap-3">
            <div className="avatar-container">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Otabek" alt="Otabek" className="avatar" />
            </div>
            <div>
              <h4>Barkayev Otabek</h4>
              <p className="profile-role">IELTS TEACHER</p>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay d-flex align-items-center justify-content-center" onClick={() => setShowLoginModal(false)}>
          <div className="glass-panel login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowLoginModal(false)}>&times;</button>
            <div className="text-center mb-4">
              <div className="logo-crop-container centered">
                <img src="/logo/ielts logo.png" alt="IELTS Logo" className="ielts-nav-logo" />
              </div>
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
                    placeholder="shohruxmuminov201@gmail.com"
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
      )}
    </div>
  );
}
