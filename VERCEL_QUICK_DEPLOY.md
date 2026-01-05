# Deploy Frontend to Vercel - Manual (2 Minutes)

Since API deployment has API version issues, use Vercel's simple dashboard (literally 2 clicks).

## Step 1: Go to Vercel Import Page

Open: https://vercel.com/new/git

---

## Step 2: Select Your GitHub Repo

1. You'll see a list of your repos
2. Find and click: **tripavail92-byte/tripavailweb**
3. Click **Import**

---

## Step 3: Configure

A form will appear:

### Project Settings:
- **Project Name:** `tripavail-web` (auto-filled)
- **Framework:** `Next.js` (auto-detected) ✓
- **Root Directory:** Change from blank → `web`

### Build & Development Settings:
- Leave defaults (Vercel auto-detects Next.js build)

### Environment Variables:
Add these 3:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ
NEXT_PUBLIC_API_BASE_URL = https://tripavailweb.onrender.com/v1
NODE_ENV = production
```

Then click **Deploy**

---

## Step 4: Wait (~2-3 minutes)

Vercel builds and deploys automatically.

When it shows a green checkmark → **Done!**

---

## You'll Get:
- ✅ Automatic domain like: `tripavail-web.vercel.app`
- ✅ Instant HTTPS
- ✅ Auto-deploys on every git push
- ✅ Free tier forever

---

## Then Complete These Steps:

### 1. Create PostgreSQL Database (Render dashboard)
- Go: https://dashboard.render.com
- Click: New → PostgreSQL
- Name: `tripavail-postgres`
- Database: `tripavail`
- Plan: Free
- Click: Create
- **Copy the External Database URL**

### 2. Link Database to Backend
- Go: https://dashboard.render.com
- Click: `tripavailweb` service
- Click: Environment tab
- Add: `DATABASE_URL` = *paste database URL*
- Save (auto-redeploys)

### 3. Run Migrations
- Go: https://dashboard.render.com
- Click: `tripavailweb` service
- Click: Shell tab
- Run: `npm run migration:run`
- Done!

### 4. Test
Visit your Vercel domain + `/traveler/discovery`:
```
https://tripavail-web.vercel.app/traveler/discovery
```

Should see discovery page!

---

## Timeline
- Step 1-3: ~5 min (Vercel import)
- Step 4.1: ~3 min (Create database)
- Step 4.2: ~2 min (Link database)
- Step 4.3: ~2 min (Run migrations)
- **Total: ~12 minutes**

---

## Done! 🎉

**You now have:**
- Backend: `https://tripavailweb.onrender.com` (Render)
- Frontend: `https://tripavail-web.vercel.app` (Vercel)
- Database: Managed PostgreSQL (Render)
- Discovery page: ✅ Live on internet

