# 🚂 TripAvail → Railway - Quick Start

## ✅ Files Created for Railway Deployment

I've prepared everything you need:

1. ✅ `railway.json` - Root project configuration
2. ✅ `backend/railway.toml` - Backend service configuration  
3. ✅ `web/railway.toml` - Web service configuration
4. ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Complete deployment instructions
5. ✅ Added migration scripts to `backend/package.json`

---

## 🎯 Deploy in 3 Easy Steps

### Step 1: Push to GitHub (1 minute)

```powershell
cd d:\tripavailweb

# If not already a git repo:
git init
git add .
git commit -m "Prepare for Railway deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/tripavail.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway Dashboard (3 minutes)

1. Go to: **https://railway.app/new**
2. Click **"Deploy from GitHub repo"**
3. Select your `tripavail` repository
4. Railway will auto-detect the monorepo structure

### Step 3: Add Services & Configure (2 minutes)

Railway will create your backend and web services automatically. You just need to add databases:

**Click "+ New" for each:**
- PostgreSQL (Database)
- Redis (Cache)
- Meilisearch (Search) - Use Docker image: `getmeili/meilisearch:latest`

**Then set environment variables** (copy from guide below)

---

## 🔑 Essential Environment Variables

### Backend Service

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
MEILI_URL=${{Meilisearch.MEILI_HOST}}
MEILI_MASTER_KEY=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
CORS_ORIGINS=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=generate-a-secure-random-string-min-32-chars
NODE_ENV=production
PORT=4100
```

### Web Service

```bash
NEXT_PUBLIC_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ
NODE_ENV=production
```

---

## 🎉 That's It!

Railway will:
- ✅ Automatically build your backend (NestJS)
- ✅ Automatically build your web app (Next.js)
- ✅ Provision PostgreSQL with credentials
- ✅ Set up Redis for caching
- ✅ Deploy Meilisearch for search
- ✅ Generate public HTTPS URLs
- ✅ Auto-deploy on every git push

---

## 🔧 After First Deploy

### Run Database Migrations

**Option 1: Via Dashboard**
1. Go to backend service → **Deploy** tab
2. Click **"Run a command"**
3. Enter: `npm run migration:run`

**Option 2: Via CLI**
```bash
npm install -g @railway/cli
railway login
railway link
railway run --service backend npm run migration:run
```

### Generate Public Domains

1. Backend service → **Settings** → **Networking** → **"Generate Domain"**
2. Web service → **Settings** → **Networking** → **"Generate Domain"**
3. Copy URLs and update environment variables if needed

---

## 🌐 Your Live URLs

After deployment, you'll get:
- **Backend API**: `https://tripavail-backend-production.up.railway.app`
- **Web Portal**: `https://tripavail-web-production.up.railway.app`
- **Discovery Page**: `https://tripavail-web-production.up.railway.app/traveler/discovery`

---

## 💰 Pricing

Railway Hobby Plan: **$5/month** + usage
- Includes 500 execution hours
- Perfect for development/testing

Railway Pro Plan: **$20/month** + usage
- Unlimited execution hours
- Better for production

**Estimated total cost for TripAvail: ~$35-45/month**

This includes:
- Backend hosting
- Web hosting
- PostgreSQL database
- Redis cache
- Meilisearch instance
- Automatic SSL
- Unlimited bandwidth (within reasonable limits)

**Much cheaper than:**
- AWS (requires DevOps knowledge)
- Heroku (more expensive, less features)
- VPS management (time-consuming)

---

## 🆚 Railway vs Docker (Local Development)

| What | Local Docker | Railway Cloud |
|------|-------------|---------------|
| **Setup Time** | 30+ minutes | 5 minutes |
| **Database** | Manual Docker setup | Auto-provisioned |
| **Port Issues** | Constant conflicts | No port management needed |
| **Public Access** | Need ngrok/tunneling | Built-in HTTPS URLs |
| **SSL/HTTPS** | Manual cert setup | Automatic |
| **Scaling** | Limited by your PC | Click to scale |
| **Monitoring** | Manual setup | Built-in dashboard |
| **Cost** | $0 (but PC must run 24/7) | ~$35/month |
| **Best For** | Local development | Production & Testing |

---

## 📚 Full Documentation

See **RAILWAY_DEPLOYMENT_GUIDE.md** for:
- Detailed configuration steps
- Troubleshooting guide
- Advanced features
- Scaling instructions
- Custom domain setup

---

## 🎯 Why Railway Solves Your Issues

**Your Current Problem:**
- ❌ PostgreSQL not running (port 5434)
- ❌ Redis not running (port 6379)
- ❌ Meilisearch not running (port 7700)
- ❌ Docker Desktop issues on Windows
- ❌ Port conflicts everywhere

**Railway Solution:**
- ✅ All services auto-provisioned
- ✅ No local ports needed
- ✅ No Docker Desktop required
- ✅ No port conflicts
- ✅ Everything just works™️

---

## 🚀 Ready to Deploy?

1. Push code to GitHub
2. Go to https://railway.app/new
3. Click "Deploy from GitHub repo"
4. Done! ☕

Your `/traveler/discovery` page will work perfectly once deployed!

---

**Questions?** Check RAILWAY_DEPLOYMENT_GUIDE.md or ask me!

**Token provided:** `1f376bad-ec67-41b8-b3de-64d857c2dda4`  
Use this if you want to use the Railway CLI instead of the dashboard.
