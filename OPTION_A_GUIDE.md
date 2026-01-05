# Option A - Rate Limit Increase & REST API Automation

## Timeline

**Step 1 (Now):** Submit support request to Render (~5 min)  
**Step 2 (24-48 hrs):** Render approves and increases limits  
**Step 3:** Run automated deployment script (~10 min)  
**Step 4:** Monitor services going live (~5-10 min)  

**Total for deployment:** ~1 hour (mostly waiting for Render support + build times)

---

## Step 1: Submit Support Request

### Via Render Dashboard:
1. Open: https://dashboard.render.com
2. Click your profile (bottom left) → **Settings**
3. Scroll to **Support** → **Contact Support**
4. Create new ticket with subject:
   ```
   Rate Limit Increase Request - tripavailweb Infrastructure Automation
   ```

### Message Template:

Copy-paste this and customize with your details:

```
Hi Render Support,

We're implementing Infrastructure-as-Code for our TripAvail travel marketplace 
using your REST API. We're hitting rate limits during initial service provisioning.

Workspace: tea-d5dui6uuk2gs7398e1ig
Repository: https://github.com/tripavail92-byte/tripavailweb

Current Issue:
- POST /v1/services limited to 20/hour
- Need to create: frontend service + postgres database
- Getting HTTP 429 (rate limit exceeded) errors

Request:
Can you increase POST /v1/services limit from 20/hour to 100/hour temporarily 
(for this week) while we complete infrastructure automation?

This is for initial one-time setup only. We'll use exponential backoff + jitter 
and respect Ratelimit-Reset headers in our retry logic.

Thank you!
```

### What Render Will Ask:
- ✓ Workspace ID (we have it)
- ✓ Service IDs (we have them)
- ✓ Reason for increase (IaC automation)
- ✓ Endpoints affected (POST /v1/services)

---

## Step 2: Wait for Approval

**Timeline:** Usually 24-48 hours  
**Approval Rate:** Very high for legitimate IaC use cases  

Render will reply with:
- ✅ New rate limit confirmed
- ✅ When it takes effect (usually immediate)
- ℹ️ Recommendations for retry logic

---

## Step 3: Run Automated Deployment (Once Approved)

### What the Script Does:

File: **deploy-render-smart-retry.py**

Features:
- ✅ Exponential backoff (2^retry * 1s + jitter)
- ✅ Respects `Ratelimit-Reset` header
- ✅ Automatic retry on 429 errors
- ✅ Creates both services with proper linking
- ✅ Detailed logging

### Run It:

```bash
cd d:\tripavailweb
python deploy-render-smart-retry.py
```

Or with Python environment:

```bash
D:/tripavailweb/.venv/Scripts/python.exe deploy-render-smart-retry.py
```

### Expected Output:

```
TripAvail Render Deployment - REST API with Smart Retry

Fetching existing services...
Found 1 existing service(s):
  - tripavail-backend (srv-d5dv1pu3jp1c73f54950)

============================================================
Creating Service: tripavail-web
============================================================
Root Directory: web
Environment Variables: 3

[Attempt 1/5] POST /services
✓ SUCCESS (HTTP 201)
✓ Service created: srv-xxxxx

============================================================
DEPLOYMENT SUMMARY
============================================================
✓ Frontend Service: srv-xxxxx
  URL: https://tripavail-web.onrender.com

Next Steps:
1. Monitor builds: https://dashboard.render.com
2. Once services go Live, run migrations via Shell
3. Test: https://tripavail-web.onrender.com/traveler/discovery
```

---

## Step 4: Monitor & Test

### After script runs:

1. **Check Dashboard:** https://dashboard.render.com
2. **Services Tab:** Both should appear
   - `tripavail-backend` (from earlier)
   - `tripavail-web` (just created)
3. **Wait for Live Status:** 5-10 minutes
4. **Check Logs:** Click service → Logs tab
5. **Run Migrations:**
   - Open `tripavail-backend` → Shell
   - Run: `npm run migration:run`
6. **Test URL:**
   - Visit: https://tripavail-web.onrender.com/traveler/discovery

---

## Retry Logic (How It Works)

If you get rate limited during the script:

```
[Attempt 1/5] POST /services
⚠ Rate limited (429)
  Rate limit resets in 42.3 seconds (from header)
  Waiting 42.5s before retry...

[Attempt 2/5] POST /services
✓ SUCCESS (HTTP 201)
```

**The script:**
- ✅ Reads `Ratelimit-Reset` header
- ✅ Waits exactly that long (+ jitter)
- ✅ Retries automatically (up to 5 times)
- ✅ No manual intervention needed

---

## If Render Denies the Increase

If for some reason Render won't increase limits:

**Fallback:** Use the Blueprint approach instead
- Go to Dashboard → New → Blueprint
- Select your repo
- Click Apply
- Everything deploys in 10 minutes (no API rate limits)

---

## Files Created for Option A

- **RENDER_SUPPORT_REQUEST.md** - Template for support request
- **deploy-render-smart-retry.py** - Smart retry script with exponential backoff
- **This file** - Step-by-step guide

---

## Why Option A is Better (If Approved)

| Aspect | Blueprint (C) | REST API (A) |
|--------|---|---|
| **Automation** | Dashboard clicks | Full CLI automation |
| **Future Updates** | Git-driven | API-driven |
| **CI/CD Integration** | Limited | Full control |
| **Learning Curve** | Simple | Intermediate |
| **Setup Time** | 3 clicks | ~2 hours (support wait) |

Option A gives you full programmatic control for future CI/CD pipelines.

---

## Next Action

1. **Go to:** https://dashboard.render.com/settings
2. **Click:** Contact Support
3. **Submit:** The request template from Step 1 above
4. **Wait:** 24-48 hours for approval
5. **Run:** `python deploy-render-smart-retry.py` once approved

**Questions?** Check the script comments or reach out to Render support.

