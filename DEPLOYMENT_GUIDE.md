# 🚀 BlockD Full Deployment Guide: GitHub ➔ Render (Backend) ➔ Vercel (Frontend)

Follow this complete, step-by-step guide to push BlockD to GitHub and deploy both the Backend API on **Render** and the Frontend React Dashboard on **Vercel**.

---

## 📁 Repository Structure Overview
```
├── blockd/
│   ├── backend/               <-- Render Web Service Root
│   │   ├── server.js
│   │   ├── dynamicCaseManager.js
│   │   ├── ai/
│   │   ├── graph/
│   │   ├── storage/
│   │   └── ingestion/
│   ├── dashboard/             <-- Vercel Frontend Root
│   │   ├── src/
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── contracts/             <-- Solidity Smart Contracts
│   │   └── BlockDEvidenceRegistry.sol
│   ├── presentation_deck.md   <-- SIH Presentation Deck Content
│   └── README.md
├── .gitignore                 <-- Production Clean Gitignore (Auto-created)
└── package.json               <-- Root Package File
```

---

## Part 1: Push Clean Codebase to GitHub

### Step 1: Open PowerShell / Terminal in Workspace Root
```bash
# Check status to verify .env and node_modules are ignored
git status

# Initialize git (if not already done)
git init

# Add all production files (ignored files like .env, node_modules, and uploads are excluded)
git add .

# Commit changes
git commit -m "feat: complete BlockD criminal intelligence platform with live Kanoon & dynamic graph"

# Rename branch to main
git branch -M main

# Link your GitHub Repository (Create a new repo on github.com first)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# Push to GitHub
git push -u origin main
```

---

## Part 2: Deploy Backend API on Render (Node.js)

1. Go to **[Render.com](https://render.com)** and log in with GitHub.
2. Click **New +** ➔ **Web Service**.
3. Select your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `blockd-backend`
   - **Region**: Singapore or Frankfurt
   - **Branch**: `main`
   - **Root Directory**: `.` (Leave as root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node blockd/backend/server.js`
   - **Plan**: `Free`
5. **Add Environment Variables (Optional / Recommended)**:
   - Click **Environment Variables** and add:
     - `PORT` = `5001`
     - `INDIAN_KANOON_API_TOKEN` = `your_token_if_any`
6. Click **Deploy Web Service**.
7. Once deployed, Render will give you a live URL, e.g.:
   👉 `https://blockd-backend.onrender.com`

---

## Part 3: Deploy Frontend Dashboard on Vercel

1. Go to **[Vercel.com](https://vercel.com)** and log in with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`blockd/dashboard`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Add Environment Variable for Backend Connection**:
   - Open **Environment Variables** and add:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://blockd-backend.onrender.com` (Your live Render URL from Part 2)
6. Click **Deploy**.
7. Vercel will build and launch your live application URL, e.g.:
   👉 `https://blockd.vercel.app`

---

## Part 4: Verification Checklist

| Service | Live URL Example | What to Verify |
| :--- | :--- | :--- |
| **Render API** | `https://blockd-backend.onrender.com/api/health` | Returns `{ "status": "healthy", "service": "BlockD..." }` |
| **Vercel UI** | `https://blockd.vercel.app` | Interactive 2D Graph, Kanoon Search, and AI Copilot working live! |
