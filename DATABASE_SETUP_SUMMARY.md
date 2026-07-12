# Database Connection Setup - Summary

## ✅ What Was Completed

Your project is now fully configured to use **PostgreSQL** database!

### 1. **Database Module** (`server/db.js`)
- Created modern PostgreSQL connection using `pg` library
- Implemented connection pooling for better performance
- Added helper functions: `query()`, `one()`, `many()`
- Auto-initializes database schema on startup
- Proper error handling and logging

### 2. **Database Schema** (Auto-created on startup)
```
✓ candidates        - Candidate user records
✓ tests             - Mock test configurations  
✓ sessions          - Test session tracking
✓ submissions       - Test result submissions
✓ Indexes           - Performance optimization
```

### 3. **Configuration Files**
| File | Purpose |
|------|---------|
| `server/.env.local` | Local development configuration |
| `server/.env.example` | Environment variables template |
| `server/config.js` | Updated to load .env files properly |
| `server/package.json` | Added pg, dotenv; switched to ES modules |

### 4. **Server Entry Point** (`server/index.js`)
- Converted to ES modules for consistency
- Database initialization on startup
- Socket.io integration for real-time features
- Graceful shutdown handling

### 5. **Documentation**
- `DATABASE_SETUP.md` - Comprehensive setup guide (5 options)
- `QUICK_START_DB.md` - Quick 5-minute setup guide

---

## 🚀 Next Steps

### Option A: Local Development (Recommended)

**1. Install PostgreSQL**
- Windows: https://www.postgresql.org/download/windows/
- Mac: `brew install postgresql@15`
- Linux: `sudo apt-get install postgresql`

**2. Create Database**
```bash
psql -U postgres
CREATE DATABASE mocktest_dev;
\q
```

**3. Update Configuration**
Edit `server/.env.local`:
```
DATABASE_URL=postgresql://postgres.mvcsffrjuqphdgrpname:[XonariqKuchasi8]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**4. Start Server**
```bash
cd server
npm install
npm run dev
```

### Option B: Cloud Deployment (Vercel)

Use Neon PostgreSQL (free tier):
1. Sign up at https://neon.tech
2. Create project
3. Copy connection string to `DATABASE_URL` in Vercel environment variables

---

## 📊 Database Tables Reference

### `candidates`
```sql
id (SERIAL PRIMARY KEY)
fullName (VARCHAR)
code (VARCHAR UNIQUE)
createdAt (TIMESTAMP)
```

### `tests`
```sql
id (SERIAL PRIMARY KEY)
title (VARCHAR)
name (VARCHAR)
listeningHtmlPath (VARCHAR)
listeningAudioPath (VARCHAR)
readingHtmlPath (VARCHAR)
writingHtmlPath (VARCHAR)
testOrder (INTEGER)
createdAt (TIMESTAMP)
```

### `sessions`
```sql
id (SERIAL PRIMARY KEY)
candidateId (INTEGER FK → candidates.id)
testId (INTEGER FK → tests.id)
currentSection (VARCHAR)
status (VARCHAR)
listeningAnswers (TEXT - JSON)
readingAnswers (TEXT - JSON)
writingPdfPath (VARCHAR)
startedAt (TIMESTAMP)
completedAt (TIMESTAMP)
```

### `submissions`
```sql
id (SERIAL PRIMARY KEY)
candidateId (INTEGER FK → candidates.id)
testId (INTEGER FK → tests.id)
listeningScore (DECIMAL)
readingScore (DECIMAL)
writingScore (DECIMAL)
totalScore (DECIMAL)
submittedAt (TIMESTAMP)
```

---

## 🔗 API Endpoints Available

- `GET /api/health` - Server health check
- `POST /api/auth/admin/code` - Admin login
- `POST /api/auth/admin/password` - Admin password login
- `GET /api/admin/candidates` - List candidates
- `POST /api/admin/candidates` - Create candidate
- `GET /api/mock-tests` - List tests
- `POST /api/mock-tests` - Create test
- Plus all submission, monitoring, and review endpoints

---

## 📁 Modified/Created Files

**Modified:**
- `server/db.js` - Replaced SQLite with PostgreSQL
- `server/index.js` - Updated to ES modules, added DB init
- `server/config.js` - Enhanced env loading
- `server/package.json` - Added pg, dotenv, updated scripts

**Created:**
- `server/.env.local` - Local dev config
- `server/.env.example` - Config template
- `DATABASE_SETUP.md` - Comprehensive guide
- `QUICK_START_DB.md` - Quick setup guide

---

## ⚙️ Environment Variables

All available configuration options:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
POSTGRES_URL=postgresql://... (alternative)

# Server
PORT=8080
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
ADMIN_CODE=2010

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-id

# File Upload
MAX_UPLOAD_BYTES=209715200

# Features
ANSWER_SHEET_SECONDS=300
```

---

## ✨ Key Features

✅ Connection pooling for performance  
✅ Auto schema initialization  
✅ Proper error handling  
✅ SSL support for production  
✅ Query logging in development  
✅ Graceful shutdown  
✅ Multiple deployment options  

---

## 🆘 Troubleshooting

**"Cannot find module 'pg'"**
```bash
cd server && npm install pg dotenv
```

**"Connection refused"**
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists

**"Role 'postgres' does not exist"**
```bash
psql -U your_username
CREATE DATABASE mocktest_dev;
```

For more help, see `DATABASE_SETUP.md`

---

## 📞 Support

- Read `DATABASE_SETUP.md` for detailed troubleshooting
- Check `QUICK_START_DB.md` for quick setup
- Review API routes in `server/routes/` directory

**Your database is ready! 🎉**

Happy coding! 🚀
