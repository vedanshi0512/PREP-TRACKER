# ⚡ CAT 2026 Prep Tracker

An intelligent, offline-first CAT preparation tracker with spaced revision, smart planner, mock test tracking, and roadmap estimation.

## Features

- 📚 **Subject Tracking** — VARC, LRDI, Quant with topic-wise lecture/test/practice counts
- 🔁 **Spaced Repetition** — Auto-schedules revisions at 1 / 3 / 7 / 15 / 30 days
- 📅 **Daily Planner** — Smart task generation balancing new topics, tests & revisions
- 🗓️ **Weekly Overview** — 7-day grid with progress per day
- 📝 **Mock Tests** — CL + IMS schedule, score tracking, analysis logging
- ⚠️ **Backlog** — Missed tasks auto-detected and redistributed intelligently
- 🗺️ **Roadmap** — Live completion estimate vs CAT 2026 date
- 🌙 **Dark / Light mode** — Persisted per session
- 💾 **Export / Import** — Full JSON backup for data portability

## Pre-loaded Course Structure

Topics are seeded from **Elites Grid Course 2026** + **VARC 1000 by Gejo** (under VARC).

## Deploy on GitHub Pages (3 steps)

### Step 1 — Create GitHub Repo
1. Go to [github.com](https://github.com) → **New repository**
2. Name it `cat-prep-tracker` (or anything you like)
3. Make it **Public**
4. **Don't** initialize with README (you'll upload files)

### Step 2 — Upload Files
Option A — GitHub Web UI:
1. Drag the entire `cat-prep-tracker/` folder contents into the repo
2. Commit with message "Initial upload"

Option B — Git CLI:
```bash
cd cat-prep-tracker
git init
git add .
git commit -m "Initial upload"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cat-prep-tracker.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to repo → **Settings** → **Pages**
2. Under **Source**, select `main` branch, `/ (root)` folder
3. Click **Save**
4. Wait 2–3 minutes → your site will be live at:
   `https://YOUR_USERNAME.github.io/cat-prep-tracker/`

## Local Development

Just open `index.html` in any browser — no build step required.

```bash
# Optional: serve locally
npx serve .
# or
python3 -m http.server 8080
```

## Data Storage

All data is stored in **localStorage** in your browser. It persists across sessions on the same device/browser.

### Backup Your Data
- Click **⬇️ Export** in the sidebar to download a JSON backup
- Click **⬆️ Import** to restore from a backup file

> ⚠️ Clearing browser data / localStorage will delete your progress. **Export regularly!**

## Folder Structure

```
cat-prep-tracker/
├── index.html              # Main SPA shell
├── assets/
│   ├── css/
│   │   └── main.css        # All styles (dark + light theme)
│   └── js/
│       ├── config.js       # CAT syllabus, constants
│       ├── store.js        # localStorage data layer
│       ├── planner.js      # Smart plan generation + backlog
│       ├── ui.js           # Toast, modal, formatting utils
│       ├── app.js          # Router + app controller
│       └── pages/
│           ├── dashboard.js
│           ├── subjects.js
│           ├── daily-planner.js
│           └── other-pages.js  # Weekly, Backlog, Mocks, Roadmap
└── README.md
```

## Notes

- Built for **CAT 2026** (exam date: 29 November 2026)
- Fully offline — no backend, no APIs
- Mobile-responsive with hamburger menu
- Works on all modern browsers

Good luck with your CAT prep! 🚀
