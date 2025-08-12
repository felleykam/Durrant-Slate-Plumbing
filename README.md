# Plumbing Toolkit (PWA)

A lightweight offline-first PWA that bundles:
- **Jobs** (placeholder for your existing job tracker — paste your code here)
- **Calculator**
- **Notes** (can pin to Board)
- **Board** (infinite canvas with sticky notes, pan & zoom)

## Run locally
Serve the folder with any static server (Python example):
```bash
python -m http.server 8080
```
Then visit http://localhost:8080

## Deploy on GitHub Pages
1. Create a new repo and push these files.
2. In repo Settings → Pages → set the branch to `main` (root).
3. Open the Pages URL on your iPhone → Share → **Add to Home Screen**.

## iOS Tips
- First open online so the Service Worker can cache files.
- To install: Safari → Share → Add to Home Screen.
- The app works offline after first load.

## Replace Job Tracker
Swap `modules/jobs.js` with your existing UI and logic or paste the HTML into the `#jobs` section and wire events in `initJobs`.


## Enable Team Sync (Supabase, optional)
1. Create a project at Supabase → copy **Project URL** and **anon key**.
2. Open `config.js` and paste them:
   ```js
   export const SUPABASE_URL = 'https://YOURPROJECT.supabase.co';
   export const SUPABASE_ANON_KEY = 'ey...';
   ```
3. In Supabase SQL, run the schema from the Chat message to create `entries` + `audit_log`.
4. Reload the app. Header shows **Sign in** if cloud is enabled. Sign in via email link.
5. Click **Sync** in Jobs to pull shared entries. Use **Changes** on an entry to see who edited what.


### Note on GitHub Pages path
Service worker and PWA assets use **relative paths** so the app works under `/REPO/` on Pages.
