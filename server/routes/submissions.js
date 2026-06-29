import express from 'express';
import db from '../db.js';
import { requireCandidate } from '../auth.js';
import { upload } from '../upload.js';

const router = express.Router();

// Save a Listening or Reading answer sheet (40 answers).
router.post('/answer-sheet', requireCandidate, (req, res) => {
  const { mockTestId, section } = req.body || {};
  let { answers } = req.body || {};

  if (!['listening', 'reading'].includes(section)) {
    return res.status(400).json({ error: 'Invalid section.' });
  }
  const testId = Number(mockTestId);
  if (!testId || !db.prepare('SELECT 1 FROM mock_tests WHERE id = ?').get(testId)) {
    return res.status(400).json({ error: 'Invalid mock test.' });
  }
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers must be an array.' });
  }
  // Normalize to exactly 40 string entries.
  answers = Array.from({ length: 40 }, (_, i) => (answers[i] ?? '').toString());

  db.prepare(
    `INSERT INTO answer_sheets (candidate_id, mock_test_id, section, answers)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(candidate_id, mock_test_id, section)
     DO UPDATE SET answers = excluded.answers, submitted_at = datetime('now')`
  ).run(req.candidate.id, testId, section, JSON.stringify(answers));

  res.status(201).json({ ok: true });
});

// Upload the Writing essay as a PDF — large files allowed, never blocked.
router.post('/writing', requireCandidate, upload.single('pdf'), (req, res) => {
  const testId = Number(req.body?.mockTestId);
  if (!req.file) return res.status(400).json({ error: 'No PDF file received.' });
  if (!testId || !db.prepare('SELECT 1 FROM mock_tests WHERE id = ?').get(testId)) {
    return res.status(400).json({ error: 'Invalid mock test.' });
  }

  db.prepare(
    `INSERT INTO writing_uploads (candidate_id, mock_test_id, file_path, original_name)
     VALUES (?, ?, ?, ?)`
  ).run(req.candidate.id, testId, req.file.filename, req.file.originalname || 'essay.pdf');

  res.status(201).json({ ok: true, file: `/api/files/${req.file.filename}` });
});

export default router;
