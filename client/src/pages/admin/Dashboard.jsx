import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CandidateManagement from './CandidateManagement';
import TestManagement from './TestManagement';
import ReviewPanel from './ReviewPanel';
import io from 'socket.io-client';

let socket;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socket = io();
    socket.emit('register_admin');

    socket.on('alert_fullscreen_exit', (data) => {
      setAlerts((prev) => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleWarning = (code, name) => {
    socket.emit('send_warning', { candidateCode: code, candidateName: name });
    alert(`Warning sent to ${name}`);
  };

  const handleBan = (code, name) => {
    socket.emit('ban_candidate', { candidateCode: code });
    alert(`${name} has been banned.`);
  };

  const isActive = (path) => location.pathname === path ? 'btn-primary' : 'btn-secondary';

  return (
    <div className="container mt-4 mb-4">
      <div className="glass-panel mb-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <img src="/assets/ielts-logo-placeholder.png" alt="IELTS" style={{ height: '40px', objectFit: 'contain' }} />
          <h3 style={{ margin: 0 }}>Admin Panel</h3>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <span className="text-light">{user.email}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="d-flex gap-3 mb-4">
        <Link to="/admin" className={`btn ${isActive('/admin')}`}>Candidates</Link>
        <Link to="/admin/tests" className={`btn ${isActive('/admin/tests')}`}>Tests</Link>
        <Link to="/admin/reviews" className={`btn ${isActive('/admin/reviews')}`}>Reviews</Link>
      </div>

      {alerts.length > 0 && (
        <div className="glass-panel mb-4" style={{ borderLeft: '4px solid #E63946' }}>
          <h4>Live Alerts</h4>
          <div className="d-flex flex-column gap-2 mt-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="d-flex justify-content-between align-items-center p-3" style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                <div>
                  <strong>{alert.candidateName}</strong> ({alert.candidateCode}) exited Full Screen during <strong>{alert.currentSection}</strong>.
                  <br />
                  <small className="text-light">{new Date(alert.timestamp).toLocaleTimeString()}</small>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-secondary" onClick={() => handleWarning(alert.candidateCode, alert.candidateName)}>Warn</button>
                  <button className="btn btn-primary" onClick={() => handleBan(alert.candidateCode, alert.candidateName)}>Ban</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<CandidateManagement />} />
        <Route path="/tests" element={<TestManagement />} />
        <Route path="/reviews" element={<ReviewPanel />} />
      </Routes>
    </div>
  );
}
