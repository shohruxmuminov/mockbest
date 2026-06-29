import fs from 'fs';
import path from 'path';
import express from 'express';
import db from '../db.js';
import config from '../config.js';
import { requireAdmin } from '../auth.js';
import { upload } from '../upload.js';

const router = express.Router();
router.use(requireAdmin);

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
    },
    reading: { html: t.reading_html ? `/api/files/${t.reading_html}` : null },
    writing: { html: t.writing_html ? `/api/files/${t.writing_html}` : null },
  };
}

const uploadFields = upload.fields([
  { name: 'listeningHtml', maxCount: 1 },
  { name: 'listeningAudio', maxCount: 1 },
  { name: 'readingHtml', maxCount: 1 },
  { name: 'writingHtml', maxCount: 1 },
]);

// Create a mock test. Listening audio is OPTIONAL; HTML files are required per
// section that is provided. At minimum a listening or reading or writing HTML
// must be present.
router.post('/', uploadFields, (req, res) => {
  try {
    const files = req.files || {};
    const title = (req.body?.title || '').toString().trim();
    const testName = (req.body?.testName || '').toString().trim();
    if (!title || !testName) {
      return res.status(400).json({ error: 'Title and Test Name are required.' });
    }

    const listeningHtml = files.listeningHtml?.[0]?.filename || null;
    const listeningAudio = files.listeningAudio?.[0]?.filename || null; // optional
    const readingHtml = files.readingHtml?.[0]?.filename || null;
    const writingHtml = files.writingHtml?.[0]?.filename || null;

    if (!listeningHtml && !readingHtml && !writingHtml) {
      return res
        .status(400)
        .json({ error: 'Upload at least one section HTML file (Listening, Reading or Writing).' });
    }

    const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM mock_tests').get().m;

    const info = db
      .prepare(
        `INSERT INTO mock_tests
          (title, test_name, listening_html, listening_audio, reading_html, writing_html, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, testName, listeningHtml, listeningAudio, readingHtml, writingHtml, maxOrder + 1);

    const test = db.prepare('SELECT * FROM mock_tests WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(serialize(test));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM mock_tests ORDER BY order_index ASC, id ASC')
    .all();
  res.json(rows.map(serialize));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const test = db.prepare('SELECT * FROM mock_tests WHERE id = ?').get(id);
  if (!test) return res.status(404).json({ error: 'Mock test not found.' });

  // Remove uploaded files from disk.
  for (const f of [test.listening_html, test.listening_audio, test.reading_html, test.writing_html]) {
    if (f) {
      const p = path.join(config.uploadDir, f);
      fs.promises.unlink(p).catch(() => {});
    }
  }
  db.prepare('DELETE FROM mock_tests WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
