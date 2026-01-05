# Deploy TripAvail via Render Blueprint (Option C)

## What This Does

The `render.yaml` Blueprint defines:
- ✅ PostgreSQL database (free tier)
- ✅ Backend service (NestJS) with DATABASE_URL auto-wired
- ✅ Frontend service (Next.js) with backend URL auto-wired
- ℹ️ Migrations need to be run manually (free tier limitation)
- ✅ No REST API rate limiting (Git-driven updates after initial setup)

---

## Deploy Now (4 Steps)

### Step 1: Go to Render Dashboard
Open: **https://dashboard.render.com**

### Step 2: Create Blueprint
1. Click **New** (top right)
2. Select **Blueprint**
3. Connect repo: `tripavail92-byte/tripavailweb`
4. Leave branch as `main`
5. Click **Next**

### Step 3: Configure & Deploy
1. Review the services (should show):
   - `tripavail-postgres` (Database)
   - `tripavail-backend` (NestJS)
   - `tripavail-web` (Next.js)
2. Set environment variables for secrets (scroll down):
   - `JWT_SECRET` = (use a strong random value like: `$(openssl rand -base64 32)`)
   - `STRIPE_SECRET_KEY` = (your Stripe test secret key)
3. Click **Apply**

Render will now:
- Create the PostgreSQL database
- Deploy the backend service
- Deploy the frontend service
- Wire DATABASE_URL to backend automatically

**Deployment time: 5-10 minutes** (mostly waiting for builds)

### Step 4: Run Migrations (After Services Go Live)

Once both services show **Live** (green):

1. Go to **tripavail-backend** service
2. Click **Shell** tab
3. Run:
   ```bash
   npm run migration:run
   ```
4. Wait for success: "Migration applied successfully"
5. Exit shell

---

## Monitor Deployment

While it's building:

1. **Databases tab:** Watch `tripavail-postgres` initialize (2-3 min)
2. **Services tab:**
   - `tripavail-backend` → **Logs** (watch build)
   - `tripavail-web` → **Logs** (watch build)
3. When status shows **Live** (green) for both services, proceed to Step 4

---

## Verify It Works

After migrations complete:

Visit: **https://tripavail-web.onrender.com/traveler/discovery**

Should see the discovery page load!

---

## What Happens Under the Hood

```yaml
services:
  tripavail-backend:
    envVars:
      DATABASE_URL: ← Auto-populated from Postgres connection string
      JWT_SECRET: ← Your secret key
      
  tripavail-web:
    envVars:
      NEXT_PUBLIC_API_BASE_URL: ← Points to backend service URL
```

Everything is wired automatically by Render. No manual copy/paste!

**Note:** Free tier doesn't support automated pre-deploy commands, so migrations run manually via Shell after deployment.

---

## Future Updates (Git-Driven)

After this initial Blueprint deploy:

- **Backend code changes?** → Commit to `main` → Render auto-deploys
- **Database migrations?** → Run via Shell after deployment (or automate in paid tier)
- **New env var?** → Add to `render.yaml` → Commit → Auto-deploy
- **No more REST API hammering** = No more 429 rate limit errors

---

## If Services Fail to Deploy

Check the logs:

1. Click the service name
2. Click **Logs** tab
3. Look for error messages
4. Common issues:
   - Missing env vars → Add to render.yaml, commit, redeploy
   - Build failure → Check build command syntax
   - Database connection error → Ensure DATABASE_URL is set

---

## Clean Up Old Services (Optional)

If you have the old manual `tripavailweb` service from earlier attempts:

1. Go to Dashboard
2. Click on `tripavailweb`
3. Click **Settings** → **Delete Service** (at the bottom)
4. The new services from Blueprint will be the primary

---

## Success! 🎉

Your full application is now live:
- Backend: https://tripavail-backend.onrender.com/v1/health
- Frontend: https://tripavail-web.onrender.com
- Discovery: https://tripavail-web.onrender.com/traveler/discovery
- Database: Managed Postgres on Render

**Next time you update code:** Just commit to main, and Render deploys automatically!

---

## Free Tier Notes

- **Migrations:** Run manually via Shell (free tier limitation)
- **Sleep after 15 min:** Services sleep if inactive; first request takes ~30s to wake
- **Backups:** Postgres has automatic daily backups
- **Upgrade available:** Pro tier includes pre-deploy commands if needed later

