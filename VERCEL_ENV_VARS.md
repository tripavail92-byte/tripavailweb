# Vercel Environment Variables Checklist

## Project

- **Name:** tripavailweb-web
- **Project ID:** prj_7bLZcK514TpSkjtlzHOG5wGrSiWr
- **Root Directory:** `web`
- **Framework:** Next.js
- **Production Domain:** tripavailweb-web.vercel.app

---

## Required Environment Variables

Add these in Vercel Project Settings → Environment Variables (Production scope):

### 1. **NEXT_PUBLIC_API_BASE_URL**

- **Purpose:** Frontend → Backend API base URL
- **Example (Local Dev):** `http://localhost:4100/v1`
- **Example (Production):** `https://tripavailweb.onrender.com/v1`
- **Type:** Public (exposed to browser)
- **Status:** ✅ CRITICAL - without this, API calls will fail

### 2. **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY**

- **Purpose:** Google Maps API key for location features
- **Example:** `AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ`
- **Type:** Public (safe to expose; API key is restricted to domain)
- **Status:** ✅ CRITICAL - without this, maps will not load
- **How to get:** https://console.cloud.google.com/maps/apis

### 3. **NODE_ENV**

- **Purpose:** Build environment
- **Value:** `production`
- **Type:** Public
- **Status:** ⚠️ Usually auto-set by Vercel, but good to confirm

---

## Optional Environment Variables

### 4. **NEXTAUTH_URL** (if using NextAuth)

- **Purpose:** NextAuth redirect URI
- **Example:** `https://tripavailweb-web.vercel.app`
- **Type:** Public
- **Status:** Only needed if authentication uses NextAuth

### 5. **NEXTAUTH_SECRET** (if using NextAuth)

- **Purpose:** JWT secret for session encryption
- **Example:** Generate with `openssl rand -hex 32`
- **Type:** Secret (not exposed)
- **Status:** Only needed if authentication uses NextAuth

---

## Vercel Project Settings Checklist

- [ ] Root Directory is set to `web`
- [ ] Environment Variables section populated with required vars above
- [ ] All NEXT*PUBLIC*\* vars are in **Production** scope
- [ ] Secrets (if any) are in **Production** scope, marked as "Encrypted"
- [ ] Auto-deploy is enabled for `main` branch
- [ ] Git repository linked: `tripavail92-byte/tripavailweb`

---

## Troubleshooting Failed Deployments

If deployments show ERROR status:

1. **Check Build Logs:**
   - Vercel Dashboard → Deployments → select ERROR deployment → Build Logs
   - Look for error text containing:
     - `NEXT_PUBLIC_*` undefined
     - `Cannot find module`
     - TypeScript compilation errors

2. **Common Causes:**
   - Missing `NEXT_PUBLIC_API_BASE_URL` → API client throws at build time
   - Missing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → Maps component fails
   - TypeScript strict mode errors → fix locally, commit, redeploy

3. **How to Redeploy:**
   - **Via Dashboard (most reliable):**
     - Vercel → Deployments → select latest → "Redeploy"
   - **Via CLI:**
     ```powershell
     $Env:VERCEL_TOKEN = "<your-token>"
     npm install -g vercel
     vercel --prod --yes
     ```

---

## Current Deployment Status

As of Jan 7, 2025 @ ~22:30 UTC:

- All recent `main` deployments: ERROR
- Suspected cause: Missing or incorrect `NEXT_PUBLIC_API_BASE_URL`
- Action: Set env vars in Vercel, then redeploy

---

## How to View/Update Environment Variables

1. Go to: https://vercel.com/tripavails-projects/tripavailweb-web
2. Click: **Settings** → **Environment Variables**
3. For each required var:
   - Name: `NEXT_PUBLIC_API_BASE_URL` (example)
   - Value: `https://tripavailweb.onrender.com/v1`
   - Scope: **Production**
   - Click **Add**
4. Trigger **Redeploy** after all vars are set

---

## Quick Redeploy Command

After setting env vars in Vercel dashboard:

```powershell
# Set token in your shell (not in scripts!)
$Env:VERCEL_TOKEN = "Cg9gfOnLoQbZE6fE6uHxRT5v"

# Redeploy
npm install -g vercel
vercel --prod --yes
```

---

## Reference

- Vercel Docs: https://vercel.com/docs/projects/environment-variables
- Next.js Public Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
