const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Candidates table
      db.run(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tests table
      db.run(`CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        name TEXT NOT NULL,
        listeningHtmlPath TEXT,
        listeningAudioPath TEXT,
        readingHtmlPath TEXT,
        writingHtmlPath TEXT,
        testOrder INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Sessions table
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidateId INTEGER NOT NULL,
        testId INTEGER NOT NULL,
        currentSection TEXT DEFAULT 'listening', -- listening, reading, writing, completed
        status TEXT DEFAULT 'active', -- active, banned, completed
        listeningAnswers TEXT, -- JSON array
        readingAnswers TEXT, -- JSON array
        writingPdfPath TEXT,
        startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completedAt DATETIME,
        FOREIGN KEY (candidateId) REFERENCES candidates(id),
        FOREIGN KEY (testId) REFERENCES tests(id)
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

module.exports = {
  db,
  initDb
};
