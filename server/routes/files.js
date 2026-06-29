import fs from 'fs';
import path from 'path';
import express from 'express';
import config from '../config.js';

const router = express.Router();

// Serve uploaded files (HTML, audio, PDF). HTML is loaded inside a sandboxed
// iframe on the client so it renders exactly like a browser would — never as
// source code.
router.get('/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent traversal
  const filePath = path.join(config.uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found.' });
  }
  // Allow the file to be embedded by our own client iframe.
  res.removeHeader('X-Frame-Options');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath);
});

export default router;
