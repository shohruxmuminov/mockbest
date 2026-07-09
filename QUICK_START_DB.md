# Quick Start - Database Connection

## 📋 What Was Set Up

✅ PostgreSQL database module created  
✅ Database schema configured (Candidates, Tests, Sessions, Submissions tables)  
✅ Environment configuration files added  
✅ Connection pooling implemented  
✅ ES modules updated  

---

## 🚀 Get Started in 5 Minutes

### Step 1: Install PostgreSQL Locally
**Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)  
**Mac**: `brew install postgresql@15`  
**Linux**: `sudo apt-get install postgresql`

### Step 2: Create Database
```bash
# Open PostgreSQL terminal
psql -U postgres

# Create database
CREATE DATABASE mocktest_dev;

# Exit
\q
```

### Step 3: Update Environment
Edit `server/.env.local`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mocktest_dev
NODE_ENV=development
```

### Step 4: Install & Run
```bash
cd server
npm install
npm run dev
```

### Step 5: Verify
Open browser and visit: `http://localhost:8080/api/health`

Should see:
```json
{
  "status": "ok",
  "time": "2024-01-15..."
}
```

✅ **Database is connected!**

---

## ☁️ Cloud Database (Vercel Deployment)

Use **Neon** (free tier, Vercel compatible):

1. Go to [neon.tech](https://neon.tech)
2. Create project → Copy connection string
3. Add to `.env`:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname
   ```

---

## 📚 For More Details

See [DATABASE_SETUP.md](../DATABASE_SETUP.md) for:
- Detailed local setup instructions
- AWS RDS, Supabase, and other cloud options
- Troubleshooting guide
- Database schema reference

---

## 🔧 Available Commands

```bash
npm run dev      # Start development server with auto-reload
npm start        # Start production server
npm test         # Run tests
```

---

## 📱 Next: Connect the Client

```bash
cd client
npm install
npm run dev
```

Then visit `http://localhost:5173`

🎉 You're all set!
