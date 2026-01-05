#!/usr/bin/env pwsh

# Render Deployment via API with SSH & Git
# Using tripavailweb/trip GitHub repo

$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$ownerId = 'tea-d5dui6uuk2gs7398e1ig'
$baseUrl = 'https://api.render.com/v1'
$githubRepo = 'https://github.com/tripavailweb/trip.git'

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

Write-Host "Render Deployment - TripAvail" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Repository: tripavailweb/trip" -ForegroundColor Green
Write-Host "Email: tripavail92@gmail.com" -ForegroundColor Green

Write-Host "`nSTEP 1: Creating PostgreSQL Database..." -ForegroundColor Yellow

# Note: Free tier databases may need manual creation in dashboard
Write-Host "INFO: Databases must be created via Render Dashboard" -ForegroundColor Yellow
Write-Host "  Visit: https://dashboard.render.com/new/database/postgres" -ForegroundColor Gray

Write-Host "`nSTEP 2: Creating Backend Web Service..." -ForegroundColor Yellow

$backendPayload = @{
    ownerId = $ownerId
    name = "tripavail-backend"
    type = "web_service"
    plan = "free"
    runtime = "node"
    repo = $githubRepo
    branch = "main"
    serviceDetails = @{
        envSpecificDetails = @{
            nodeEnvSpecificDetails = @{
                buildCommand = "npm ci && npm run build"
                startCommand = "npm run start:prod"
            }
        }
        rootDir = "backend"
    }
    envVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "PORT"; value = "4100" }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Sending API request..." -ForegroundColor Gray
    $backendResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $backendPayload
    $backendId = $backendResponse.id
    Write-Host "SUCCESS: Backend service created" -ForegroundColor Green
    Write-Host "  Service ID: $backendId" -ForegroundColor Gray
} catch {
    $error = $_ | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "INFO: $error" -ForegroundColor Yellow
    Write-Host "  This is expected if service already exists" -ForegroundColor Gray
}

Write-Host "`nSTEP 3: Creating Frontend Web Service..." -ForegroundColor Yellow

$webPayload = @{
    ownerId = $ownerId
    name = "tripavail-web"
    type = "web_service"
    plan = "free"
    runtime = "node"
    repo = $githubRepo
    branch = "main"
    serviceDetails = @{
        envSpecificDetails = @{
            nodeEnvSpecificDetails = @{
                buildCommand = "npm ci && npm run build"
                startCommand = "npm start"
            }
        }
        rootDir = "web"
    }
    envVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"; value = "AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ" }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Sending API request..." -ForegroundColor Gray
    $webResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $webPayload
    $webId = $webResponse.id
    Write-Host "SUCCESS: Frontend service created" -ForegroundColor Green
    Write-Host "  Service ID: $webId" -ForegroundColor Gray
} catch {
    $error = $_ | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "INFO: $error" -ForegroundColor Yellow
    Write-Host "  This is expected if service already exists" -ForegroundColor Gray
}

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SETUP COMPLETE" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Add SSH key to Render account" -ForegroundColor Gray
Write-Host "   URL: https://dashboard.render.com/account/ssh-keys" -ForegroundColor Gray
Write-Host "2. Add SSH key to GitHub repo" -ForegroundColor Gray
Write-Host "   URL: https://github.com/tripavailweb/trip/settings/keys" -ForegroundColor Gray
Write-Host "3. Create PostgreSQL Database in Render Dashboard" -ForegroundColor Gray
Write-Host "4. Link database to Backend service environment" -ForegroundColor Gray
Write-Host "5. Configure environment variables for both services" -ForegroundColor Gray
Write-Host "6. Run migrations: Backend Shell -> npm run migration:run" -ForegroundColor Gray

Write-Host "`nQUICK LINKS:" -ForegroundColor Cyan
Write-Host "Render Dashboard: https://dashboard.render.com" -ForegroundColor Blue
Write-Host "GitHub Repo: https://github.com/tripavailweb/trip" -ForegroundColor Blue
Write-Host "Full Guide: See RENDER_SSH_DEPLOYMENT.md" -ForegroundColor Blue
