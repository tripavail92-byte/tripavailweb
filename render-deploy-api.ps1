#!/usr/bin/env pwsh

# Render API Deployment - Correct Structure
$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$ownerId = 'tea-d5dui6uuk2gs7398e1ig'
$baseUrl = 'https://api.render.com/v1'

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

Write-Host "`n=== TripAvail → Render Deployment ===" -ForegroundColor Cyan
Write-Host "Using API Key: $($apiKey.Substring(0,10))..." -ForegroundColor Green

# 1. Create PostgreSQL Database
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
    $dbUrl = $dbResponse.createdAt
    Write-Host "✓ Database ID: $dbId" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Response.StatusCode) - $($_ | ConvertFrom-Json | Select-Object -ExpandProperty message)" -ForegroundColor Red
}

# 2. Create Backend Web Service
Write-Host "`n2. Creating Backend Web Service..." -ForegroundColor Yellow

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
        buildCommand = "npm ci `&`& npm run build"
        startCommand = "npm run start:prod"
        rootDir = "backend"
    }
    envVars = @(
        @{ 
            key = "NODE_ENV"
            value = "production"
        }
        @{ 
            key = "PORT"
            value = "4100"
        }
        @{ 
            key = "DATABASE_URL"
            value = "`${{tripavail-postgres.DATABASE_URL}}"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $backendResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $backendPayload
    $backendId = $backendResponse.id
    $backendUrl = $backendResponse.name
    Write-Host "✓ Backend ID: $backendId" -ForegroundColor Green
} catch {
    $errorMsg = $_ | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "✗ Error: $errorMsg" -ForegroundColor Red
}

# 3. Create Frontend Web Service
Write-Host "`n3. Creating Frontend Web Service..." -ForegroundColor Yellow

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
        buildCommand = "npm ci `&`& npm run build"
        startCommand = "npm start"
        rootDir = "web"
    }
    envVars = @(
        @{ 
            key = "NODE_ENV"
            value = "production"
        }
        @{ 
            key = "NEXT_PUBLIC_API_BASE_URL"
            value = "`${{tripavail-backend.RENDER_EXTERNAL_URL}}"
        }
        @{ 
            key = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
            value = "AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $webResponse = Invoke-RestMethod -Uri "$baseUrl/services" -Method POST -Headers $headers -Body $webPayload
    $webId = $webResponse.id
    $webUrl = $webResponse.name
    Write-Host "✓ Web Service ID: $webId" -ForegroundColor Green
} catch {
    $errorMsg = $_ | ConvertFrom-Json | Select-Object -ExpandProperty message
    Write-Host "✗ Error: $errorMsg" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "`nServices Created:" -ForegroundColor Green
Write-Host "  • Backend: $backendId"
Write-Host "  • Database: $dbId"
Write-Host "  • Frontend: $webId"
Write-Host "`nGo to: https://dashboard.render.com" -ForegroundColor Yellow
Write-Host "Check build status in Dashboard" -ForegroundColor Yellow
Write-Host "`nOnce deployed, run migrations:" -ForegroundColor Cyan
Write-Host "  Backend Shell -> npm run migration:run" -ForegroundColor Gray
