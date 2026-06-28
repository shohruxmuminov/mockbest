import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal.jsx';
import { connectSocket } from '../lib/socket.js';
import { useAuth } from '../lib/auth.jsx';

async function exitFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}

/**
 * Mounted for the whole candidate session. Keeps the realtime socket alive so
 * the admin always sees the candidate's presence, and delivers admin warnings
 * and bans instantly as centered modal dialogs — even during an active test in
 * full-screen mode.
 */
export default function CandidateRealtime() {
  const { session, logout } = useAuth();
  const [warning, setWarning] = useState(null);
  const [banned, setBanned] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const socket = connectSocket();
    const onWarning = ({ fullName }) => setWarning(fullName || session?.fullName || 'Candidate');
    const onBanned = () => {
      setWarning(null);
      setBanned(true);
      exitFullscreen();
    };
    socket.on('candidate:warning', onWarning);
    socket.on('candidate:banned', onBanned);
    return () => {
      socket.off('candidate:warning', onWarning);
      socket.off('candidate:banned', onBanned);
    };
  }, [session]);

  const acknowledgeBan = () => {
    logout();
    nav('/', { replace: true });
  };

  return (
    <>
      {warning && (
        <Modal variant="warn" closeable={false}>
          <h3 style={{ color: 'var(--red)' }}>⚠ Examination Warning</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            <strong>Dear {warning},</strong>
            <br />
            <br />
            Leaving Full Screen during the examination is strictly prohibited.
            <br />
            <br />
            Please continue your examination in Full Screen mode.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => setWarning(null)}>
            I Understand
          </button>
        </Modal>
      )}

      {banned && (
        <Modal variant="warn" closeable={false}>
          <h3 style={{ color: 'var(--red)' }}>Examination Terminated</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            Your examination session has been ended by the administrator. You can
            no longer continue this test.
          </p>
          <button className="btn btn-danger btn-block" onClick={acknowledgeBan}>
            Exit
          </button>
        </Modal>
      )}
    </>
  );
}
