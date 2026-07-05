import React, { useState, useEffect } from 'react';

export default function AnswerSheet({ sectionName, onSubmit }) {
  const [answers, setAnswers] = useState(Array(40).fill(''));
  const [timeLeft, setTimeLeft] = useState(5 * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onSubmit(answers);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, answers, onSubmit]);

  const handleChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: 0 }}>{sectionName} Answer Sheet</h4>
        <div className="badge" style={{ background: timeLeft < 60 ? '#E63946' : '#1D3557', color: 'white', padding: '8px 16px', borderRadius: '50px', fontSize: '1rem', fontWeight: 'bold' }}>
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {answers.map((ans, i) => (
            <div key={i} className="d-flex align-items-center gap-2">
              <span style={{ width: '24px', fontWeight: 'bold', color: '#666', textAlign: 'right' }}>{i + 1}.</span>
              <input 
                type="text" 
                className="input" 
                style={{ padding: '6px 12px' }}
                value={ans}
                onChange={(e) => handleChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: '2px solid rgba(0,0,0,0.05)' }}>
        <button className="btn btn-primary w-100" onClick={() => onSubmit(answers)}>
          Submit Answers
        </button>
      </div>
    </div>
  );
}
