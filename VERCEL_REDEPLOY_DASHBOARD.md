# 🚀 Vercel Frontend Deployment via Dashboard

**Status:** CLI rate-limited (free tier) → Use Dashboard instead

**Frontend:** https://tripavailweb-web.vercel.app/

---

## Deploy via Vercel Dashboard (2 minutes)

### Step 1: Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Find: "tripavailweb-web" project
- Click to open it

### Step 2: Redeploy Latest Commit
- Look for "Deployments" tab (usually visible)
- Find the most recent deployment (should be from commit 4e26acb)
- Click the **three-dot menu** (⋮) next to it
- Select **"Redeploy"** or **"Redeploy to Production"**

### Step 3: Wait for Build
- Build will start automatically
- Watch the logs scroll (3-5 minutes)
- Wait for: ✅ "Build Complete" message
- Then: ✅ "Deployment Complete" message

### Step 4: Verify Live
Once deployed, test these URLs:

```bash
# 1. Check frontend loads
curl https://tripavailweb-web.vercel.app/ | grep -o "<title>.*</title>"
# Should return: <title>TripAvail</title>

# 2. Check host page (has PartnerStatusBanner)
curl https://tripavailweb-web.vercel.app/host --head | grep "200"
# Should return: 200

# 3. Check admin page (has ErrorToast)
curl https://tripavailweb-web.vercel.app/admin/providers --head | grep "200"
# Should return: 200
```

---

## Alternative: Use GitHub to Trigger Deploy

Vercel auto-deploys when you push to main. To force a new deploy:

```bash
# Push a dummy commit to trigger redeploy
git commit --allow-empty -m "Trigger Vercel redeploy with P0 changes"
git push origin main

# Vercel will auto-deploy within 30 seconds
# Check: https://vercel.com/dashboard → tripavailweb-web → Deployments
```

---

## What Gets Deployed

When you redeploy, these P0 changes go live:

✅ **ErrorToast.tsx** - Error display with copy-to-clipboard  
✅ **PartnerStatusBanner.tsx** - 6-state verification progress  
✅ **api-client.ts** - RequestId extraction from backend  
✅ **error-utils.ts** - Error formatting helpers  
✅ **Integration in pages** - admin/providers, host, operator layouts  

---

## Expected Result After Deploy

Users will see:

1. **On /host dashboard** → PartnerStatusBanner with 6 states:
   - 📋 Not Started
   - ⏳ In Progress
   - 📤 Submitted → "Pending Admin" badge
   - 👀 Under Review
   - ✅ Approved → "Ready to Publish" badge
   - ❌ Rejected → "Can Resubmit" badge

2. **On error** → ErrorToast with:
   - ❌ Error message
   - Request ID: abc123...
   - [Copy] button → "✓ Copied" feedback

3. **In backend logs** → RequestId in all errors:
   ```json
   {
     "requestId": "abc123...",
     "statusCode": 401,
     "message": "Invalid token"
   }
   ```

---

## Timeline

| Step | Time |
|------|------|
| Open dashboard | 1 min |
| Click "Redeploy" | 30 sec |
| Build starts | immediate |
| Build completes | 3-5 min |
| Deploy to CDN | 1 min |
| Verify live | 1 min |
| **Total** | **6-8 min** |

---

## Production Status After Deploy

```
✅ Backend (Render):  https://tripavailweb.onrender.com
✅ Frontend (Vercel): https://tripavailweb-web.vercel.app
✅ Structured Logging: Enabled
✅ RequestId Tracking: All errors include UUID
✅ PartnerStatusBanner: 6 states live
✅ ErrorToast: Copy-to-clipboard working
```

---

## Troubleshooting

**Issue:** "Build failed" in dashboard?
- Check: Deployments → Build logs tab
- Look for: TypeScript errors, missing dependencies
- Common fix: Clear node_modules cache and rebuild

**Issue:** Changes not showing after deploy?
- Browser cache: Press `Ctrl+Shift+Delete` → Clear cache
- Hard refresh: `Ctrl+Shift+R`
- Check deployment timestamp in Vercel dashboard

**Issue:** Can't find "Redeploy" button?
- Make sure you're in: Dashboard → tripavailweb-web → Deployments tab
- Look for three-dot menu (⋮) next to deployment
- Or use GitHub commit trigger (push empty commit)

---

**Do this now:** Open dashboard → tripavailweb-web → Click Redeploy → Wait for build

Then verify with:
```bash
curl https://tripavailweb-web.vercel.app/host --head
```

Should return: `200 OK` ✅
