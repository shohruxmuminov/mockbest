# Database Setup Guide

This project uses **PostgreSQL** for the database. Follow the steps below to set it up locally or connect to a cloud database.

## Option 1: Local PostgreSQL Setup (Recommended for Development)

### Prerequisites
- PostgreSQL installed on your system
  - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
  - **Mac**: `brew install postgresql@15`
  - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### Step 1: Start PostgreSQL Service
- **Windows**: PostgreSQL runs as a service automatically
- **Mac**: `brew services start postgresql@15`
- **Linux**: `sudo systemctl start postgresql`

### Step 2: Create Database and User
Open `psql` (PostgreSQL command line):

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mocktest_dev;

# Create user (optional, recommended for security)
CREATE USER mocktest_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mocktest_dev TO mocktest_user;

# Connect to the database
\c mocktest_dev

# Exit psql
\q
```

### Step 3: Configure Environment Variables
Edit `server/.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mocktest_dev
NODE_ENV=development
```

Or if you created a separate user:
```
DATABASE_URL=postgresql://mocktest_user:secure_password@localhost:5432/mocktest_dev
```

### Step 4: Install Dependencies
```bash
cd server
npm install
```

### Step 5: Run the Server
```bash
npm run dev
```

The database schema will be created automatically on first run.

---

## Option 2: Cloud PostgreSQL (Vercel/Production)

### Using Neon (Recommended for Vercel)
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a project
3. Copy your connection string
4. Add to your `.env` or Vercel environment variables:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname
   ```

### Using Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the URI and add to `.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
   ```

### Using AWS RDS
1. Create an RDS PostgreSQL instance
2. Get the endpoint from AWS console
3. Add to `.env`:
   ```
   DATABASE_URL=postgresql://username:password@endpoint.rds.amazonaws.com:5432/dbname
   ```

---

## Testing the Connection

### Verify Connection Locally
```bash
cd server
psql postgresql://postgres:postgres@localhost:5432/mocktest_dev

# List tables
\dt

# Exit
\q
```

### Verify Connection via API
```bash
curl http://localhost:8080/api/health
```

Should return:
```json
{
  "status": "ok",
  "time": "2024-01-15T10:30:00.000Z"
}
```

---

## Database Schema

The following tables are automatically created:

### `candidates`
- `id` (SERIAL PRIMARY KEY)
- `fullName` (VARCHAR)
- `code` (VARCHAR UNIQUE) - 14-digit code for candidates
- `createdAt` (TIMESTAMP)

### `tests`
- `id` (SERIAL PRIMARY KEY)
- `title` (VARCHAR)
- `name` (VARCHAR)
- `listeningHtmlPath` (VARCHAR)
- `listeningAudioPath` (VARCHAR)
- `readingHtmlPath` (VARCHAR)
- `writingHtmlPath` (VARCHAR)
- `testOrder` (INTEGER)
- `createdAt` (TIMESTAMP)

### `sessions`
- `id` (SERIAL PRIMARY KEY)
- `candidateId` (INTEGER FK)
- `testId` (INTEGER FK)
- `currentSection` (VARCHAR) - listening, reading, writing, completed
- `status` (VARCHAR) - active, banned, completed
- `listeningAnswers` (TEXT - JSON)
- `readingAnswers` (TEXT - JSON)
- `writingPdfPath` (VARCHAR)
- `startedAt` (TIMESTAMP)
- `completedAt` (TIMESTAMP)

### `submissions`
- `id` (SERIAL PRIMARY KEY)
- `candidateId` (INTEGER FK)
- `testId` (INTEGER FK)
- `listeningScore` (DECIMAL)
- `readingScore` (DECIMAL)
- `writingScore` (DECIMAL)
- `totalScore` (DECIMAL)
- `submittedAt` (TIMESTAMP)

---

## Troubleshooting

### Error: "Cannot find module 'pg'"
```bash
cd server
npm install pg dotenv
```

### Error: "ECONNREFUSED - Connection refused"
- Make sure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check if the database exists

### Error: "Role 'postgres' does not exist"
```bash
psql -U your_username -d postgres
CREATE DATABASE mocktest_dev;
```

### Reset Database (Warning: Deletes all data)
```bash
# Connect to PostgreSQL
psql -U postgres

# Drop and recreate database
DROP DATABASE mocktest_dev;
CREATE DATABASE mocktest_dev;

# Exit and restart server
\q
npm run dev
```

---

## Next Steps

1. **Install Dependencies**: `npm install` in both `server/` and `client/`
2. **Start Development**: `npm run dev` in server directory
3. **Configure Admin Access**: Update `ADMIN_CODE` or `ADMIN_PASSWORD` in `.env.local`
4. **Run Client**: `npm run dev` in `client/` directory

Your database is now ready! 🎉
