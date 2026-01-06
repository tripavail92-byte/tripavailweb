# 🛡️ Staging Setup: Airbnb-Level Safety Net

**Purpose:** Prevent P0 regressions by testing all changes on staging before production.

**Status:** 🟡 TODO (implement immediately after P0 deploy stabilizes)

---

## Why Staging is Critical

Without staging, you're testing in production. With staging:

✅ Catch regressions before they hit users  
✅ Test with production-like data  
✅ Verify deployments without risk  
✅ Run automated smoke tests as CI gate  
✅ Safe environment for QA + manual testing  

**ROI:** One production incident costs 100x more than staging setup.

---

## Staging Architecture

```
Production:
  - Backend: Render production instance
  - Frontend: Vercel production domain
  - Database: Render PostgreSQL (production)
  - Domain: tripavail.com

Staging:
  - Backend: Render staging instance (separate service)
  - Frontend: Vercel preview URL or staging.tripavail.com
  - Database: Render PostgreSQL (staging, separate instance)
  - Domain: staging.tripavail.com
```

**Key Rule:** Staging and production databases are 100% separate. Never share.

---

## Step 1: Set Up Staging Database

### Option A: Render PostgreSQL (Recommended)

```bash
# Create new PostgreSQL instance on Render
# Name: tripavail-staging-db
# Plan: Starter ($7/mo - enough for staging)

# Get connection string
DATABASE_URL=postgresql://user:pass@host:5432/tripavail_staging
```

### Option B: Local Postgres (Dev Only)

```bash
# Add staging profile to docker-compose
docker compose --profile staging up -d postgres_staging
```

---

## Step 2: Deploy Staging Backend

### Create Render Staging Service

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name:** `tripavail-backend-staging`
   - **Branch:** `develop` (or `staging`)
   - **Build Command:** `cd backend && pnpm install && pnpm build`
   - **Start Command:** `cd backend && pnpm start:prod`
   - **Environment Variables:**
     ```
     NODE_ENV=staging
     DATABASE_URL=<staging-db-url>
     JWT_SECRET=<different-from-prod>
     STRIPE_SECRET_KEY=<test-mode-key>
     FRONTEND_URL=https://staging.tripavail.com
     ```

5. Click "Create Web Service"
6. Wait for deploy (5-10 min)

### Verify Staging Backend

```bash
# Test health endpoint
curl https://tripavail-backend-staging.onrender.com/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

## Step 3: Deploy Staging Frontend

### Option A: Vercel Preview Deployment (Easiest)

Vercel automatically creates preview deployments for all PRs:

```bash
# Push to any branch
git push origin feature/your-branch

# Vercel deploys automatically
# URL: https://tripavail-abc123.vercel.app
```

**No setup needed!** Every PR gets a unique staging URL.

### Option B: Dedicated Staging Domain

Add to Vercel:

1. Go to Project Settings → Domains
2. Add custom domain: `staging.tripavail.com`
3. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://tripavail-backend-staging.onrender.com
   ```
4. Deploy: `vercel --prod` (but to staging domain)

---

## Step 4: Seed Staging Database

```bash
# Run migrations on staging DB
DATABASE_URL=<staging-db-url> pnpm migration:run

# Seed test data
DATABASE_URL=<staging-db-url> node scripts/seed-staging.js
```

**Staging seed data should include:**
- Admin user (admin@tripavail.com / Admin123!@#)
- 3-5 test hotels (various verification statuses)
- 3-5 test tour operators (various statuses)
- Sample bookings in different states
- Test payment methods (Stripe test mode)

---

## Step 5: Add CI Gate (GitHub Actions)

Create `.github/workflows/staging-deploy.yml`:

```yaml
name: Deploy to Staging + Run Smoke Tests

on:
  push:
    branches: [develop, staging]
  pull_request:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Deploy Backend to Staging
        run: |
          # Trigger Render deploy via webhook
          curl -X POST "${{ secrets.RENDER_STAGING_DEPLOY_HOOK }}"
          sleep 60  # Wait for deploy
      
      - name: Deploy Frontend to Staging
        run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run Smoke Tests
        run: |
          cd backend
          API_URL=https://tripavail-backend-staging.onrender.com \
            node scripts/post-deploy-smoke.js
      
      - name: Notify on Failure
        if: failure()
        run: |
          echo "❌ Staging smoke tests FAILED - blocking deploy"
          exit 1

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Backend to Production
        run: |
          curl -X POST "${{ secrets.RENDER_PROD_DEPLOY_HOOK }}"
          sleep 60
      
      - name: Deploy Frontend to Production
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run Production Smoke Tests
        run: |
          cd backend
          API_URL=https://tripavail-backend.onrender.com \
            node scripts/post-deploy-smoke.js
      
      - name: Rollback on Failure
        if: failure()
        run: |
          echo "❌ Production smoke tests FAILED - manual rollback required"
          # Send alert to Slack/Discord
```

**CI Flow:**
1. Push to `develop` → Auto-deploy to staging
2. Smoke tests run on staging
3. If tests pass → Manual approval to merge to `main`
4. Merge to `main` → Auto-deploy to production
5. Smoke tests run on production
6. If production tests fail → Alert + manual rollback

---

## Step 6: Manual QA Checklist (Run on Staging Before Prod)

```markdown
## Staging QA Checklist

### Partner Onboarding
- [ ] Hotel onboarding completes all 7 steps
- [ ] Tour operator onboarding completes all 14 steps
- [ ] Status shows "Pending Admin" after submit
- [ ] Admin can approve/reject in review queue
- [ ] Rejection reason displays on partner dashboard
- [ ] Resubmit clears rejection reason
- [ ] Approval enables publish button

### Error Tracking
- [ ] All errors show Request ID in toast
- [ ] Copy button works (requestId copied to clipboard)
- [ ] Backend logs contain matching requestId
- [ ] Structured logs include userId/route/statusCode
- [ ] No "unknown" requestId values

### Partner Dashboard
- [ ] PartnerStatusBanner shows correct status
- [ ] Mobile layout responsive (no overflow)
- [ ] Action badges correct (Pending Admin, Ready to Publish, Can Resubmit)
- [ ] Dashboard switcher works (Traveler ↔ Host ↔ Operator)

### Publish Gate
- [ ] Publish blocked when status = UNDER_REVIEW (403)
- [ ] Publish allowed when status = APPROVED (200)
- [ ] Error response includes requestId

### Critical Paths
- [ ] Login/logout works
- [ ] Search loads (even if no results)
- [ ] Booking flow starts (mock payment)
- [ ] Admin panel loads review queue
```

**Rule:** All checklist items must pass on staging before deploying to production.

---

## Step 7: Monitoring + Alerts

### Sentry Setup (Error Tracking)

```bash
# Install Sentry
pnpm add @sentry/node @sentry/nextjs

# Configure backend (backend/src/main.ts)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

# Configure frontend (web/next.config.js)
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // ... your config
}, {
  silent: true,
  org: 'tripavail',
  project: 'tripavail-web',
});
```

### Uptime Monitoring

Use UptimeRobot (free) or BetterUptime:

- Monitor: `https://tripavail.com/health` (every 5 min)
- Monitor: `https://tripavail-backend.onrender.com/health` (every 5 min)
- Alert via email/Slack if down

---

## Staging Best Practices

### 1. Always Test on Staging First

```bash
# WRONG: Push to main → deploy to prod
git push origin main

# RIGHT: Push to develop → test on staging → merge to main
git push origin develop
# Wait for staging tests to pass
# Manual QA on staging
# Then: git checkout main && git merge develop && git push
```

### 2. Keep Staging Data Realistic

- Refresh staging DB from production snapshot weekly (scrub PII)
- Or: Use realistic seed data (don't test with "test@test.com")
- Include edge cases (rejected providers, cancelled bookings, refunds)

### 3. Run Smoke Tests on Every Deploy

```bash
# Before merging any PR
cd backend
API_URL=https://tripavail-backend-staging.onrender.com \
  node scripts/post-deploy-smoke.js
```

### 4. Use Staging for Demos

- Show clients new features on staging before production
- Test integrations (Stripe webhooks, Google Maps API)
- Validate design changes with stakeholders

---

## Cost Breakdown

| Service | Plan | Cost | Purpose |
|---------|------|------|---------|
| Render Staging Backend | Starter | $7/mo | Backend API |
| Render Staging Database | Starter | $7/mo | PostgreSQL |
| Vercel Preview | Free | $0 | Frontend (auto PRs) |
| Sentry | Free | $0 | Error tracking (<5k events/mo) |
| UptimeRobot | Free | $0 | Uptime monitoring |
| **Total** | | **$14/mo** | **Complete staging** |

**Worth it?** One production incident costs 100x more (customer trust, engineering time, revenue loss).

---

## Rollout Timeline

| Day | Task | Time |
|-----|------|------|
| Day 1 | Create staging database | 15 min |
| Day 1 | Deploy staging backend | 30 min |
| Day 1 | Deploy staging frontend | 15 min |
| Day 2 | Seed staging data | 30 min |
| Day 2 | Add CI workflow | 1 hour |
| Day 2 | Test smoke script on staging | 30 min |
| Day 3 | Run full QA checklist | 2 hours |
| Day 3 | Set up monitoring (Sentry) | 1 hour |
| **Total** | | **~6 hours** |

**Recommended:** Do this immediately after P0 deploy stabilizes (24-48 hours).

---

## Success Metrics

After staging is live:

✅ Zero production incidents from regressions  
✅ 100% of PRs tested on staging before merge  
✅ Smoke tests run automatically on every deploy  
✅ Manual QA time reduced (staging is always ready)  
✅ Faster iteration (test features without risk)  

**Goal:** Ship fast, ship safe. Staging makes both possible.

---

## Next Steps

1. Deploy P0 to production (use DEPLOY_NOW.md)
2. Monitor for 24 hours
3. Set up staging environment (this guide)
4. Add CI gate (GitHub Actions)
5. Train team on staging workflow

**After staging is live:** You can ship 5x faster with zero fear.

---

**Let's build staging after P0 stabilizes.** 🛡️
