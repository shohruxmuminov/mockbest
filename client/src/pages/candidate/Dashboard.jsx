import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch('/api/tests');
        const data = await res.json();
        setTests(data);
      } catch (err) {
        console.error('Failed to fetch tests', err);
      }
    };
    fetchTests();
  }, []);

  const handleStartTest = async (testId) => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: user.id, testId })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/test/${data.session.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start test.');
    }
  };

  return (
    <div className="container mt-4 mb-4">
      <div className="glass-panel mb-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <img src="/assets/ielts-logo-placeholder.png" alt="IELTS" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <div className="d-flex gap-3 align-items-center">
          <span className="font-weight-bold" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{user.fullName}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="text-center mt-5 mb-5">
        <h1 style={{ fontSize: '3rem', letterSpacing: '-1px', color: '#1a1a1a' }}>Prepare Smart.<br/>Score High.</h1>
        <p className="text-light mt-3" style={{ fontSize: '1.1rem' }}>Experience real IELTS practice with our high-quality mock tests and detailed feedback.</p>
      </div>

      <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <h4 className="mb-4">Available Mock Tests</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {tests.map(test => (
            <div key={test.id} className="p-4" style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1" style={{ color: '#1a1a1a' }}>{test.title}</h5>
                  <div className="text-light" style={{ fontSize: '0.9rem' }}>{test.name}</div>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E63946' }}></div>
              </div>
              <p className="text-light mb-4" style={{ fontSize: '0.85rem' }}>Full examination covering Listening, Reading, and Writing sections.</p>
              <button className="btn btn-primary w-100" onClick={() => handleStartTest(test.id)}>
                Start Mock Test →
              </button>
            </div>
          ))}
          {tests.length === 0 && (
            <div className="col-span-full text-center p-5 text-light">
              No mock tests available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
