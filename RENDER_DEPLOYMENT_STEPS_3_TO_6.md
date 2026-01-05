# TripAvail Render Deployment - Steps 3-6 (After Step 2)

**Status:** You completed Step 2 - Backend service "tripavailweb" is deployed!
**Service URL:** https://tripavailweb.onrender.com

---

## Step 3: Deploy Frontend Service

Since API rate limiting is preventing automated deployment, here's the dashboard method:

1. Go to: https://dashboard.render.com
2. Click **New** (top right) → **Web Service**
3. Select repo: **tripavail92-byte/tripavailweb**
4. Configure:
   - **Name:** `tripavail-web`
   - **Environment:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `web`
   - **Plan:** `Free`
5. Environment Variables (click **Add Environment Variable**):
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ`
6. Click **Create Web Service**
7. Wait for build to complete (~3-5 minutes)

---

## Step 4: Create PostgreSQL Database

1. Go to: https://dashboard.render.com
2. Click **New** (top right) → **PostgreSQL**
3. Configure:
   - **Name:** `tripavail-postgres`
   - **Database:** `tripavail` (auto-filled)
   - **User:** `postgres` (default)
   - **Region:** Same as backend (Virginia)
   - **Plan:** `Free`
4. Click **Create Database**
5. Wait 2-3 minutes for it to be ready
6. Copy the **External Database URL** (starts with `postgresql://`)

---

## Step 5: Link Database to Backend

1. Go to: https://dashboard.render.com
2. Open the **tripavailweb** service
3. Click **Environment** (left sidebar)
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** *Paste the PostgreSQL URL from Step 4*
6. Click **Save**
7. Service auto-redeploys (~2 minutes)

---

## Step 6: Connect Frontend to Backend

1. Go to: https://dashboard.render.com
2. Open the **tripavail-web** service
3. Click **Environment** (left sidebar)
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `https://tripavailweb.onrender.com/v1`
6. Click **Save**
7. Service auto-redeploys (~2 minutes)

---

## After Deployment: Run Migrations

Once backend is running with database:

1. Open **tripavailweb** service
2. Click **Shell** (top tabs)
3. Run: `npm run migration:run`
4. Wait for success message
5. Done!

---

## Testing

Visit: `https://tripavail-web.onrender.com/traveler/discovery`

Should see the discovery page loading!

---

**Notes:**
- Free tier: Services sleep after 15 min of inactivity
- To keep active: Add a cron job or use Uptime Robot
- Check build logs if services fail to deploy
- Database takes ~2 min to provision

