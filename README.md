# CAT 2026 Tracker — with GitHub Sync

Same UI as before, but **data is saved to a `data.json` file in your own GitHub repo**.  
Anyone who opens the GitHub Pages URL sees your live data. You control it.

---

## How It Works

```
Your Browser  ←──────────────────────→  GitHub API
     │                                       │
  Reads/writes                         data.json file
  via GitHub API                       in your repo
  (using your PAT)                     (version controlled!)
```

- Your **Personal Access Token (PAT)** is stored only in your browser's `localStorage`
- It's **never uploaded** anywhere — only sent directly to `api.github.com`
- The data file (`data.json`) lives in **your** GitHub repo, owned by you
- Saves auto-sync with a 1.2s debounce after each change
- Visitors without a token can view your data in **read-only mode**

---

## Setup (one time, ~5 minutes)

### Step 1 — Create a GitHub repo for data
1. Go to [github.com/new](https://github.com/new)
2. Name it `cat-data` (or anything you want)
3. Set it to **Public**
4. Click **Create repository** (no need to add any files)

### Step 2 — Create a GitHub Pages repo for the app
1. Go to [github.com/new](https://github.com/new) again
2. Name it `cat-tracker` (this is where `index.html` goes)
3. Set to **Public**
4. Upload `index.html` from this ZIP
5. Go to **Settings → Pages → Source: main branch / root → Save**
6. Your app is live at: `https://YOUR_USERNAME.github.io/cat-tracker/`

> 💡 You can use the **same repo** for both the app and data if you want.

### Step 3 — Create a Personal Access Token
1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Give it a name: `CAT Tracker`
3. Set expiration: **No expiration** (or 1 year)
4. Under **Scopes**, check ✅ **repo** (full repo access)
5. Click **Generate token** — copy it immediately!

### Step 4 — Connect the app
1. Open your GitHub Pages URL
2. The setup screen appears — enter:
   - Your GitHub username
   - The data repo name (e.g. `cat-data`)
   - Your PAT
3. Click **Connect & Start**
4. The app creates `data.json` in your repo automatically

---

## For Visitors (read-only)
Anyone who opens your GitHub Pages URL will see a setup screen.  
They should enter **your username + data repo name**, leave the PAT blank, and click **View Only**.  
They'll see your data but cannot edit it.

---

## Security Notes

| What | Where | Safe? |
|------|-------|-------|
| PAT | Your browser's `localStorage` only | ✅ Never leaves your device |
| Data | `data.json` in your public GitHub repo | ✅ You own it |
| App code | `index.html` in GitHub Pages | ✅ Static, no server |

**Never share your PAT.** If it leaks, revoke it at [github.com/settings/tokens](https://github.com/settings/tokens) and create a new one.

---

## Folder Structure
```
cat26-sync/
└── index.html    ← The entire app (single file)
└── README.md     ← This file
```

That's it. One file.
