# SQLite to PostgreSQL Migration Guide

If you were previously using SQLite and need to migrate your data to PostgreSQL, follow this guide.

## Step 1: Export Data from SQLite

```bash
# Open SQLite database
sqlite3 server/data/database.sqlite

# Export candidates
.mode csv
.output candidates.csv
SELECT * FROM candidates;

# Export tests  
.output tests.csv
SELECT * FROM tests;

# Export sessions
.output sessions.csv
SELECT * FROM sessions;

# Exit
.quit
```

## Step 2: Prepare PostgreSQL Database

```bash
psql -U postgres

CREATE DATABASE mocktest_dev;
\q
```

## Step 3: Update Configuration

Edit `server/.env.local`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mocktest_dev
```

## Step 4: Start Server (Creates Schema)

```bash
cd server
npm install pg dotenv
npm run dev
```

This automatically creates all tables in PostgreSQL.

## Step 5: Import Data

### Option A: Using SQL COPY Command

**For candidates:**
```bash
psql -U postgres -d mocktest_dev -c "\COPY candidates(fullName, code) FROM 'candidates.csv' WITH (FORMAT csv, HEADER true);"
```

**For tests:**
```bash
psql -U postgres -d mocktest_dev -c "\COPY tests(title, name, listeningHtmlPath, listeningAudioPath, readingHtmlPath, writingHtmlPath, testOrder) FROM 'tests.csv' WITH (FORMAT csv, HEADER true);"
```

**For sessions:**
```bash
psql -U postgres -d mocktest_dev -c "\COPY sessions(candidateId, testId, currentSection, status, listeningAnswers, readingAnswers, writingPdfPath, startedAt, completedAt) FROM 'sessions.csv' WITH (FORMAT csv, HEADER true);"
```

### Option B: Using SQL INSERT (If COPY doesn't work)

1. Convert CSV to SQL INSERT statements
2. Run: `psql -U postgres -d mocktest_dev < import.sql`

## Step 6: Verify Data

```bash
psql -U postgres -d mocktest_dev

-- Check row counts
SELECT COUNT(*) FROM candidates;
SELECT COUNT(*) FROM tests;
SELECT COUNT(*) FROM sessions;

-- Verify a few records
SELECT * FROM candidates LIMIT 5;

\q
```

## Step 7: Reset IDs (If Needed)

If you're importing data and want to reset auto-increment IDs:

```bash
psql -U postgres -d mocktest_dev

-- Reset candidate sequences
SELECT MAX(id) FROM candidates;
ALTER SEQUENCE candidates_id_seq RESTART WITH 101;

-- Reset test sequences
SELECT MAX(id) FROM tests;
ALTER SEQUENCE tests_id_seq RESTART WITH 101;

-- Reset session sequences
SELECT MAX(id) FROM sessions;
ALTER SEQUENCE sessions_id_seq RESTART WITH 1001;

\q
```

## Important Notes

⚠️ **Before migrating:**
- Backup your SQLite database: `cp server/data/database.sqlite server/data/database.sqlite.backup`
- Test migration on a copy first
- Verify all data imports correctly

⚠️ **Data type differences:**
- SQLite: `TEXT` → PostgreSQL: `VARCHAR` (both handle strings)
- SQLite: `DATETIME` → PostgreSQL: `TIMESTAMP` (compatible)
- SQLite: `INTEGER AUTO_INCREMENT` → PostgreSQL: `SERIAL` (compatible)

⚠️ **If you have triggers or functions:**
- SQLite and PostgreSQL have different syntax
- Recreate them manually in PostgreSQL

## Troubleshooting

**Error: "Permission denied"**
```bash
sudo chown $(whoami) candidates.csv tests.csv sessions.csv
```

**Error: "Column name does not exist"**
- Verify CSV headers match database column names
- Use `-H` flag if headers are present

**Error: "Foreign key violation"**
- Import parent tables first (candidates, tests)
- Then import child tables (sessions, submissions)

**Data not appearing**
```bash
-- Verify import
SELECT COUNT(*) FROM candidates;

-- Check for errors
psql -U postgres -d mocktest_dev < import.sql 2>&1 | tee import_errors.log
```

## Rolling Back

If something goes wrong:

```bash
psql -U postgres

DROP DATABASE mocktest_dev;
CREATE DATABASE mocktest_dev;

\q
```

Then restart the server to recreate empty schema.

## After Migration

1. Verify all data
2. Test application functionality
3. Keep SQLite backup for reference
4. Update environment to use PostgreSQL
5. Delete SQLite database when confident migration was successful

---

**Need help?** See `DATABASE_SETUP.md` or `QUICK_START_DB.md`
