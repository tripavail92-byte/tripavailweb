# Run Prisma migrations on Render
# Access Render Shell and execute the migration command

$serviceId = "srv-d5dv1pu3jp1c73f54950"
$dashboardUrl = "https://dashboard.render.com/web/$serviceId"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  RENDER DATABASE MIGRATION STEPS     " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Open Render Dashboard"
Write-Host "   $dashboardUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Step 2: Click the 'Shell' tab"
Write-Host ""
Write-Host "Step 3: Run this command:"
Write-Host "   cd /app ; pnpm prisma migrate deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "Step 4: Wait for completion and check output"
Write-Host ""
Write-Host "Step 5: Verify in your logs section"
Write-Host ""
Write-Host "Expected output:"
Write-Host "   0 migrations found in prisma/migrations" -ForegroundColor Green
Write-Host "   or"
Write-Host "   1 migration applied successfully" -ForegroundColor Green
Write-Host ""
