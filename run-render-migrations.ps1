# Run Prisma migrations on Render via SSH
# Requires: Render service has SSH enabled
# Usage: powershell .\run-render-migrations.ps1

param(
    [string]$ServiceId = "srv-d5dv1pu3jp1c73f54950"
)

Write-Host "🔄 Running Prisma migrations on Render..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: This requires Render Shell access"
Write-Host "   Method 1 (Easiest): Use Render Dashboard"
Write-Host "   Method 2 (CLI): Run command below in your terminal"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 TO RUN MIGRATIONS:"
Write-Host ""
Write-Host "Option A: Via Render Dashboard Shell (Recommended)"
Write-Host "  1. Go to: https://dashboard.render.com/web/$ServiceId"
Write-Host "  2. Click 'Shell' tab"
Write-Host "  3. Run this command:"
Write-Host ""
Write-Host "     cd /app ; pnpm prisma migrate deploy" -ForegroundColor Green
Write-Host ""
Write-Host "Option B: Via Render CLI (if installed)"
Write-Host "  render run -s $ServiceId -- pnpm prisma migrate deploy" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ After running migrations:"
Write-Host "   1. Check Render logs for success message"
Write-Host "   2. Verify your database schema: \`prisma studio\` (local)"
Write-Host "   3. Test an API endpoint to confirm DB connectivity"
Write-Host ""
Write-Host "🔗 Dashboard: https://dashboard.render.com/web/$ServiceId"
Write-Host ""
