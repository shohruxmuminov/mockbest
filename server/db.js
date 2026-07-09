import { Pool } from 'pg';
import config from './config.js';

// Create connection pool only if database URL is configured
let pool = null;

function getPool() {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not configured');
    }
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Execute a single query
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const p = getPool();
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { duration, rows: result.rowCount });
    return result;
  } catch (err) {
    console.error('Database query error:', err.message);
    throw err;
  }
}

/**
 * Execute a single row query
 */
export async function one(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

/**
 * Execute and get all rows
 */
export async function many(text, params) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * Initialize database schema
 */
export async function initDb() {
  try {
    console.log('Initializing database schema...');

    // Candidates table
    await query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        code VARCHAR(255) UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tests table
    await query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        listeningHtmlPath VARCHAR(255),
        listeningAudioPath VARCHAR(255),
        readingHtmlPath VARCHAR(255),
        writingHtmlPath VARCHAR(255),
        testOrder INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        candidateId INTEGER NOT NULL,
        testId INTEGER NOT NULL,
        currentSection VARCHAR(50) DEFAULT 'listening',
        status VARCHAR(50) DEFAULT 'active',
        listeningAnswers TEXT,
        readingAnswers TEXT,
        writingPdfPath VARCHAR(255),
        startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completedAt TIMESTAMP,
        FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Submissions table
    await query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        candidateId INTEGER NOT NULL,
        testId INTEGER NOT NULL,
        listeningScore DECIMAL(5, 2),
        readingScore DECIMAL(5, 2),
        writingScore DECIMAL(5, 2),
        totalScore DECIMAL(5, 2),
        submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for faster queries
    await query(`CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_sessions_candidateId ON sessions(candidateId)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_sessions_testId ON sessions(testId)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_submissions_candidateId ON submissions(candidateId)`);

    console.log('✓ Database schema initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    throw err;
  }
}

/**
 * Health check - verify database connection
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW()');
    return result.rows[0];
  } catch (err) {
    console.error('Database health check failed:', err.message);
    throw err;
  }
}

/**
 * Close the pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

export default {
  query,
  one,
  many,
  initDb,
  healthCheck,
  closePool,
};
