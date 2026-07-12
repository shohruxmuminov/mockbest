import { Pool } from 'pg';
import config from './config.js';

// Create connection pool only if database URL is configured
let pool = null;

function getPool() {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not configured');
    }

    // Supabase pooler always requires SSL.  For other providers fall back to
    // the NODE_ENV check so local Postgres still works without certs.
    const isSupabase = config.databaseUrl.includes('supabase.com');
    const ssl = isSupabase
      ? { rejectUnauthorized: false }
      : config.nodeEnv === 'production'
        ? { rejectUnauthorized: false }
        : false;

    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Execute a single query.  Returns the full pg Result (rows + rowCount).
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const p = getPool();
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      console.log('Executed query', { duration, rows: result.rowCount });
    }
    return result.rows;               // convenience: routes always need rows
  } catch (err) {
    console.error('Database query error:', err.message);
    throw err;
  }
}

/**
 * Execute a single-row query (SELECT … LIMIT 1, INSERT … RETURNING *, etc.)
 */
export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

/**
 * Alias kept for backward compat – same as query().
 */
export async function many(text, params) {
  return query(text, params);
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema initialisation – creates every table the route files reference.
// ─────────────────────────────────────────────────────────────────────────────

export async function initDb() {
  try {
    console.log('Initializing database schema…');

    // 1. candidates
    await query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id          SERIAL PRIMARY KEY,
        full_name   VARCHAR(255) NOT NULL,
        code        VARCHAR(255) UNIQUE NOT NULL,
        banned      BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT now()
      )
    `);

    // 2. mock_tests
    await query(`
      CREATE TABLE IF NOT EXISTS mock_tests (
        id              SERIAL PRIMARY KEY,
        title           VARCHAR(255) NOT NULL,
        test_name       VARCHAR(255) NOT NULL,
        listening_html  TEXT,
        listening_audio TEXT,
        reading_html    TEXT,
        writing_html    TEXT,
        order_index     INTEGER DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT now()
      )
    `);

    // 3. answer_sheets  (one per candidate+test+section)
    await query(`
      CREATE TABLE IF NOT EXISTS answer_sheets (
        id            SERIAL PRIMARY KEY,
        candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        mock_test_id  INTEGER NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
        section       VARCHAR(50) NOT NULL,
        answers       TEXT,
        submitted_at  TIMESTAMPTZ DEFAULT now(),
        UNIQUE (candidate_id, mock_test_id, section)
      )
    `);

    // 4. writing_uploads
    await query(`
      CREATE TABLE IF NOT EXISTS writing_uploads (
        id            SERIAL PRIMARY KEY,
        candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        mock_test_id  INTEGER NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
        file_url      TEXT,
        original_name VARCHAR(255),
        submitted_at  TIMESTAMPTZ DEFAULT now()
      )
    `);

    // 5. files  (binary storage for HTML / audio / PDF)
    await query(`
      CREATE TABLE IF NOT EXISTS files (
        id         SERIAL PRIMARY KEY,
        mime       VARCHAR(255) DEFAULT 'application/octet-stream',
        name       VARCHAR(255),
        data       BYTEA,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // 6. presence  (online-status heartbeat, one row per candidate)
    await query(`
      CREATE TABLE IF NOT EXISTS presence (
        id            SERIAL PRIMARY KEY,
        candidate_id  INTEGER UNIQUE NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        full_name     VARCHAR(255),
        code          VARCHAR(255),
        section       VARCHAR(50) DEFAULT 'idle',
        last_seen     TIMESTAMPTZ DEFAULT now()
      )
    `);

    // 7. signals  (admin → candidate warnings / actions)
    await query(`
      CREATE TABLE IF NOT EXISTS signals (
        id            SERIAL PRIMARY KEY,
        candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        type          VARCHAR(50) NOT NULL,
        delivered     BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMPTZ DEFAULT now()
      )
    `);

    // 8. monitoring_events  (fullscreen exits, bans, warnings log)
    await query(`
      CREATE TABLE IF NOT EXISTS monitoring_events (
        id            SERIAL PRIMARY KEY,
        candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        type          VARCHAR(50) NOT NULL,
        section       VARCHAR(50),
        detail        TEXT,
        created_at    TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Indexes for faster lookups
    await query(`CREATE INDEX IF NOT EXISTS idx_candidates_code        ON candidates(code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_answer_sheets_cand     ON answer_sheets(candidate_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_writing_uploads_cand   ON writing_uploads(candidate_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_presence_candidate     ON presence(candidate_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_signals_candidate      ON signals(candidate_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_monitoring_candidate   ON monitoring_events(candidate_id)`);

    console.log('✓ Database schema initialized successfully (8 tables)');
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    throw err;
  }
}

/**
 * Health check – verify database connection
 */
export async function healthCheck() {
  try {
    const rows = await query('SELECT NOW() AS now');
    return rows[0];
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
