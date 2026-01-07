# 🚀 IMMEDIATE ACTION - Wake Production Frontend

**Current Status:** Backend ✅ Live | Frontend 🟡 Suspended  
**Time to Production:** 5 minutes

---

## What's Happening

Your frontend service on Render free tier goes to sleep after 15 minutes of inactivity. It's not broken—it just needs a "wake up" signal.

```
Frontend URL: https://tripavail-web.onrender.com
Current Status: "This service has been suspended by its owner"
Cause: Free tier auto-suspend
Solution: Restart service (5 min) OR Upgrade to paid ($7/mo)
```

---

## ✅ Option A: Restart Now (Fastest - 2 minutes)

1. **Go to Render Dashboard**
   - Open: https://dashboard.render.com
   - Log in with your credentials

2. **Find Frontend Service**
   - Click "Services" in left sidebar
   - Find "tripavail-web" in the list
   - Click to open service details

3. **Restart Service**
   - Look for "Restart service" button (right side, might say "Actions")
   - Click it
   - Wait 30-60 seconds for it to boot

4. **Verify**
   - Refresh: https://tripavail-web.onrender.com
   - Should see the app (not "suspended" message)

---

## 🔧 Option B: Use Render CLI

If you have Render CLI installed:

```bash
render restart-service tripavail-web
```

Wait 30 seconds, then:

```bash
# Verify it's live
curl https://tripavail-web.onrender.com | head -20
```

Should return HTML (not error).

---

## 💰 Option C: Permanent Fix (Upgrade to Paid - $7/month)

Free tier services suspend after 15 min inactivity. For production, you need paid tier:

1. Go to: https://dashboard.render.com/billing
2. Click "Upgrade" on tripavail-web service
3. Select **Individual - $7/month** (or higher)
4. Service will be always-on
5. Auto-redeploy next commit

**Recommended for production.** One-time setup, then automatic.

---

## 🧪 After Wake-Up: Quick Test (10 minutes)

Once frontend is running, verify end-to-end:

```bash
# 1. Check frontend loads
curl https://tripavail-web.onrender.com | grep "DOCTYPE"
# Should return HTML (not error)

# 2. Check backend still works
curl https://tripavailweb.onrender.com/v1/health
# Should return: {"status":"ok",...}

# 3. Manual test in browser
# Go to: https://tripavail-web.onrender.com
# Click "Become a Partner"
# Fill form → Submit
# Go to /host dashboard
# Should see PartnerStatusBanner
# Try to publish without approval → should show error with RequestId
# Click Copy on RequestId → verify clipboard has it
```

---

## ⚠️ What NOT to Do

❌ Don't delete the service (you'll lose the database)  
❌ Don't re-deploy from GitHub yet (not needed, just restart)  
❌ Don't change environment variables (already set)  

---

## 📞 If It Doesn't Wake Up

**Issue:** Service still shows "suspended" after 2 minutes

**Solution:**

1. Check Render logs:
   ```
   Dashboard → tripavail-web → Logs → Recent logs
   ```
   
2. Look for errors like:
   - "OutOfMemory" → Upgrade plan
   - "Build failed" → Check recent commits
   - "Port already in use" → Restart Docker process

3. If stuck:
   - Go to Settings → Delete service
   - Re-deploy from GitHub (takes 3 min)
   - Or contact Render support: support@render.com

---

## 🎯 Success Criteria

After wake-up, you should see:

```
✅ https://tripavail-web.onrender.com → Loads app (not "suspended")
✅ Backend health: https://tripavailweb.onrender.com/v1/health → 200
✅ Can click "Become a Partner" → Form appears
✅ Submit form → Gets request ID in response
✅ Dashboard shows PartnerStatusBanner → 6 states working
✅ Error messages include requestId → Can copy-to-clipboard
```

---

## 🎊 After Full Verification

Once both frontend + backend are live and tested:

1. Update README with production URLs
2. Enable Sentry for error tracking
3. Set up UptimeRobot for monitoring
4. Configure log aggregation (Papertrail recommended)
5. Plan staging environment ($14/mo)

---

## ⏱️ Timeline

| Step | Time | Action |
|------|------|--------|
| Wake frontend | 2 min | Click "Restart" on dashboard |
| Wait to boot | 1 min | Service starting... |
| Verify loads | 1 min | curl https://tripavail-web.onrender.com |
| Manual QA | 5 min | Test partner flow + error toast |
| Document | 2 min | Update README with status |
| **Total** | **11 min** | **Full production live** |

---

## 🚀 Next Commands

```bash
# After frontend wakes up, run this in terminal:

# Test frontend loads
curl https://tripavail-web.onrender.com | grep -o "<html\|<title\|<!DOCTYPE" | head -1

# Test backend still healthy
curl https://tripavailweb.onrender.com/v1/health | jq '.status'

# Test error includes requestId
curl -X POST https://tripavailweb.onrender.com/v1/admin/providers/test/approve \
  -H "Authorization: Bearer invalid" | jq '.requestId'

# All three should succeed without errors
```

---

**Do this now → 5 minutes to production ✨**

See: [PRODUCTION_NEXT_STEPS.md](PRODUCTION_NEXT_STEPS.md) for full verification checklist
