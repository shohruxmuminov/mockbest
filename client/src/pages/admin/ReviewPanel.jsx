import React, { useState, useEffect } from 'react';

export default function ReviewPanel() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [search]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/sessions?search=${search}`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const parseAnswers = (answersString) => {
    if (!answersString) return [];
    try { return JSON.parse(answersString); } catch(e) { return []; }
  };

  return (
    <div className="d-flex gap-4">
      <div className="glass-panel" style={{ flex: 1, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        <h4 className="mb-4">Completed Sessions</h4>
        <div className="mb-4">
          <input 
            type="text" 
            className="input" 
            placeholder="Search by Code or Name" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="d-flex flex-column gap-2">
          {sessions.map(s => (
            <div 
              key={s.id} 
              className="p-3" 
              style={{ 
                background: selectedSession?.id === s.id ? 'rgba(230, 57, 70, 0.1)' : 'rgba(255,255,255,0.5)', 
                border: selectedSession?.id === s.id ? '1px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedSession(s)}
            >
              <div className="d-flex justify-content-between">
                <strong>{s.fullName}</strong>
                <span className={`badge ${s.status === 'completed' ? 'text-success' : 'text-warning'}`}>{s.status}</span>
              </div>
              <div className="text-light font-monospace mt-1">{s.code}</div>
              <div className="text-light mt-1" style={{ fontSize: '0.8rem' }}>{s.testName}</div>
            </div>
          ))}
          {sessions.length === 0 && <div className="text-center text-light mt-4">No sessions found.</div>}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 2, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {selectedSession ? (
          <div>
            <h3 className="mb-4">Review: {selectedSession.fullName}</h3>
            <p className="text-light mb-4">Code: {selectedSession.code} | Test: {selectedSession.testName}</p>
            
            <div className="row d-flex gap-4 mb-4">
              <div className="col" style={{ flex: 1 }}>
                <h5 className="mb-3">Listening Answers</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {parseAnswers(selectedSession.listeningAnswers).map((ans, i) => (
                    <div key={i} className="d-flex" style={{ background: '#fff', border: '1px solid #eee', borderRadius: '4px', padding: '4px 8px' }}>
                      <span style={{ width: '30px', fontWeight: 'bold', color: '#666' }}>{i+1}.</span>
                      <span style={{ flex: 1 }}>{ans || '-'}</span>
                    </div>
                  ))}
                  {parseAnswers(selectedSession.listeningAnswers).length === 0 && <p className="text-light">Not submitted</p>}
                </div>
              </div>

              <div className="col" style={{ flex: 1 }}>
                <h5 className="mb-3">Reading Answers</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {parseAnswers(selectedSession.readingAnswers).map((ans, i) => (
                    <div key={i} className="d-flex" style={{ background: '#fff', border: '1px solid #eee', borderRadius: '4px', padding: '4px 8px' }}>
                      <span style={{ width: '30px', fontWeight: 'bold', color: '#666' }}>{i+1}.</span>
                      <span style={{ flex: 1 }}>{ans || '-'}</span>
                    </div>
                  ))}
                  {parseAnswers(selectedSession.readingAnswers).length === 0 && <p className="text-light">Not submitted</p>}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '24px 0' }} />

            <div>
              <h5 className="mb-3">Writing Essay</h5>
              {selectedSession.writingPdfPath ? (
                <a href={`/uploads/${selectedSession.writingPdfPath}`} target="_blank" rel="noreferrer" className="btn btn-primary">
                  Download PDF Essay
                </a>
              ) : (
                <p className="text-light">Not submitted</p>
              )}
            </div>
            
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100 text-light">
            Select a session to review
          </div>
        )}
      </div>
    </div>
  );
}
