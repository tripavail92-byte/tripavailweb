#!/usr/bin/env pwsh

# Render Full Deployment via API
$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$ownerId = 'tea-d5dui6uuk2gs7398e1ig'
$repo = 'https://github.com/tripavail92-byte/tripavailweb.git'

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TripAvail Deployment via Render API" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Step 1: Creating Backend Web Service..." -ForegroundColor Yellow

# Create backend service
$backendJson = @"
{
  "ownerId": "$ownerId",
  "name": "tripavail-backend",
  "type": "web_service",
  "plan": "free",
  "runtime": "node",
  "repo": "$repo",
  "branch": "main",
  "rootDir": "backend",
  "buildCommand": "npm ci && npm run build",
  "startCommand": "npm run start:prod",
  "envVars": [
    {"key": "NODE_ENV", "value": "production"},
    {"key": "PORT", "value": "4100"}
  ]
}
"@

try {
    $backendResp = Invoke-RestMethod -Uri 'https://api.render.com/v1/services' -Method POST -Headers $headers -Body $backendJson
    $backendId = $backendResp.id
    Write-Host "✓ Backend Created: $backendId" -ForegroundColor Green
} catch {
    Write-Host "Backend Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host "`nStep 2: Creating Frontend Web Service..." -ForegroundColor Yellow

# Create web service
$webJson = @"
{
  "ownerId": "$ownerId",
  "name": "tripavail-web",
  "type": "web_service",
  "plan": "free",
  "runtime": "node",
  "repo": "$repo",
  "branch": "main",
  "rootDir": "web",
  "buildCommand": "npm ci && npm run build",
  "startCommand": "npm start",
  "envVars": [
    {"key": "NODE_ENV", "value": "production"},
    {"key": "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "value": "AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ"}
  ]
}
"@

try {
    $webResp = Invoke-RestMethod -Uri 'https://api.render.com/v1/services' -Method POST -Headers $headers -Body $webJson
    $webId = $webResp.id
    Write-Host "✓ Web Service Created: $webId" -ForegroundColor Green
} catch {
    Write-Host "Web Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT INITIATED" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Services Created:" -ForegroundColor Yellow
Write-Host "  • Backend: $backendId" -ForegroundColor Gray
Write-Host "  • Frontend: $webId" -ForegroundColor Gray

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Go to: https://dashboard.render.com" -ForegroundColor Gray
Write-Host "2. Create PostgreSQL database" -ForegroundColor Gray
Write-Host "3. Link database to backend via Dashboard" -ForegroundColor Gray
Write-Host "4. Wait for services to build (~5 minutes)" -ForegroundColor Gray
Write-Host "5. Run migrations in backend Shell" -ForegroundColor Gray
Write-Host "`n✨ Services building in the background..." -ForegroundColor Green
