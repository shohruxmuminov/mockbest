import express from 'express';
import db from '../db.js';
import config from '../config.js';
import { signToken, verifyGoogleAdmin } from '../auth.js';

const router = express.Router();

// Tells the client which admin login methods are available in this deployment.
router.get('/config', (req, res) => {
  res.json({
    googleClientId: config.googleClientId || null,
    googleEnabled: Boolean(config.googleClientId),
    passwordEnabled: Boolean(config.adminPassword),
    adminEmail: config.adminEmail,
  });
});

// Admin login via Google Sign-In (restricted to the authorized account).
router.post('/admin/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential.' });
  }
  try {
    const admin = await verifyGoogleAdmin(credential);
    const token = signToken({ role: 'admin', email: admin.email });
    res.json({ token, admin });
  } catch (err) {
    const status = err.code === 'FORBIDDEN' ? 403 : 401;
    res.status(status).json({ error: err.message });
  }
});

// Optional admin login via password — fallback when Google OAuth is not set up.
router.post('/admin/password', (req, res) => {
  const { password } = req.body || {};
  if (!config.adminPassword) {
    return res.status(404).json({ error: 'Password login is disabled.' });
  }
  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
  const token = signToken({ role: 'admin', email: config.adminEmail });
  res.json({ token, admin: { email: config.adminEmail, name: 'Administrator' } });
});

// Candidate login via 14-digit code — no auth screen, just the code.
router.post('/candidate', (req, res) => {
  const raw = (req.body?.code || '').toString().replace(/\D/g, '');
  if (raw.length !== 14) {
    return res
      .status(400)
      .json({ error: 'Candidate code must be exactly 14 digits.' });
  }
  const candidate = db
    .prepare('SELECT id, full_name, code, banned FROM candidates WHERE code = ?')
    .get(raw);
  if (!candidate) {
    return res.status(404).json({ error: 'Invalid candidate code. Please check and try again.' });
  }
  if (candidate.banned) {
    return res.status(403).json({ error: 'This candidate has been banned from the examination.' });
  }
  const token = signToken({ role: 'candidate', id: candidate.id, code: candidate.code });
  res.json({
    token,
    candidate: {
      id: candidate.id,
      fullName: candidate.full_name,
      code: candidate.code,
    },
  });
});

export default router;
