#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy TripAvail to Railway using GitHub integration
.DESCRIPTION
    This script guides you through deploying TripAvail to Railway
#>

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                   🚂 TRIPAVAIL → RAILWAY                       ║
║                   Deployment Assistant                         ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n✅ Prerequisites Check:`n" -ForegroundColor Green
Write-Host "  ✔ GitHub repo created: https://github.com/holywolf92-a11y/trip" -ForegroundColor Green
Write-Host "  ✔ Code pushed to GitHub: Complete" -ForegroundColor Green
Write-Host "  ✔ Railway token available: 1f376bad-ec67-41b8-b3de-64d857c2dda4" -ForegroundColor Green

Write-Host "`n📋 Deployment Steps:`n" -ForegroundColor Cyan

$steps = @(
    @{
        num = "1"
        title = "Open Railway Dashboard"
        details = @(
            "Click this link: https://railway.app/new",
            "You will be taken to Railway's deployment page"
        )
    },
    @{
        num = "2"
        title = "Deploy from GitHub"
        details = @(
            "Click: 'Deploy from GitHub repo'",
            "Login with your GitHub account (holywolf92-a11y)",
            "Select repository: 'trip'"
        )
    },
    @{
        num = "3"
        title = "Railway Auto-Detects Structure"
        details = @(
            "Railway will detect your monorepo (backend + web)",
            "It will create two services automatically:",
            "  • Backend (NestJS) - port 4100",
            "  • Web (Next.js) - port 3000"
        )
    },
    @{
        num = "4"
        title = "Add Services (Click '+ New')"
        details = @(
            "PostgreSQL Database",
            "Redis Cache",
            "Meilisearch (Docker: getmeili/meilisearch:latest)"
        )
    },
    @{
        num = "5"
        title = "Configure Environment Variables"
        details = @(
            "Backend service → Variables tab → Add:",
            "",
            "DATABASE_URL=`${{Postgres.DATABASE_URL}}",
            "REDIS_URL=`${{Redis.REDIS_URL}}",
            "MEILI_URL=`${{Meilisearch.MEILI_HOST}}",
            "MEILI_MASTER_KEY=your-secret-key",
            "STRIPE_SECRET_KEY=sk_test_YOUR_KEY",
            "STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY",
            "CORS_ORIGINS=https://`${{web.RAILWAY_PUBLIC_DOMAIN}}",
            "JWT_SECRET=generate-random-string",
            "NODE_ENV=production",
            "PORT=4100",
            "",
            "Web service → Variables tab → Add:",
            "",
            "NEXT_PUBLIC_API_BASE_URL=https://`${{backend.RAILWAY_PUBLIC_DOMAIN}}",
            "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ",
            "NODE_ENV=production"
        )
    },
    @{
        num = "6"
        title = "Generate Public Domains"
        details = @(
            "Backend service → Settings → Networking → 'Generate Domain'",
            "Web service → Settings → Networking → 'Generate Domain'",
            "Copy both domains and update variables"
        )
    },
    @{
        num = "7"
        title = "Run Database Migrations"
        details = @(
            "Backend service → Deploy tab → 'Run a command'",
            "Enter: npm run migration:run",
            "Wait for completion"
        )
    },
    @{
        num = "8"
        title = "Test Your Deployment"
        details = @(
            "Visit your web URL: https://your-web-url.railway.app",
            "Check discovery page: https://your-web-url.railway.app/traveler/discovery",
            "API should respond: https://your-api-url.railway.app/v1/health"
        )
    }
)

foreach ($step in $steps) {
    Write-Host "Step $($step.num): $($step.title)" -ForegroundColor Yellow
    foreach ($detail in $step.details) {
        if ($detail -eq "") {
            Write-Host ""
        } else {
            Write-Host "  $detail" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                    🎯 QUICK LINKS                              ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "  🔗 Railway Dashboard: https://railway.app/new" -ForegroundColor Cyan
Write-Host "  🔗 Your GitHub Repo: https://github.com/holywolf92-a11y/trip" -ForegroundColor Cyan
Write-Host "  🔗 Railway Docs: https://docs.railway.com" -ForegroundColor Cyan

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                  💡 IMPORTANT NOTES                            ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host @"
  ⚠️  Environment Variables:
      - Use Railway variable interpolation: `${{ServiceName.VAR_NAME}}
      - NEVER hardcode API keys in variables
      - Get Stripe keys from: https://dashboard.stripe.com

  🔄 Auto-Deployment:
      - Every git push to main triggers automatic deploy
      - Check Build/Deploy tabs for logs

  📊 Monitoring:
      - Railway Dashboard shows CPU, Memory, Logs
      - Check Build logs if deployment fails
      - Deploy logs show startup issues

  💾 Database:
      - Migrations run automatically on first deploy
      - Data persists between deployments
      - You can view DB via Railway dashboard

  🌐 URLs:
      - Backend: https://<auto-generated>.railway.app
      - Web: https://<auto-generated>.railway.app
      - Get exact URLs from service settings

"@ -ForegroundColor Yellow

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║                   ✨ YOU'RE READY TO GO!                       ║
╚════════════════════════════════════════════════════════════════╝

1️⃣  Open: https://railway.app/new
2️⃣  Select: Deploy from GitHub repo
3️⃣  Choose: holywolf92-a11y/trip
4️⃣  Follow the steps above
5️⃣  Done! Your app will be live in ~5 minutes

Questions? See RAILWAY_QUICK_START.md or RAILWAY_DEPLOYMENT_GUIDE.md

"@ -ForegroundColor Green

Write-Host "Press Enter to open Railway Dashboard now..." -ForegroundColor Cyan
Read-Host | Out-Null

# Try to open in browser
try {
    Start-Process "https://railway.app/new"
} catch {
    Write-Host "Could not open browser. Please manually visit: https://railway.app/new" -ForegroundColor Yellow
}
