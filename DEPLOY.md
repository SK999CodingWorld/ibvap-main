# IBVAP Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Easiest - Full Stack)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ibvap.git
git push -u origin main
```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Railway auto-detects `railway.json` and `Dockerfile.prod`
   - Click Deploy

3. **Get your URL:** Railway gives you `https://your-app.railway.app`

---

### Option 2: Render (Free Tier)

1. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: ibvap
    env: docker
    dockerfilePath: Dockerfile.prod
    plan: free
    healthCheckPath: /
    envVars:
      - key: PYTHONUNBUFFERED
        value: "1"
```

2. **Deploy:**
   - Go to [render.com](https://render.com)
   - New → Web Service → Connect GitHub
   - Select repo, Render reads `render.yaml`

---

### Option 3: Fly.io (Docker-native)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch --dockerfile Dockerfile.prod
fly deploy
```

---

### Option 4: Frontend on Vercel + Backend on Railway

#### Frontend (Vercel):
1. **Create `vercel.json` in dashboard/:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-railway-url.railway.app/api/$1" },
    { "source": "/video_feed", "destination": "https://your-railway-url.railway.app/video_feed" },
    { "source": "/alerts", "destination": "https://your-railway-url.railway.app/alerts" }
  ]
}
```

2. **Deploy:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repo → Select `dashboard` folder
   - Deploy

#### Backend (Railway):
- Same as Option 1, but update `vite.config.ts` proxy to your Railway URL

---

### Option 5: DigitalOcean App Platform

1. **Create `.do/app.yaml`:**
```yaml
name: ibvap
services:
- name: api
  source_dir: /
  github:
    repo: yourusername/ibvap
    branch: main
  run_command: python simple_dashboard.py
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 8000
  routes:
  - path: /
  health_check:
    http_path: /
  envs:
  - key: PYTHONUNBUFFERED
    value: "1"
```

---

### Option 6: Hugging Face Spaces (Best for ML Demos)

1. **Create Space:**
   - Go to [huggingface.co/new-space](https://huggingface.co/new-space)
   - Select "Docker" as SDK
   - Public or Private

2. **Add `Dockerfile` (use `Dockerfile.prod`)**

3. **Push:**
```bash
git remote add space https://huggingface.co/spaces/yourusername/ibvap
git push space main
```

---

## Pre-deployment Checklist

### 1. Build Frontend First
```bash
cd dashboard
npm install
npm run build
# This creates dashboard/dist/ which Docker copies to static/
```

### 2. Test Docker Build Locally
```bash
docker build -f Dockerfile.prod -t ibvap .
docker run -p 8000:8000 ibvap
# Test at http://localhost:8000
```

### 3. Required Files for Deploy
- [x] `Dockerfile.prod` - Production Dockerfile
- [x] `railway.json` - Railway config
- [x] `.dockerignore` - Optimize build
- [x] `simple_dashboard.py` - Serves React + API
- [x] `requirements.txt` - Python deps
- [x] `dashboard/dist/` - Built React app (run `npm run build`)

### 4. Environment Variables (Set in Platform)
```env
PYTHONUNBUFFERED=1
# Optional: for external services
# REDIS_HOST=...
# POSTGRES_HOST=...
```

---

## Platform Comparison

| Platform | Free Tier | Docker | GPU | Best For |
|----------|-----------|--------|-----|----------|
| Railway | $5 credit/mo | ✅ | ❌ | Easiest full-stack |
| Render | 750 hrs/mo | ✅ | ❌ | Simple web services |
| Fly.io | 3 shared CPUs | ✅ | ✅ (paid) | Docker-native |
| Vercel | Unlimited | ❌ | ❌ | Frontend only |
| Hugging Face | Free CPU | ✅ | ❌ | ML demos |
| DigitalOcean | $5/mo | ✅ | ✅ | Production |

---

## Recommended: Railway (Easiest)

1. Push to GitHub
2. Go to railway.app → New Project → GitHub
3. Select repo → Deploy
4. Get `https://your-app.railway.app`
4. Share with friends!

---

## Post-Deploy

1. **Test endpoints:**
   - `https://your-app.railway.app/` - React Dashboard
   - `https://your-app.railway.app/simple` - Simple Dashboard
   - `https://your-app.railway.app/video_feed` - MJPEG Stream
   - `https://your-app.railway.app/alerts` - Alerts API
   - `https://your-app.railway.app/app` - React App (if built)

2. **Share the link with friends!** 🎉