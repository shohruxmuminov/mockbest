import express from 'express';
import db from '../db.js';
import { requireAdmin, generateCandidateCode } from '../auth.js';

const router = express.Router();
router.use(requireAdmin);

function serialize(c) {
  return {
    id: c.id,
    fullName: c.full_name,
    code: c.code,
    banned: Boolean(c.banned),
    createdAt: c.created_at,
  };
}

// Create a candidate with an auto-generated unique 14-digit code.
router.post('/', (req, res) => {
  const fullName = (req.body?.fullName || '').toString().trim();
  if (!fullName) {
    return res.status(400).json({ error: 'Candidate full name is required.' });
  }
  const code = generateCandidateCode();
  const info = db
    .prepare('INSERT INTO candidates (full_name, code) VALUES (?, ?)')
    .run(fullName, code);
  const candidate = db
    .prepare('SELECT * FROM candidates WHERE id = ?')
    .get(info.lastInsertRowid);
  res.status(201).json(serialize(candidate));
});

// List / search candidates by name or 14-digit code.
router.get('/', (req, res) => {
  const search = (req.query.search || '').toString().trim();
  let rows;
  if (search) {
    const like = `%${search}%`;
    rows = db
      .prepare(
        `SELECT * FROM candidates
         WHERE full_name LIKE ? OR code LIKE ?
         ORDER BY created_at DESC, id DESC`
      )
      .all(like, like);
  } else {
    rows = db
      .prepare('SELECT * FROM candidates ORDER BY created_at DESC, id DESC')
      .all();
  }
  res.json(rows.map(serialize));
});

router.post('/:id/ban', (req, res) => {
  const id = Number(req.params.id);
  const banned = req.body?.banned === false ? 0 : 1;
  const result = db.prepare('UPDATE candidates SET banned = ? WHERE id = ?').run(banned, id);
  if (!result.changes) return res.status(404).json({ error: 'Candidate not found.' });
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  res.json(serialize(candidate));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Candidate not found.' });
  res.json({ ok: true });
});

export default router;
