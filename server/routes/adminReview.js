import express from 'express';
import db from '../db.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();
router.use(requireAdmin);

// Full review for one candidate, searchable by their 14-digit code.
router.get('/:code', (req, res) => {
  const code = (req.params.code || '').replace(/\D/g, '');
  const candidate = db.prepare('SELECT * FROM candidates WHERE code = ?').get(code);
  if (!candidate) return res.status(404).json({ error: 'No candidate found for that code.' });

  const sheets = db
    .prepare('SELECT * FROM answer_sheets WHERE candidate_id = ? ORDER BY submitted_at')
    .all(candidate.id)
    .map((s) => ({
      id: s.id,
      mockTestId: s.mock_test_id,
      section: s.section,
      answers: JSON.parse(s.answers),
      submittedAt: s.submitted_at,
      testName: db.prepare('SELECT test_name FROM mock_tests WHERE id = ?').get(s.mock_test_id)?.test_name || '—',
    }));

  const writing = db
    .prepare('SELECT * FROM writing_uploads WHERE candidate_id = ? ORDER BY submitted_at DESC')
    .all(candidate.id)
    .map((w) => ({
      id: w.id,
      mockTestId: w.mock_test_id,
      file: `/api/files/${w.file_path}`,
      originalName: w.original_name,
      submittedAt: w.submitted_at,
      testName: db.prepare('SELECT test_name FROM mock_tests WHERE id = ?').get(w.mock_test_id)?.test_name || '—',
    }));

  const events = db
    .prepare('SELECT * FROM monitoring_events WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(candidate.id);

  res.json({
    candidate: {
      id: candidate.id,
      fullName: candidate.full_name,
      code: candidate.code,
      banned: Boolean(candidate.banned),
      createdAt: candidate.created_at,
    },
    answerSheets: {
      listening: sheets.filter((s) => s.section === 'listening'),
      reading: sheets.filter((s) => s.section === 'reading'),
    },
    writing,
    events,
  });
});

export default router;
