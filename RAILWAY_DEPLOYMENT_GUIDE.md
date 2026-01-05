# TripAvail - Railway Deployment Guide

## 🚂 Quick Railway Deployment (Recommended)

Railway is the easiest way to deploy TripAvail. It automatically provisions PostgreSQL, Redis, and other services without any local setup required.

---

## Step 1: Push Code to GitHub

First, ensure your code is in a GitHub repository:

```powershell
cd d:\tripavailweb

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Railway deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/tripavail.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Railway Dashboard

### Option A: Deploy via Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/new
   - Login with your GitHub account

2. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your `tripavail` repository

3. **Configure Services**
   Railway will detect your project structure. You need to set up 3 services:

   **Service 1: Backend (NestJS)**
   - Root Directory: `/backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Port: Will auto-detect (4100)

   **Service 2: Web (Next.js)**
   - Root Directory: `/web`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Port: Will auto-detect (3000)

   **Service 3: PostgreSQL**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Railway automatically provisions and connects it

4. **Add Additional Services** (Click "+ New" for each)
   - **Redis** (for caching/sessions)
   - **Meilisearch** (for search) - Use Docker image: `getmeili/meilisearch:latest`

---

## Step 3: Configure Environment Variables

### Backend Service Variables

Go to your backend service → **Variables** tab → Add these:

```bash
# Database (Auto-populated by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Auto-populated by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# Meilisearch
MEILI_URL=${{Meilisearch.MEILI_HOST}}
MEILI_MASTER_KEY=your-secret-master-key

# Stripe (Replace with your actual keys from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# CORS (Web service URL - will be provided by Railway)
CORS_ORIGINS=${{web.RAILWAY_PUBLIC_DOMAIN}}

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Node Environment
NODE_ENV=production
PORT=4100
```

### Web Service Variables

Go to your web service → **Variables** tab → Add these:

```bash
# API URL (Backend service URL - will be provided by Railway)
NEXT_PUBLIC_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ

# Node Environment
NODE_ENV=production
```

### Meilisearch Service Variables

```bash
MEILI_MASTER_KEY=your-secret-master-key
MEILI_ENV=production
```

---

## Step 4: Generate Public Domains

1. Go to each service (Backend, Web, Meilisearch)
2. Click **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy the generated URLs and update your environment variables accordingly

Example URLs:
- Backend: `https://tripavail-backend.railway.app`
- Web: `https://tripavail-web.railway.app`
- Meilisearch: `https://tripavail-search.railway.app`

---

## Step 5: Run Database Migrations

After backend is deployed:

1. Go to Backend service
2. Click **"Deploy"** tab
3. Click **"Run Command"** or use the CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run --service backend npm run migration:run
```

Or use the Railway dashboard:
- Backend service → **Deploy** → **Run a command**
- Enter: `npm run migration:run`

---

## Step 6: Verify Deployment

Test your deployed services:

### Backend Health Check
```bash
curl https://your-backend-url.railway.app/v1/health
```

### Web Portal
Visit: `https://your-web-url.railway.app`

### Discovery Page
Visit: `https://your-web-url.railway.app/traveler/discovery`

---

## Alternative: Railway CLI Deployment

If you prefer using the CLI with your token:

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login with token
$env:RAILWAY_TOKEN="1f376bad-ec67-41b8-b3de-64d857c2dda4"
railway whoami

# Initialize project
railway init

# Link to existing project (if you already created one in dashboard)
railway link

# Deploy backend
railway up --service backend

# Deploy web
railway up --service web
```

---

## Project Structure for Railway

Railway expects this structure:

```
tripavailweb/
├── backend/
│   ├── package.json
│   ├── railway.toml       # ✅ Created
│   ├── src/
│   └── prisma/
├── web/
│   ├── package.json
│   ├── railway.toml       # ✅ Created
│   ├── src/
│   └── next.config.ts
├── railway.json           # ✅ Created (root config)
└── docker-compose.yml     # Not used on Railway
```

---

## Service Configuration Details

### Backend Service (NestJS)

**Build Settings:**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/v1/health"
```

**Required in package.json:**
```json
{
  "scripts": {
    "start:prod": "node dist/main"
  }
}
```

### Web Service (Next.js)

**Build Settings:**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
```

**Required in package.json:**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

---

## Database Setup on Railway

Railway automatically:
- ✅ Provisions PostgreSQL 16
- ✅ Creates database credentials
- ✅ Injects `DATABASE_URL` environment variable
- ✅ Sets up internal networking

You just need to:
1. Run migrations: `railway run npm run migration:run`
2. (Optional) Seed data: `railway run npm run seed`

---

## Troubleshooting

### Issue: Build Fails

**Check:**
- Build logs in Railway dashboard
- Ensure `package.json` has correct scripts
- Verify all dependencies are in `package.json`, not just `devDependencies`

**Fix:**
```json
// Move build dependencies to regular dependencies
"dependencies": {
  "@nestjs/cli": "^10.0.0",
  "typescript": "^5.0.0"
}
```

### Issue: Database Connection Fails

**Check:**
- Environment variable `DATABASE_URL` is set
- Database service is running (green status)
- Run migrations: `railway run npm run migration:run`

### Issue: Web Can't Connect to Backend

**Check:**
- Backend service has public domain generated
- Web service has `NEXT_PUBLIC_API_BASE_URL` set correctly
- CORS_ORIGINS in backend includes web domain

### Issue: Port Conflicts

Railway automatically assigns ports. Don't hardcode ports in production:

```typescript
// Good - Use environment variable
const port = process.env.PORT || 4100;

// Bad - Hardcoded
const port = 4100;
```

---

## Cost Estimate (Railway Pricing)

Railway offers:
- **$5 Hobby Plan** - 500 execution hours/month (enough for small apps)
- **$20 Pro Plan** - Unlimited execution hours

Estimated monthly cost for TripAvail:
- Backend: ~$10-15/month
- Web: ~$10-15/month
- PostgreSQL: ~$5/month
- Redis: ~$5/month
- Meilisearch: ~$5/month

**Total: ~$35-45/month** (much cheaper than managing servers!)

---

## Next Steps After Deployment

1. **Set up custom domain**
   - Settings → Networking → Custom Domain
   - Add your domain (e.g., `api.tripavail.com`, `app.tripavail.com`)

2. **Enable automatic deployments**
   - Already enabled! Every git push to main triggers deploy

3. **Set up staging environment**
   - Create PR → Railway auto-deploys PR environment
   - Test before merging to production

4. **Monitor your app**
   - Railway dashboard shows:
     - CPU/Memory usage
     - Request logs
     - Deployment history
     - Build logs

5. **Scale as needed**
   - Settings → Scaling → Increase replicas
   - Vertical scaling: Increase RAM/CPU

---

## Comparison: Railway vs Local Docker

| Feature | Local Docker | Railway |
|---------|--------------|---------|
| Setup Time | 30+ mins | 5 mins |
| Database | Manual setup | Auto-provisioned |
| Redis | Manual setup | Auto-provisioned |
| SSL/HTTPS | Manual | Automatic |
| Public URL | ngrok/tunnels | Automatic |
| Monitoring | Manual | Built-in |
| Scaling | Manual | Click to scale |
| Cost | $0 (but requires running PC) | ~$35/month |

---

## Support

- **Railway Docs**: https://docs.railway.com
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://railway.statuspage.io

---

**Ready to deploy?** Just push to GitHub and follow Step 2 above! 🚀

---

**Last Updated:** January 5, 2026
