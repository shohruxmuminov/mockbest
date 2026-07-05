const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../db');

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// === ADMIN LOGIN (MOCK) ===
router.post('/admin/login', (req, res) => {
  const { email } = req.body;
  if (email === 'shohruxmuminov201@gmail.com') {
    res.json({ success: true, token: 'admin_token', role: 'admin' });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

// === CANDIDATE MANAGEMENT ===
const generate14DigitCode = () => {
  let code = '';
  for (let i = 0; i < 14; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

router.post('/candidates', (req, res) => {
  const { fullName } = req.body;
  if (!fullName) return res.status(400).json({ error: 'Full name required' });
  
  let code = generate14DigitCode();
  
  // Recursively check if code exists (simple approach)
  const insertCandidate = (currentCode) => {
    db.run('INSERT INTO candidates (fullName, code) VALUES (?, ?)', [fullName, currentCode], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          insertCandidate(generate14DigitCode());
        } else {
          res.status(500).json({ error: err.message });
        }
      } else {
        res.json({ id: this.lastID, fullName, code: currentCode });
      }
    });
  };
  
  insertCandidate(code);
});

router.get('/candidates', (req, res) => {
  const search = req.query.search || '';
  const query = search ? `SELECT * FROM candidates WHERE fullName LIKE ? OR code LIKE ? ORDER BY createdAt DESC` 
                       : `SELECT * FROM candidates ORDER BY createdAt DESC`;
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// === CANDIDATE LOGIN ===
router.post('/candidate/login', (req, res) => {
  const { code } = req.body;
  db.get('SELECT * FROM candidates WHERE code = ?', [code], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ success: false, message: 'Invalid Code' });
    res.json({ success: true, candidate: row });
  });
});

// === MOCK TESTS ===
router.post('/tests', upload.fields([
  { name: 'listeningHtml', maxCount: 1 },
  { name: 'listeningAudio', maxCount: 1 },
  { name: 'readingHtml', maxCount: 1 },
  { name: 'writingHtml', maxCount: 1 }
]), (req, res) => {
  const { title, name } = req.body;
  
  const listeningHtmlPath = req.files['listeningHtml'] ? req.files['listeningHtml'][0].filename : null;
  const listeningAudioPath = req.files['listeningAudio'] ? req.files['listeningAudio'][0].filename : null;
  const readingHtmlPath = req.files['readingHtml'] ? req.files['readingHtml'][0].filename : null;
  const writingHtmlPath = req.files['writingHtml'] ? req.files['writingHtml'][0].filename : null;
  
  db.get('SELECT MAX(testOrder) as maxOrder FROM tests', [], (err, row) => {
    const order = row && row.maxOrder !== null ? row.maxOrder + 1 : 1;
    
    db.run(`INSERT INTO tests (title, name, listeningHtmlPath, listeningAudioPath, readingHtmlPath, writingHtmlPath, testOrder) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [title, name, listeningHtmlPath, listeningAudioPath, readingHtmlPath, writingHtmlPath, order], 
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, testId: this.lastID });
    });
  });
});

router.get('/tests', (req, res) => {
  db.all('SELECT * FROM tests ORDER BY testOrder ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// === SESSION MANAGEMENT (Candidate Flow) ===
router.post('/sessions/start', (req, res) => {
  const { candidateId, testId } = req.body;
  // check if active session exists
  db.get('SELECT * FROM sessions WHERE candidateId = ? AND testId = ?', [candidateId, testId], (err, row) => {
    if (row) {
      // resume session
      return res.json({ success: true, session: row });
    }
    
    db.run(`INSERT INTO sessions (candidateId, testId, currentSection, status) VALUES (?, ?, 'listening', 'active')`, 
      [candidateId, testId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get('SELECT * FROM sessions WHERE id = ?', [this.lastID], (err, newRow) => {
           res.json({ success: true, session: newRow });
        });
    });
  });
});

router.post('/sessions/:id/update', (req, res) => {
  const { id } = req.params;
  const { currentSection, listeningAnswers, readingAnswers, status } = req.body;
  
  let updates = [];
  let params = [];
  if (currentSection) { updates.push('currentSection = ?'); params.push(currentSection); }
  if (listeningAnswers) { updates.push('listeningAnswers = ?'); params.push(listeningAnswers); }
  if (readingAnswers) { updates.push('readingAnswers = ?'); params.push(readingAnswers); }
  if (status) { updates.push('status = ?'); params.push(status); }
  
  if (status === 'completed') {
    updates.push('completedAt = CURRENT_TIMESTAMP');
  }
  
  if (updates.length === 0) return res.json({ success: true });
  
  params.push(id);
  db.run(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Writing PDF upload
router.post('/sessions/:id/writing', upload.single('writingPdf'), (req, res) => {
  const { id } = req.params;
  const writingPdfPath = req.file ? req.file.filename : null;
  
  if (!writingPdfPath) return res.status(400).json({ error: 'PDF file is required' });
  
  db.run(`UPDATE sessions SET writingPdfPath = ?, currentSection = 'completed', status = 'completed', completedAt = CURRENT_TIMESTAMP WHERE id = ?`, 
    [writingPdfPath, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

// Get all sessions (For Admin Review Panel)
router.get('/sessions', (req, res) => {
  const search = req.query.search || '';
  const query = `
    SELECT s.*, c.fullName, c.code, t.name as testName 
    FROM sessions s 
    JOIN candidates c ON s.candidateId = c.id 
    JOIN tests t ON s.testId = t.id
    ${search ? 'WHERE c.code LIKE ? OR c.fullName LIKE ?' : ''}
    ORDER BY s.startedAt DESC
  `;
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
