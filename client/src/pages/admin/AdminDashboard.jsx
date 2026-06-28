import { useEffect, useState } from 'react';
import { connectSocket } from '../../lib/socket.js';
import MockTestsTab from './MockTestsTab.jsx';
import CandidatesTab from './CandidatesTab.jsx';
import MonitoringTab from './MonitoringTab.jsx';
import ReviewTab from './ReviewTab.jsx';

const TABS = [
  ['monitor', '📡 Monitoring'],
  ['tests', '🎧 Mock Tests'],
  ['candidates', '👥 Candidates'],
  ['review', '🔍 Review'],
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('monitor');

  // Admin realtime monitoring state lives here so alerts keep arriving while
  // the admin browses other tabs.
  const [online, setOnline] = useState([]); // [{candidateId, fullName, code, section}]
  const [alerts, setAlerts] = useState([]); // fullscreen-exit alerts feed

  useEffect(() => {
    const socket = connectSocket();

    const upsert = (entry) =>
      setOnline((prev) => {
        const rest = prev.filter((p) => p.candidateId !== entry.candidateId);
        return [...rest, entry];
      });

    socket.on('monitor:presence', (list) => setOnline(list));
    socket.on('monitor:join', upsert);
    socket.on('monitor:update', ({ candidateId, section }) =>
      setOnline((prev) => prev.map((p) => (p.candidateId === candidateId ? { ...p, section } : p)))
    );
    socket.on('monitor:left', ({ candidateId }) =>
      setOnline((prev) => prev.filter((p) => p.candidateId !== candidateId))
    );
    socket.on('monitor:alert', (a) =>
      setAlerts((prev) => [{ ...a, id: `${a.candidateId}-${a.timestamp}` }, ...prev].slice(0, 50))
    );

    return () => {
      socket.off('monitor:presence');
      socket.off('monitor:join');
      socket.off('monitor:update');
      socket.off('monitor:left');
      socket.off('monitor:alert');
    };
  }, []);

  const sendWarning = (candidateId) => {
    connectSocket().emit('admin:warning', { candidateId });
  };
  const banCandidate = (candidateId) => {
    connectSocket().emit('admin:ban', { candidateId });
    setOnline((prev) => prev.filter((p) => p.candidateId !== candidateId));
  };

  return (
    <div className="page container" style={{ paddingBottom: 60 }}>
      <div className="section-head">
        <div>
          <h2>Admin Panel</h2>
          <p className="muted">Manage mock tests, candidates and monitor live examinations.</p>
        </div>
        {alerts.length > 0 && (
          <span className="chip on"><span className="live-dot" />{alerts.length} live alert(s)</span>
        )}
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
            {key === 'monitor' && online.length > 0 ? ` (${online.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'monitor' && (
        <MonitoringTab
          online={online}
          alerts={alerts}
          onWarn={sendWarning}
          onBan={banCandidate}
          onClearAlerts={() => setAlerts([])}
        />
      )}
      {tab === 'tests' && <MockTestsTab />}
      {tab === 'candidates' && <CandidatesTab />}
      {tab === 'review' && <ReviewTab />}
    </div>
  );
}
