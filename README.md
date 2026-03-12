# 🍽 Tableside – Staff Scheduler

A restaurant staff scheduling app built with React + Vite.

---

## Deploying Updates from Claude

When Claude gives you an updated `restaurant-scheduler.jsx`:

1. Replace `tableside/src/App.jsx` with the new file
2. Run the deploy script for your operating system:

**Mac / Linux:** double-click `deploy.sh`
*(first time: right-click → Open, or run `chmod +x deploy.sh` in terminal first)*

**Windows:** double-click `deploy.bat`

The script will:
- Ask for an optional commit message
- Stage, commit, and push to GitHub
- Trigger an automatic Netlify redeploy (~60 seconds)

---

## First-Time Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

### 3. Initialize git & push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 4. Connect to Netlify
1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Select your GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Click **Deploy**

---

## Project Structure

```
tableside/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Main app (replace this with Claude's updates)
├── deploy.sh             # One-click deploy (Mac/Linux)
├── deploy.bat            # One-click deploy (Windows)
├── index.html
├── vite.config.js
└── package.json
```

---

## Tech Stack
- [React 18](https://react.dev)
- [Vite 5](https://vitejs.dev)
- [Recharts](https://recharts.org)
- [DM Sans + DM Serif Display](https://fonts.google.com)
