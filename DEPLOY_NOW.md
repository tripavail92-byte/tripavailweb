# 🚀 Deploy Now: Production Polish P0

**Date:** January 6, 2026  
**Phase:** Partner Onboarding + Error Tracking + Status Banner  
**Risk:** 🟢 ZERO (all sanity checks passed)

---

## Step 1: Merge to Main

```bash
# Ensure you're on your feature branch
git status

# Pull latest main
git checkout main
git pull origin main

# Merge feature branch (replace with your branch name)
git merge feature/production-polish-p0

# Push to main
git push origin main
```

---

## Step 2: Deploy Backend First

### Option A: Docker Production Deploy

```bash
# Build production backend image
docker compose -f docker-compose.prod.yml build backend

# Deploy backend (stops old container, starts new one)
docker compose -f docker-compose.prod.yml up -d backend

# Wait 10 seconds for startup
sleep 10

# Check backend health
curl http://localhost:4100/health
# Expected: {"status":"ok","timestamp":"2026-01-06T..."}
```

### Option B: Render Deploy (if using Render.com)

```bash
# Trigger backend deploy via Render dashboard or CLI
render deploy --service backend

# Wait for deploy to complete (check Render dashboard)
# Expected: "Deploy live" status
```

### Verify Backend is Live

```bash
# Test backend health
curl https://your-backend-url.com/health

# Test structured logging (check Docker logs)
docker logs tripavail_backend --tail 50 | grep "requestId"
# Expected: JSON logs with requestId, userId, route, statusCode

# Test error response includes requestId (intentional 403)
curl -X POST https://your-backend-url.com/v1/admin/providers/test/approve \
  -H "Authorization: Bearer invalid"
# Expected: {"statusCode":403,"message":"...","requestId":"uuid-here"}
```

**✅ Backend Deploy Complete** — Proceed to frontend only after verification passes.

---

## Step 3: Deploy Frontend

### Option A: Vercel Deploy

```bash
# Deploy to production
vercel --prod

# Wait for deploy URL
# Expected: "Production: https://tripavail.vercel.app"
```

### Option B: Manual Build + Deploy

```bash
cd web
pnpm build
# Upload dist/ to your hosting provider
```

### Verify Frontend is Live

```bash
# Check frontend loads
curl https://your-frontend-url.com

# Check API connection (view Network tab in browser)
# Visit: https://your-frontend-url.com/host
# Expected: Dashboard loads, no console errors
```

**✅ Frontend Deploy Complete** — Proceed to smoke test immediately.

---

## Step 4: Post-Deploy Smoke Test (MUST DO)

**Time Required:** 10 minutes  
**Run immediately after deploy to catch regressions**

### API Checks (Fast)

Run the automated smoke test script:

```bash
cd backend
node scripts/post-deploy-smoke.js
```

Expected output:
```
✅ Hotel onboarding → UNDER_REVIEW
✅ Admin reject → REJECTED (reason captured)
✅ Resubmit → UNDER_REVIEW (reason cleared)
✅ Admin approve → APPROVED
✅ Publish under review → 403 with Request ID
✅ Publish after approval → 200 OK
✅ Tour operator → same flow passes
```

### UI Checks (5 Minutes Manual QA)

Open production site in browser:

1. **Home Page**
   - ✅ Visit `/` → page loads
   - ✅ Click "Become a Partner" → modal opens
   - ✅ Select "List a Hotel" → redirects to onboarding

2. **Partner Dashboard**
   - ✅ Visit `/host` → PartnerStatusBanner shows
   - ✅ Check status: UNDER_REVIEW → "Pending Admin" badge
   - ✅ Check status: APPROVED → "Ready to Publish" badge
   - ✅ Check status: REJECTED → "Can Resubmit" badge + reason shown

3. **Error Toast**
   - ✅ Trigger error (e.g., publish under review)
   - ✅ ErrorToast shows with Request ID
   - ✅ Click "Copy" → requestId copied to clipboard
   - ✅ Paste into terminal → format is valid UUID

4. **Dashboard Switcher**
   - ✅ Traveler sees only travel options
   - ✅ Host sees "Switch to Travel" + "Switch to Operator"
   - ✅ Operator sees "Switch to Travel" + "Switch to Hotel"
   - ✅ Switcher navigation works (no 404s)

5. **Mobile Layout**
   - ✅ Open DevTools → toggle mobile view (375px width)
   - ✅ PartnerStatusBanner stacks vertically (no overflow)
   - ✅ ErrorToast fits screen (no horizontal scroll)
   - ✅ Status badge readable on small screen

### Backend Log Verification

```bash
# Check structured logging is working
docker logs tripavail_backend --tail 100 | grep '"type":"request"' | head -5

# Expected: JSON logs with all required fields
# {"level":"info","type":"request","requestId":"uuid","userId":"user-id","method":"POST","route":"/v1/...","timestamp":"..."}

# Check error logging
docker logs tripavail_backend --tail 100 | grep '"type":"exception"' | head -5

# Expected: JSON logs with exception details
# {"level":"warn","type":"exception","requestId":"uuid","userId":"user-id","statusCode":403,"message":"...","timestamp":"..."}
```

**If any check fails:** Immediately roll back and investigate. Do NOT proceed.

---

## Step 5: Monitor Production (First 30 Minutes)

### Watch for Issues

```bash
# Monitor backend logs in real-time
docker logs -f tripavail_backend

# Watch for:
# ✅ All logs are JSON-formatted
# ✅ Every request has requestId
# ✅ No 500 errors (unless expected)
# ✅ No "unknown" requestId values
```

### Check Error Rates

```bash
# Count 4xx errors (should be low)
docker logs tripavail_backend --since 30m | grep '"statusCode":4' | wc -l

# Count 5xx errors (should be ZERO in first 30 min)
docker logs tripavail_backend --since 30m | grep '"statusCode":5' | wc -l
```

### Spot Check Support Workflow

1. Trigger an error (e.g., invalid login)
2. Copy requestId from ErrorToast
3. Grep backend logs: `docker logs tripavail_backend | grep "uuid-here"`
4. Verify you can see full request/response context in < 5 seconds

**✅ If support workflow works, deploy is successful.**

---

## Rollback Plan (If Issues Detected)

### Backend Rollback

```bash
# Docker: revert to previous image
docker compose up -d backend:previous-tag

# Render: click "Rollback" in dashboard
```

### Frontend Rollback

```bash
# Vercel: click "Rollback" on previous deployment
# Manual: re-upload previous dist/ folder
```

### Post-Rollback Actions

1. Document what failed in issue tracker
2. Fix on feature branch
3. Re-run pre-deploy sanity checks
4. Redeploy following same steps

---

## Success Criteria

✅ All smoke tests pass  
✅ PartnerStatusBanner shows correct statuses  
✅ ErrorToast displays requestId with copy button  
✅ Structured logs contain requestId/userId/route/statusCode  
✅ Publish gate blocks non-approved providers (403)  
✅ No 500 errors in first 30 minutes  
✅ Mobile layout responsive (no overflow)  

**If all criteria met: Deploy is successful. Monitor for 24 hours.**

---

## Next Steps (After Deploy Stabilizes)

1. **Set up staging environment** (prevents future regressions)
2. **Add CI gate** (auto-run smoke tests before prod deploy)
3. **Enable real payments** (Phase 2 work)

See: [STAGING_SETUP.md](STAGING_SETUP.md) for next steps.

---

**Deploy with confidence.** 🚀
