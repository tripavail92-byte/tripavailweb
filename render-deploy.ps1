#!/usr/bin/env pwsh

$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$ownerId = 'tea-d5dui6uuk2gs7398e1ig'
$baseUrl = 'https://api.render.com/v1'

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

Write-Host "TripAvail - Render Deployment" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "`n1. Creating PostgreSQL Database..." -ForegroundColor Yellow

$dbPayload = @{
    ownerId = $ownerId
    name = "tripavail-postgres"
    type = "pserv"
    plan = "free"
} | ConvertTo-Json

try {
    $dbResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $dbPayload
    $dbId = $dbResponse.id
    Write-Host "SUCCESS: Database ID = $dbId" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Response.Content | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "FAILED: $errorMsg" -ForegroundColor Red
}

Write-Host "`n2. Creating Backend Service..." -ForegroundColor Yellow

$buildCmd = 'npm ci && npm run build'
$startCmd = 'npm run start:prod'

$backendPayload = @{
    ownerId = $ownerId
    name = "tripavail-backend"
    type = "web_service"
    plan = "free"
    runtime = "node"
    repo = "https://github.com/holywolf92-a11y/trip.git"
    branch = "main"
    serviceDetails = @{
        env = "node"
        buildCommand = $buildCmd
        startCommand = $startCmd
        rootDir = "backend"
    }
    envVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "PORT"; value = "4100" }
        @{ key = "DATABASE_URL"; value = "`${{tripavail-postgres.DATABASE_URL}}" }
    )
} | ConvertTo-Json -Depth 10

try {
    $backendResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $backendPayload
    $backendId = $backendResponse.id
    Write-Host "SUCCESS: Backend ID = $backendId" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Response.Content | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "FAILED: $errorMsg" -ForegroundColor Red
}

Write-Host "`n3. Creating Frontend Service..." -ForegroundColor Yellow

$webPayload = @{
    ownerId = $ownerId
    name = "tripavail-web"
    type = "web_service"
    plan = "free"
    runtime = "node"
    repo = "https://github.com/holywolf92-a11y/trip.git"
    branch = "main"
    serviceDetails = @{
        env = "node"
        buildCommand = 'npm ci && npm run build'
        startCommand = 'npm start'
        rootDir = "web"
    }
    envVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "NEXT_PUBLIC_API_BASE_URL"; value = "`${{tripavail-backend.RENDER_EXTERNAL_URL}}" }
        @{ key = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"; value = "AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ" }
    )
} | ConvertTo-Json -Depth 10

try {
    $webResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $webPayload
    $webId = $webResponse.id
    Write-Host "SUCCESS: Web ID = $webId" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Response.Content | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "FAILED: $errorMsg" -ForegroundColor Red
}

Write-Host "`n=============================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT INITIATED" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "`nGo to: https://dashboard.render.com" -ForegroundColor Yellow
Write-Host "Check build logs for each service" -ForegroundColor Yellow
