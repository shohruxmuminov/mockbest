import express from 'express';
import db from '../db.js';
import { requireCandidate } from '../auth.js';

const router = express.Router();
router.use(requireCandidate);

function serialize(t) {
  return {
    id: t.id,
    title: t.title,
    testName: t.test_name,
    orderIndex: t.order_index,
    createdAt: t.created_at,
    listening: {
      html: t.listening_html ? `/api/files/${t.listening_html}` : null,
      audio: t.listening_audio ? `/api/files/${t.listening_audio}` : null,
      hasAudio: Boolean(t.listening_audio),
    },
    reading: { html: t.reading_html ? `/api/files/${t.reading_html}` : null },
    writing: { html: t.writing_html ? `/api/files/${t.writing_html}` : null },
  };
}

// Ordered list of mock tests for the candidate dashboard.
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM mock_tests ORDER BY order_index ASC, id ASC')
    .all();
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const test = db.prepare('SELECT * FROM mock_tests WHERE id = ?').get(Number(req.params.id));
  if (!test) return res.status(404).json({ error: 'Mock test not found.' });
  res.json(serialize(test));
});

export default router;
