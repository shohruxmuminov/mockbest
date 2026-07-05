import React, { useState, useEffect } from 'react';

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [fullName, setFullName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, [search]);

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`/api/candidates?search=${search}`);
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!fullName) return;

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
      if (res.ok) {
        setFullName('');
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel">
      <h4 className="mb-4">Candidate Management</h4>
      
      <form onSubmit={handleGenerate} className="d-flex gap-3 mb-4 align-items-center">
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Enter Candidate Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Generate Candidate</button>
      </form>

      <div className="mb-4">
        <input 
          type="text" 
          className="input" 
          placeholder="Search by Name or 14-digit Code" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="w-100 text-left" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <th className="p-3">Full Name</th>
              <th className="p-3">Candidate Code</th>
              <th className="p-3">Generated At</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td className="p-3">{c.fullName}</td>
                <td className="p-3 font-monospace" style={{ letterSpacing: '2px', fontWeight: 600 }}>{c.code}</td>
                <td className="p-3 text-light">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-4 text-light">No candidates found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
