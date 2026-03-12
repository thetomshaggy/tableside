# 🍽 Tableside – Staff Scheduler

A restaurant staff scheduling app built with React + Vite.

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start the dev server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploy to Netlify (Quickest)

### Option A — Drag & Drop (no account needed)
1. Build the project:
   ```bash
   npm run build
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder onto the page
4. You'll get a live URL immediately ✅

### Option B — Netlify + GitHub (auto-deploys on every push)
1. Push this project to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Connect your GitHub repo
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy** ✅

Every `git push` will automatically redeploy.

---

## Deploy to Vercel
1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo — Vercel auto-detects Vite, no config needed
4. Click **Deploy** ✅

---

## Project Structure

```
tableside/
├── public/
│   └── favicon.svg         # App icon
├── src/
│   ├── main.jsx            # React entry point
│   └── App.jsx             # Main app (all components)
├── index.html              # HTML shell
├── vite.config.js          # Vite config
├── package.json            # Dependencies & scripts
└── .gitignore
```

---

## Tech Stack
- [React 18](https://react.dev)
- [Vite 5](https://vitejs.dev)
- [Recharts](https://recharts.org) — labor cost charts
- [DM Sans + DM Serif Display](https://fonts.google.com) — typography (loaded from Google Fonts)
