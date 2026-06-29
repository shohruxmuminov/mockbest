import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import config from './config.js';

// Ensure storage directories exist so data persists across restarts.
fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.uploadDir, { recursive: true });

const dbPath = path.join(config.dataDir, 'ielts.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name    TEXT NOT NULL,
    code         TEXT NOT NULL UNIQUE,
    banned       INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mock_tests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    test_name       TEXT NOT NULL,
    listening_html  TEXT,
    listening_audio TEXT,
    reading_html    TEXT,
    writing_html    TEXT,
    order_index     INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS answer_sheets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id  INTEGER NOT NULL,
    mock_test_id  INTEGER NOT NULL,
    section       TEXT NOT NULL,            -- 'listening' | 'reading'
    answers       TEXT NOT NULL,            -- JSON array of 40 strings
    submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(candidate_id, mock_test_id, section),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS writing_uploads (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id  INTEGER NOT NULL,
    mock_test_id  INTEGER NOT NULL,
    file_path     TEXT NOT NULL,
    original_name TEXT,
    submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS monitoring_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id  INTEGER NOT NULL,
    type          TEXT NOT NULL,            -- 'fullscreen_exit' | 'warning' | 'ban'
    section       TEXT,
    detail        TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(code);
  CREATE INDEX IF NOT EXISTS idx_mock_tests_order ON mock_tests(order_index, id);
`);

export default db;
