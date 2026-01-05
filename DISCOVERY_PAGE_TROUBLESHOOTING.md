# TripAvail - Discovery Page Not Working - Troubleshooting & Fix

## Root Cause

The `/traveler/discovery` endpoint (and the entire app) is failing because **PostgreSQL database is not running**. The backend requires a PostgreSQL database on `localhost:5434` to start.

**Error:**
```
PrismaClientInitializationError: Can't reach database server at `localhost:5434`
```

## Prerequisites Check

- ✅ Next.js web server (port 3000)
- ✅ NestJS backend server (port 4100)
- ❌ PostgreSQL database (port 5434) - **NOT RUNNING**
- ❌ Redis cache (port 6379) - **NOT RUNNING** (needed for session/caching)
- ❌ Meilisearch (port 7700) - **NOT RUNNING** (needed for search)

## Solution

You have two options:

### Option 1: Docker (Recommended)

Docker provides isolated, reproducible services. All dependencies are containerized.

**Prerequisites:**
- Docker Desktop installed and running

**Steps:**

```powershell
# 1. Navigate to project root
cd d:\tripavailweb

# 2. Start all services (PostgreSQL, Redis, Meilisearch)
docker-compose up -d

# 3. Verify services are running
docker-compose ps

# 4. Run database migrations
cd backend
pnpm migration:run

# 5. Start the backend (in one terminal)
npm run dev

# 6. Start the web portal (in another terminal)
cd ../web
npm run dev
```

**Verify it works:**
```
- Backend health: http://localhost:4100/v1/health
- Web portal: http://localhost:3000
- Discovery page: http://localhost:3000/traveler/discovery
```

### Option 2: Manual Local Setup (Advanced)

If Docker is not available, install services locally:

**PostgreSQL (localhost:5434):**
```powershell
# Install PostgreSQL 16+ from https://www.postgresql.org/download/
# Create database:
psql -U postgres -c "CREATE DATABASE tripavail;"

# Verify connection
psql -h localhost -U postgres -d tripavail -c "SELECT 1;"
```

**Redis (localhost:6379):**
```powershell
# Download Redis from https://github.com/microsoftarchive/redis/releases
# Or use Windows Service installer
# Start: redis-server
```

**Meilisearch (localhost:7700):**
```powershell
# Download from https://www.meilisearch.com/downloads
# Run: meilisearch.exe
```

Then run migrations and start servers (same as Option 1 steps 4-6).

---

## Quick Diagnosis Commands

```powershell
# Check if PostgreSQL is running
netstat -ano | findstr :5434

# Check if Redis is running
netstat -ano | findstr :6379

# Check if Meilisearch is running
netstat -ano | findstr :7700

# Check if backend is running
Invoke-WebRequest -Uri http://localhost:4100/v1/health -UseBasicParsing

# Check if web portal is running
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```

---

## Database Setup Steps (Docker)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for it to be healthy (check docker-compose ps)
docker-compose ps

# Run migrations
cd backend
pnpm migration:run  # Applies all pending migrations

# Seed sample data (optional)
pnpm seed
```

---

## Common Issues & Solutions

### Issue 1: Docker not installed
**Solution:** Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

### Issue 2: Docker Desktop not running
**Solution:**
```powershell
# Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker.exe"

# Or check if it's running
Get-Process Docker -ErrorAction SilentlyContinue
```

### Issue 3: Port already in use (e.g., 5434)
```powershell
# Find process using port 5434
netstat -ano | findstr :5434

# Kill the process
Stop-Process -Id <PID> -Force

# Or use a different port in docker-compose.yml:
# ports:
#   - "5435:5432"  # Change 5434 to 5435
# And update .env: DATABASE_URL="postgresql://postgres:postgres@localhost:5435/tripavail"
```

### Issue 4: Migration fails
```powershell
# Reset database (DESTRUCTIVE - dev only!)
pnpm prisma:reset

# Or manually:
pnpm prisma:migrate dev --name init
```

---

## Architecture Overview (Services Dependency)

```
Web Portal (port 3000)
    ↓ API calls
Backend (port 4100)
    ├─ PostgreSQL (port 5434) - Data storage
    ├─ Redis (port 6379) - Session/cache
    ├─ Meilisearch (port 7700) - Full-text search
    └─ Stripe API - Payment gateway
```

All three services (Postgres, Redis, Meilisearch) must be running for the full application to work.

---

## Discovery Page Workflow

Once services are running, here's what happens:

```
1. User navigates to /traveler/discovery
   ↓
2. Next.js app loads (port 3000)
   ↓
3. Page checks authentication (requires logged-in user)
   ↓
4. Fetches hotel packages from API: GET /v1/hotel-packages?status=PUBLISHED
   ↓
5. Fetches tour packages from API: GET /v1/tour-packages?status=PUBLISHED
   ↓
6. Backend queries PostgreSQL for packages
   ↓
7. Results displayed on page with filters & search
```

**Requirements:**
- ✓ User is logged in
- ✓ Backend is running
- ✓ PostgreSQL is running
- ✓ Packages exist in database (status = PUBLISHED)

---

## Next Steps After Setup

1. **Create a test user:**
   ```bash
   curl -X POST http://localhost:4100/v1/auth/start \
     -H "Content-Type: application/json" \
     -d '{"email":"traveler@example.com"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:4100/v1/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"email":"traveler@example.com","otp":"123456"}'
   ```

3. **Create a provider & hotel package:**
   - Use the provider onboarding flow
   - Create a property
   - Create a hotel package
   - Publish it

4. **Visit discovery page:**
   - Navigate to http://localhost:3000/traveler/discovery
   - You should see the published packages

---

## Files to Check

- `.env` - Backend environment variables
- `.env.local` - Frontend environment variables
- `docker-compose.yml` - Service configurations
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/app.module.ts` - Backend module setup
- `web/.env.local` - Frontend API base URL

---

## Support

If you're still having issues:

1. Check all services are running: `docker-compose ps`
2. Check backend logs: `docker-compose logs postgres backend`
3. Test API endpoint: `curl http://localhost:4100/v1/health`
4. Clear Next.js cache: `rm -rf web/.next`
5. Reinstall dependencies: `pnpm install`

---

**Last Updated:** January 5, 2026
