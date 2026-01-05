# Option A - QUICK START

## 1. Submit Support Request (5 minutes)

### Go Here:

https://dashboard.render.com/settings

### Find Support Section:

Scroll down → Click **Contact Support**

### Copy This EXACT Message:

```
Subject: Rate Limit Increase - tripavailweb Infrastructure Automation

Hi Render Support,

We're implementing IaC for TripAvail (travel marketplace) and hitting
API rate limits during initial service provisioning.

Workspace: tea-d5dui6uuk2gs7398e1ig
Current issue: HTTP 429 on POST /v1/services (20/hour limit)

Request: Increase POST /v1/services from 20/hour → 100/hour for this week
while we complete infrastructure automation.

We'll use exponential backoff + Ratelimit-Reset headers in our retry logic.

Thank you!
```

### Click Send

---

## 2. Wait for Approval

**Timeline:** Usually 24-48 hours  
**Your contact:** They'll email you at tripavail92@gmail.com

---

## 3. Once Approved - Run This Script

Copy & run in terminal:

```powershell
cd d:\tripavailweb
D:/tripavailweb/.venv/Scripts/python.exe deploy-render-smart-retry.py
```

Script will:

- ✅ Create frontend service
- ✅ Handle rate limiting automatically
- ✅ Retry if needed
- ✅ Report status

---

## 4. Monitor & Test

After script finishes:

1. Open: https://dashboard.render.com
2. Check **Services** tab
3. Wait for both to show **Live** (green, ~10 min)
4. Open `tripavail-backend` → **Shell** tab
5. Run: `npm run migration:run`
6. Test: https://tripavail-web.onrender.com/traveler/discovery

---

## What Happens Right Now

- ✅ Python script ready (deploy-render-smart-retry.py)
- ✅ Support request template (copy-paste above)
- ⏳ Waiting on your support request submission
- ⏳ Waiting on Render approval (24-48 hrs)
- ⏳ Then: Run script → Services live in 10 min

---

## Key Points

- **No automation possible until Render approves** (they control the rate limits)
- **Once approved, everything is automated** (script handles retries)
- **You'll get email when approved** (check tripavail92@gmail.com)
- **Then just run one command** (the Python script)

---

## Next Action RIGHT NOW

1. Go to: https://dashboard.render.com/settings
2. Click: Contact Support
3. Paste the message above
4. Click: Submit

Then come back here once Render approves (24-48 hrs) and I'll help you run the script!
