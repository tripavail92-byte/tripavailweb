# Render.com API Deployment Script - Fixed for PowerShell syntax
param()

$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$ownerId = 'tea-d5dui6uuk2gs7398e1ig'
$repoUrl = 'https://github.com/tripavail92-byte/tripavailweb.git'
$branch = 'main'

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

function Deploy-Service {
    param(
        [string]$Name,
        [string]$RootDir,
        [hashtable]$EnvVars,
        [string]$BuildCmd,
        [string]$StartCmd
    )
    
    # Build environment variables array
    $envArray = @()
    foreach ($key in $EnvVars.Keys) {
        $envArray += @{ key = $key; value = $EnvVars[$key] }
    }
    
    # Create payload using hashtable, then convert to JSON
    $payload = @{
        ownerId = $ownerId
        name = $Name
        type = "web_service"
        plan = "free"
        runtime = "node"
        repo = $repoUrl
        branch = $branch
        serviceDetails = @{
            envSpecificDetails = @{
                nodeEnvSpecificDetails = @{
                    buildCommand = $BuildCmd
                    startCommand = $StartCmd
                }
            }
            rootDir = $RootDir
        }
        envVars = $envArray
    } | ConvertTo-Json -Depth 10
    
    Write-Host "Deploying $Name..." -ForegroundColor Cyan
    Write-Host "Payload:" -ForegroundColor Yellow
    Write-Host $payload
    Write-Host ""
    
    try {
        $response = Invoke-RestMethod `
            -Uri 'https://api.render.com/v1/services' `
            -Method POST `
            -Headers $headers `
            -Body $payload `
            -ContentType 'application/json' `
            -TimeoutSec 30
        
        Write-Host "SUCCESS - $Name deployed!" -ForegroundColor Green
        Write-Host "Service ID: $($response.id)" -ForegroundColor Green
        Write-Host "Status: $($response.status)" -ForegroundColor Green
        if ($response.serviceDetails.url) {
            Write-Host "URL: $($response.serviceDetails.url)" -ForegroundColor Green
        }
        return $response.id
    }
    catch {
        Write-Host "ERROR deploying $Name" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
            
            try {
                $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                $reader.Dispose()
                Write-Host "Response Body:" -ForegroundColor Red
                Write-Host "$responseBody" -ForegroundColor Red
            }
            catch {
                Write-Host "Could not read error response" -ForegroundColor Red
            }
        }
        else {
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host "TRIPAVAIL RENDER DEPLOYMENT" -ForegroundColor White
Write-Host "=============================" -ForegroundColor White
Write-Host ""

# Deploy Backend
Write-Host "STEP 1: DEPLOYING BACKEND" -ForegroundColor Cyan
Write-Host ""

$backendId = Deploy-Service `
    -Name "tripavail-backend" `
    -RootDir "backend" `
    -EnvVars @{
        "NODE_ENV" = "production"
        "PORT" = "4100"
    } `
    -BuildCmd "npm ci && npm run build" `
    -StartCmd "npm run start:prod"

Write-Host ""
Write-Host "STEP 2: DEPLOYING FRONTEND" -ForegroundColor Cyan
Write-Host ""

# Deploy Frontend
$frontendId = Deploy-Service `
    -Name "tripavail-web" `
    -RootDir "web" `
    -EnvVars @{
        "NODE_ENV" = "production"
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" = "AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ"
    } `
    -BuildCmd "npm ci && npm run build" `
    -StartCmd "npm start"

Write-Host ""
Write-Host "=============================" -ForegroundColor White
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor White
Write-Host "=============================" -ForegroundColor White

if ($backendId) {
    Write-Host "Backend Service ID: $backendId" -ForegroundColor Green
}
else {
    Write-Host "Backend deployment failed" -ForegroundColor Red
}

if ($frontendId) {
    Write-Host "Frontend Service ID: $frontendId" -ForegroundColor Green
}
else {
    Write-Host "Frontend deployment failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "NEXT:" -ForegroundColor Yellow
Write-Host "1. Monitor builds at https://dashboard.render.com"
Write-Host "2. Create PostgreSQL database in Render"
Write-Host "3. Link database to backend"
Write-Host ""
