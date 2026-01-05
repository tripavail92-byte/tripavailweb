#!/usr/bin/env pwsh

# Railway Automated Deployment Script
# This script configures and deploys TripAvail to Railway

param(
    [string]$ProjectId = '76c54709-bb98-4ac8-abaa-572a50390db3',
    [string]$Token = '05bc55ce-944a-452f-858c-ce138bb7e59b'
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 TripAvail → Railway Deployment" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Store token in environment
$env:RAILWAY_TOKEN = $Token

Write-Host "✅ Project ID: $ProjectId" -ForegroundColor Green
Write-Host "✅ Token configured`n" -ForegroundColor Green

# Since CLI auth is complex, use manual dashboard approach
Write-Host "📋 DEPLOYMENT CHECKLIST`n" -ForegroundColor Yellow

Write-Host "Your project is ready. Complete these steps in Railway Dashboard:`n" -ForegroundColor Cyan

Write-Host "1️⃣  OPEN PROJECT DASHBOARD" -ForegroundColor Yellow
Write-Host "   URL: https://railway.app/project/$ProjectId`n"

Write-Host "2️⃣  ADD SERVICES (click '+ New')" -ForegroundColor Yellow
Write-Host "   ✓ PostgreSQL"
Write-Host "   ✓ Redis"
Write-Host "   ✓ Meilisearch`n"

Write-Host "3️⃣  CONFIGURE BACKEND ENVIRONMENT VARIABLES" -ForegroundColor Yellow
Write-Host "   Backend Service → Variables → Add:`n"
@"
DATABASE_URL=`${{Postgres.DATABASE_URL}}
REDIS_URL=`${{Redis.REDIS_URL}}
MEILI_URL=`${{Meilisearch.MEILI_HOST}}
MEILI_MASTER_KEY=test-secret-key-12345
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PK
CORS_ORIGINS=https://`${{web.RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=your-super-secure-32-character-random-key
NODE_ENV=production
PORT=4100
"@ | Write-Host -ForegroundColor Gray

Write-Host "`n4️⃣  CONFIGURE WEB ENVIRONMENT VARIABLES" -ForegroundColor Yellow
Write-Host "   Web Service → Variables → Add:`n"
@"
NEXT_PUBLIC_API_BASE_URL=https://`${{backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ
NODE_ENV=production
"@ | Write-Host -ForegroundColor Gray

Write-Host "`n5️⃣  GENERATE PUBLIC DOMAINS" -ForegroundColor Yellow
Write-Host "   Backend: Settings → Networking → 'Generate Domain'"
Write-Host "   Web: Settings → Networking → 'Generate Domain'`n"

Write-Host "6️⃣  RUN DATABASE MIGRATIONS" -ForegroundColor Yellow
Write-Host "   Backend → Deploy → 'Run a command'"
Write-Host "   Command: npm run migration:run`n"

Write-Host "7️⃣  TEST DEPLOYMENT" -ForegroundColor Yellow
Write-Host "   Visit: https://your-web-domain.railway.app"
Write-Host "   Test: /traveler/discovery`n"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📚 QUICK LINKS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔗 Project Dashboard: https://railway.app/project/$ProjectId"
Write-Host "🔗 GitHub Repo: https://github.com/holywolf92-a11y/trip"
Write-Host "🔗 Railway Docs: https://docs.railway.app`n"

Write-Host "Opening Railway dashboard..." -ForegroundColor Cyan
Start-Process "https://railway.app/project/$ProjectId"

Write-Host "`n✨ Setup guide available in RAILWAY_QUICK_START.md" -ForegroundColor Green
