import express from 'express';
import { one } from '../db.js';
import config from '../config.js';
import { signToken } from '../auth.js';

const router = express.Router();

router.get('/config', (req, res) => {
  res.json({
    codeEnabled: Boolean(config.adminCode),
    adminEmail: config.adminEmail,
  });
});

// Admin login via a simple access code (default 2010).
router.post('/admin/code', (req, res) => {
  const code = (req.body?.code ?? '').toString().trim();
  if (!config.adminCode) return res.status(404).json({ error: 'Code login is disabled.' });
  if (!code || code !== config.adminCode) {
    return res.status(401).json({ error: 'Incorrect admin code.' });
  }
  const token = signToken({ role: 'admin', email: config.adminEmail });
  res.json({ token, admin: { email: config.adminEmail, name: 'Administrator' } });
});

router.post('/candidate', async (req, res, next) => {
  try {
    const raw = (req.body?.code || '').toString().replace(/\D/g, '');
    if (raw.length !== 14) {
      return res.status(400).json({ error: 'Candidate code must be exactly 14 digits.' });
    }
    
    try {
      const candidate = await one(
        'SELECT id, full_name, code, banned FROM candidates WHERE code = $1',
        [raw]
      );
      if (!candidate) {
        return res.status(404).json({ error: 'Invalid candidate code. Please check and try again.' });
      }
      if (candidate.banned) {
        return res.status(403).json({ error: 'This candidate has been banned from the examination.' });
      }
      const token = signToken({ role: 'candidate', id: candidate.id, code: candidate.code });
      res.json({
        token,
        candidate: { id: candidate.id, fullName: candidate.full_name, code: candidate.code },
      });
    } catch (dbErr) {
      console.error('Database error in candidate login:', dbErr.message);
      return res.status(503).json({ error: 'Database service unavailable. Please try again later.' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
