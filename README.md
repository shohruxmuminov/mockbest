# IELTS Mock Test Platform

A production-ready IELTS mock test platform with a premium 3D dashboard, an
admin panel for managing tests and candidates, real-time exam monitoring, and a
secure full-screen examination flow (Listening → Reading → Writing).

> **Prepare Smart. Score High.**

---

## ✨ Features

- **3D dashboard** — lightweight Three.js background (floating geometry, particles, smooth camera, glassmorphism), responsive on desktop / tablet / mobile, with light & dark themes.
- **Two login methods**
  - **Admin** signs in with **Google** — restricted to a single authorized account (`ADMIN_EMAIL`). An optional password fallback is available when Google OAuth isn't configured.
  - **Candidates** simply enter their unique **14-digit code** — no auth screen, name shown top-right after login.
- **Mock Test Management** — upload **Listening (HTML + optional Audio)**, **Reading (HTML)** and **Writing (HTML)**. Tests are stored permanently and appear instantly in chronological order.
- **HTML rendering** — uploaded HTML is rendered exactly like a browser inside a sandboxed iframe (CSS + JS execute); candidates never see source code.
- **Candidate Management** — generate guaranteed-unique 14-digit codes, search by name or code, ban/unban.
- **Exam flow** — Listening → 40-question answer sheet (5 min, test visible beside it) → Reading → 40-question answer sheet (5 min) → Writing → PDF essay upload → Thank You page.
- **Full-screen security** — only the test interface enters full screen (after *Start Test*). Leaving full screen instantly alerts the admin with name, code, timestamp and section.
- **Real-time warnings & bans** — admin warnings appear instantly as a centered modal even mid-test and in full screen; bans end the session immediately (Socket.IO).
- **Admin review** — search by 14-digit code to view Listening/Reading answer sheets and open/download the Writing PDF.
- **Persistent storage** — SQLite database + on-disk uploads survive refreshes and restarts.

---

## 🧱 Tech stack

| Layer        | Technology |
|--------------|-----------|
| Backend      | Node.js, Express, Socket.IO |
| Database     | SQLite (`better-sqlite3`) — file-based, persistent |
| Uploads      | Multer (HTML / audio / PDF) |
| Auth         | Google Identity Services + JWT |
| Frontend     | React, React Router, Vite |
| 3D / visuals | Three.js |

The Express server serves the built React client in production, so the whole
app runs as **one deployable service**.

---

## 🚀 Local development

```bash
# 1. Install server dependencies
npm install

# 2. Install client dependencies
npm run client:install

# 3. (optional) configure environment
cp .env.example .env   # then edit values

# 4a. Run the API (terminal 1)
npm run dev:server     # http://localhost:8080

# 4b. Run the client dev server (terminal 2)
npm run dev:client     # http://localhost:5173 (proxies /api & /socket.io)
```

Open <http://localhost:5173>.

### Production build (single server)

```bash
npm install
npm run build      # builds the client into client/dist
npm start          # serves API + client on PORT (default 8080)
```

---

## 🔐 Configuration

All configuration is via environment variables — see [`.env.example`](./.env.example).

| Variable          | Description |
|-------------------|-------------|
| `PORT`            | HTTP port (default `8080`). |
| `JWT_SECRET`      | Secret for signing session tokens. **Change in production.** |
| `ADMIN_EMAIL`     | The only Google account allowed admin access. |
| `GOOGLE_CLIENT_ID`| Google OAuth Web client ID used to verify Sign-In. Empty = Google login disabled. |
| `ADMIN_PASSWORD`  | Optional password-login fallback for admin. Empty = disabled. |
| `DATA_DIR`        | Directory for the SQLite database (persist this). |
| `UPLOAD_DIR`      | Directory for uploaded files (persist this). |
| `MAX_UPLOAD_BYTES`| Max upload size (default 200 MB). |

### Enabling Google Sign-In

1. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Add your site origin (e.g. `http://localhost:5173` and your production URL) to **Authorized JavaScript origins**.
3. Set `GOOGLE_CLIENT_ID` to the generated client ID.

Only `ADMIN_EMAIL` will be granted access — any other Google account is rejected.
If you don't configure Google OAuth, set `ADMIN_PASSWORD` to use the password
fallback instead.

---

## ☁️ Deployment

### Render (recommended — config included)

This repo ships a [`render.yaml`](./render.yaml) with a **persistent disk** so
data survives restarts. Create a new Blueprint on Render pointing at the repo,
then set `GOOGLE_CLIENT_ID` (and/or `ADMIN_PASSWORD`) in the dashboard.

### Docker

```bash
docker build -t ielts-mock .
docker run -p 8080:8080 \
  -e JWT_SECRET=change-me \
  -e GOOGLE_CLIENT_ID=your-client-id \
  -v ielts-data:/app/data \
  -v ielts-uploads:/app/server/uploads \
  ielts-mock
```

### Any Node host (Railway / Fly / VPS)

```bash
npm install && npm run build && npm start
```

Make sure `DATA_DIR` and `UPLOAD_DIR` point at persistent storage.

---

## 🗂️ Project structure

```
.
├── server/                 # Express API + Socket.IO
│   ├── index.js            # app entry, serves client in prod
│   ├── config.js           # env configuration
│   ├── db.js               # SQLite schema & connection
│   ├── auth.js             # JWT, Google verification, code generation
│   ├── upload.js           # Multer storage
│   ├── socket.js           # real-time monitoring / warnings / ban
│   └── routes/             # auth, mock-tests, candidates, submissions, review, files
├── client/                 # React + Vite + Three.js
│   └── src/
│       ├── pages/          # Home, logins, dashboard, test runner, admin
│       ├── components/     # 3D background, navbar, modal, answer sheet, …
│       └── lib/            # api client, auth context, socket, theme
├── Dockerfile / render.yaml / Procfile
└── .env.example
```

---

## 🔄 Exam flow

1. Candidate enters 14-digit code → dashboard of available tests.
2. **Start Test** → browser enters full screen.
3. **Listening** (audio auto-plays once if provided) → **Submit** → 5-min Listening answer sheet (test visible beside it).
4. **Reading** → **Submit** → 5-min Reading answer sheet.
5. **Writing** → upload essay **PDF** ("Send Essay to Admin").
6. Full screen exits automatically → **Thank You** page.

Throughout, the admin **Monitoring** tab shows who is online, their current
section, and any full-screen-exit alerts — with one-click **Warning** and
**Ban** actions delivered in real time.
