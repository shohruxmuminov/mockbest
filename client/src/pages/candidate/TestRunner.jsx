import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HtmlRenderer from '../../components/HtmlRenderer';
import AnswerSheet from '../../components/AnswerSheet';
import io from 'socket.io-client';

export default function TestRunner() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [test, setTest] = useState(null);
  const [currentStep, setCurrentStep] = useState('lobby'); // lobby, listening, listening_answers, reading, reading_answers, writing, completed
  const [warning, setWarning] = useState(null);
  const [banned, setBanned] = useState(false);
  const socketRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const fetchSessionAndTest = async () => {
      try {
        const res = await fetch(`/api/sessions?search=${user.code}`);
        const sessions = await res.json();
        const activeSession = sessions.find(s => s.id === parseInt(sessionId));
        if (!activeSession) return navigate('/candidate');

        setSession(activeSession);

        if (activeSession.status === 'banned') return setBanned(true);
        if (activeSession.status === 'completed') return setCurrentStep('completed');

        const testRes = await fetch('/api/tests');
        const tests = await testRes.json();
        const activeTest = tests.find(t => t.id === activeSession.testId);
        setTest(activeTest);

        if (activeSession.currentSection === 'listening') setCurrentStep('listening');
        else if (activeSession.currentSection === 'reading') setCurrentStep('reading');
        else if (activeSession.currentSection === 'writing') setCurrentStep('writing');
        else setCurrentStep(activeSession.currentSection);

      } catch (err) {
        console.error(err);
      }
    };
    fetchSessionAndTest();

    socketRef.current = io();
    socketRef.current.emit('register_candidate', user.code);

    socketRef.current.on('receive_warning', (data) => {
      setWarning(data.message);
    });

    socketRef.current.on('receive_ban', () => {
      setBanned(true);
      updateSession('banned', 'banned');
    });

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && currentStep !== 'lobby' && currentStep !== 'completed') {
        socketRef.current.emit('fullscreen_exit', {
          candidateName: user.fullName,
          candidateCode: user.code,
          currentSection: currentStep
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      socketRef.current.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [sessionId, user, navigate, currentStep]);

  const updateSession = async (section, status = 'active', payload = {}) => {
    await fetch(`/api/sessions/${sessionId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSection: section, status, ...payload })
    });
  };

  const enterFullscreen = async () => {
    if (containerRef.current) {
      await containerRef.current.requestFullscreen().catch(err => {
        alert('Error attempting to enable full-screen mode: ' + err.message);
      });
    }
  };

  const handleStartTest = async () => {
    await enterFullscreen();
    setCurrentStep('listening');
    updateSession('listening');
  };

  const handleListeningSubmit = () => {
    setCurrentStep('listening_answers');
  };

  const handleListeningAnswersSubmit = async (answers) => {
    await updateSession('reading', 'active', { listeningAnswers: JSON.stringify(answers) });
    setCurrentStep('reading');
  };

  const handleReadingSubmit = () => {
    setCurrentStep('reading_answers');
  };

  const handleReadingAnswersSubmit = async (answers) => {
    await updateSession('writing', 'active', { readingAnswers: JSON.stringify(answers) });
    setCurrentStep('writing');
  };

  const handleWritingUpload = async (e) => {
    e.preventDefault();
    const file = e.target.writingPdf.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('writingPdf', file);

    const res = await fetch(`/api/sessions/${sessionId}/writing`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      setCurrentStep('completed');
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  if (banned) {
    return (
      <div className="container mt-5 text-center">
        <div className="glass-panel" style={{ border: '2px solid #E63946' }}>
          <h2 style={{ color: '#E63946' }}>Session Terminated</h2>
          <p>You have been removed from the test by the administrator.</p>
          <button className="btn btn-secondary mt-3" onClick={() => navigate('/candidate')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (currentStep === 'completed') {
    return (
      <div className="container mt-5 text-center">
        <div className="glass-panel">
          <img src="/assets/ielts-logo-placeholder.png" alt="IELTS" style={{ height: '60px', marginBottom: '24px' }} />
          <h2 style={{ color: '#1D3557' }}>Thank You</h2>
          <p className="text-light mt-3" style={{ fontSize: '1.1rem' }}>
            Dear {user.fullName},<br/>
            You have successfully completed the IELTS Mock Test.
          </p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/candidate')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ background: '#f8f9fa', minHeight: '100vh', width: '100vw' }}>
      
      {/* Warning Modal */}
      {warning && (
        <div className="fullscreen-warning">
          <div className="glass-panel" style={{ background: 'white', maxWidth: '500px', textAlign: 'center' }}>
            <h3 style={{ color: '#E63946' }}>Warning</h3>
            <p style={{ whiteSpace: 'pre-line' }} className="mt-3">{warning}</p>
            <button className="btn btn-primary mt-4 w-100" onClick={() => setWarning(null)}>I Understand</button>
          </div>
        </div>
      )}

      {currentStep === 'lobby' && test && (
        <div className="container d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
          <div className="glass-panel text-center" style={{ maxWidth: '600px' }}>
            <h2 className="mb-3">{test.title}</h2>
            <h4 className="text-light mb-4">{test.name}</h4>
            <p className="mb-4">
              <strong>Instructions:</strong><br/>
              The test will be conducted in Full Screen mode. Exiting Full Screen is strictly prohibited and will alert the invigilator.
            </p>
            <button className="btn btn-primary w-100 p-3" style={{ fontSize: '1.2rem' }} onClick={handleStartTest}>
              Start Test
            </button>
          </div>
        </div>
      )}

      {currentStep === 'listening' && test && (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
          <div className="p-3 bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eee' }}>
            <h4 style={{ margin: 0 }}>Listening Section</h4>
            <button className="btn btn-primary" onClick={handleListeningSubmit}>Finish Listening</button>
          </div>
          {test.listeningAudioPath && (
            <div className="bg-dark p-3 text-center" style={{ background: '#1a1a1a' }}>
              <audio controls autoPlay src={`/uploads/${test.listeningAudioPath}`} style={{ width: '50%' }} />
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HtmlRenderer filePath={test.listeningHtmlPath} />
          </div>
        </div>
      )}

      {currentStep === 'listening_answers' && test && (
        <div className="d-flex" style={{ height: '100vh' }}>
          <div style={{ flex: 2, overflow: 'hidden' }}>
            <HtmlRenderer filePath={test.listeningHtmlPath} />
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #eee', background: '#f8f9fa' }}>
            <AnswerSheet sectionName="Listening" onSubmit={handleListeningAnswersSubmit} />
          </div>
        </div>
      )}

      {currentStep === 'reading' && test && (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
          <div className="p-3 bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eee' }}>
            <h4 style={{ margin: 0 }}>Reading Section</h4>
            <button className="btn btn-primary" onClick={handleReadingSubmit}>Finish Reading</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HtmlRenderer filePath={test.readingHtmlPath} />
          </div>
        </div>
      )}

      {currentStep === 'reading_answers' && test && (
        <div className="d-flex" style={{ height: '100vh' }}>
          <div style={{ flex: 2, overflow: 'hidden' }}>
            <HtmlRenderer filePath={test.readingHtmlPath} />
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #eee', background: '#f8f9fa' }}>
            <AnswerSheet sectionName="Reading" onSubmit={handleReadingAnswersSubmit} />
          </div>
        </div>
      )}

      {currentStep === 'writing' && test && (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
          <div className="p-3 bg-white d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #eee' }}>
            <h4 style={{ margin: 0 }}>Writing Section</h4>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <div style={{ flex: 2 }}>
              <HtmlRenderer filePath={test.writingHtmlPath} />
            </div>
            <div style={{ flex: 1, background: 'white', borderLeft: '1px solid #eee', padding: '24px' }}>
              <h4 className="mb-4">Send Essay to Admin</h4>
              <p className="text-light mb-4">Please upload your completed essay as a PDF file.</p>
              <form onSubmit={handleWritingUpload}>
                <input required type="file" name="writingPdf" accept="application/pdf" className="input mb-4" />
                <button type="submit" className="btn btn-primary w-100">Submit Exam</button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
