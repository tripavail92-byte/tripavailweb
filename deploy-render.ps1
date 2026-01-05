#!/usr/bin/env pwsh

# Render Deployment Script for TripAvail
$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$ownerId = 'tea-d5dui6uuk2gs7398e1ig'
$baseUrl = 'https://api.render.com/v1'

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 TripAvail → Render Deployment" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Test API connection
Write-Host "1️⃣  Testing API connection..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method GET -Headers $headers
    Write-Host "✅ API connection successful`n" -ForegroundColor Green
} catch {
    Write-Host "❌ API connection failed: $_" -ForegroundColor Red
    exit 1
}

# Create PostgreSQL database
Write-Host "2️⃣  Creating PostgreSQL database..." -ForegroundColor Yellow
$dbPayload = @{
    name = 'tripavail-postgres'
    type = 'postgres'
    plan = 'free'
    ownerId = $ownerId
} | ConvertTo-Json -Depth 10

try {
    $dbResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $dbPayload
    $dbId = $dbResponse.id
    $dbUrl = $dbResponse.databaseUrl
    Write-Host "✅ Database created: $dbId" -ForegroundColor Green
    Write-Host "   Connection URL: $dbUrl`n" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Database creation: $_`n" -ForegroundColor Yellow
}

# Create backend web service
Write-Host "3️⃣  Creating backend web service..." -ForegroundColor Yellow
$backendPayload = @{
    name = 'tripavail-backend'
    type = 'web_service'
    runtime = 'node'
    plan = 'free'
    repo = 'https://github.com/holywolf92-a11y/trip.git'
    branch = 'main'
    buildCommand = 'npm ci && npm run build'
    startCommand = 'npm run start:prod'
    rootDir = 'backend'
    ownerId = $ownerId
    envVars = @(
        @{ key = 'NODE_ENV'; value = 'production' }
        @{ key = 'PORT'; value = '4100' }
        @{ key = 'DATABASE_URL'; value = "`${{tripavail-postgres.DATABASE_URL}}" }
    )
} | ConvertTo-Json -Depth 10

try {
    $backendResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $backendPayload
    $backendId = $backendResponse.id
    $backendUrl = $backendResponse.serviceUrl
    Write-Host "✅ Backend created: $backendId" -ForegroundColor Green
    Write-Host "   Service URL: $backendUrl`n" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Backend creation: $_`n" -ForegroundColor Yellow
}

# Create frontend web service
Write-Host "4️⃣  Creating frontend web service..." -ForegroundColor Yellow
$webPayload = @{
    name = 'tripavail-web'
    type = 'web_service'
    runtime = 'node'
    plan = 'free'
    repo = 'https://github.com/holywolf92-a11y/trip.git'
    branch = 'main'
    buildCommand = 'npm ci && npm run build'
    startCommand = 'npm start'
    rootDir = 'web'
    ownerId = $ownerId
    envVars = @(
        @{ key = 'NODE_ENV'; value = 'production' }
        @{ key = 'NEXT_PUBLIC_API_BASE_URL'; value = "`${{tripavail-backend.RENDER_EXTERNAL_URL}}" }
        @{ key = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'; value = 'AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ' }
    )
} | ConvertTo-Json -Depth 10

try {
    $webResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $webPayload
    $webId = $webResponse.id
    $webUrl = $webResponse.serviceUrl
    Write-Host "✅ Frontend created: $webId" -ForegroundColor Green
    Write-Host "   Service URL: $webUrl`n" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Frontend creation: $_`n" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✨ DEPLOYMENT INITIATED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📝 NEXT STEPS:`n" -ForegroundColor Yellow
Write-Host "1. Go to: https://dashboard.render.com"
Write-Host "2. Check services building status"
Write-Host "3. Add environment variables for:"
Write-Host "   - Stripe keys"
Write-Host "   - JWT secret"
Write-Host "   - Meilisearch (if needed)"
Write-Host "4. Run migrations:"
Write-Host "   Backend → Deploy → Shell"
Write-Host "   Command: npm run migration:run`n"

Write-Host "🔗 QUICK LINKS:`n" -ForegroundColor Cyan
if ($backendUrl) {
    Write-Host "Backend: $backendUrl"
}
if ($webUrl) {
    Write-Host "Web: $webUrl"
}
Write-Host "Dashboard: https://dashboard.render.com`n"
