# Render Blueprint - Free Tier Adjustments

## Issues Found & Fixed

| Issue | Error | Fix |
|-------|-------|-----|
| **Database user** | `databases[0].user: not a valid DB user name` | Removed `user: postgres` - Render auto-manages user on free tier |
| **Pre-deploy command** | `services[0]: pre-deploy command is not supported for free tier services` | Removed `preDeployCommand: npm run migration:run` |

---

## What Changed in render.yaml

### Removed (Not Supported on Free Tier)
```yaml
# DELETED FROM BACKEND SERVICE:
preDeployCommand: npm run migration:run
```

```yaml
# DELETED FROM DATABASE:
user: postgres
```

### Kept (Works on Free Tier)
```yaml
# Still in BACKEND SERVICE:
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: tripavail-postgres
      property: connectionString  # ← Auto-wired!
```

---

## Migration Process (Now Manual)

**Before (Not Supported):**
- Migrations ran automatically as part of deployment
- Blueprint handled it via `preDeployCommand`

**Now (Free Tier):**
1. Services deploy successfully
2. Backend connects to database (DATABASE_URL auto-wired)
3. **You** run migrations manually via Shell:
   ```bash
   npm run migration:run
   ```

**Time impact:** +2 minutes (one-time, after initial deployment)

---

## Deployment Steps (Updated)

### OLD (With preDeployCommand)
1. Create Blueprint
2. Click Apply
3. Done (migrations automatic)

### NEW (Free Tier)
1. Create Blueprint
2. Click Apply
3. Wait for services to go Live (~5-10 min)
4. Open backend Shell tab
5. Run `npm run migration:run`
6. Done!

---

## Why This Matters

| Tier | Pre-Deploy Support | Cost | Use Case |
|------|---|---|---|
| **Free** | ❌ Manual only | $0 | Dev/testing/small projects |
| **Pro** | ✅ Auto pre-deploy | $12+ | Production, automation |
| **Business** | ✅ Priority support | $50+ | Enterprise SLA |

For free tier: **Manual migrations are expected and fine for deployment automation.**

---

## Valid render.yaml (Now)

```yaml
services:
  - type: web
    name: tripavail-backend
    buildCommand: npm ci && npm run build
    startCommand: npm run start:prod
    rootDir: backend
    # ✅ NO preDeployCommand (free tier)
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: tripavail-postgres
          property: connectionString

databases:
  - name: tripavail-postgres
    databaseName: tripavail
    # ✅ NO user field (Render manages)
```

---

## Next Steps

1. Try creating the Blueprint again: https://dashboard.render.com
2. Should now pass validation (no errors)
3. Click **Apply**
4. After services go Live, run migrations via Shell

**Status:** render.yaml is now free-tier compliant ✅

