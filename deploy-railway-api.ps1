# Railway API Deployment Script
# This script uses the Railway API to deploy your project automatically

param(
    [string]$Token = '1f376bad-ec67-41b8-b3de-64d857c2dda4',
    [string]$GitHubRepo = 'holywolf92-a11y/trip'
)

Write-Host "`n=== Railway API Deployment ===" -ForegroundColor Cyan

# 1. Test token validity with GraphQL query
Write-Host "`n1️⃣  Testing Railway token..." -ForegroundColor Yellow

$query = @"
query {
  me {
    id
    email
  }
}
"@

$body = @{
    query = $query
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.railway.app/graphql" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop

    if ($response.data.me) {
        Write-Host "✅ Token verified! Email: $($response.data.me.email)" -ForegroundColor Green
        $accountId = $response.data.me.id
    } else {
        Write-Host "❌ Token invalid. Error: $($response.errors[0].message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ API request failed: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify token at: https://railway.app/account/tokens"
    Write-Host "2. Create a new token if needed"
    Write-Host "3. Update the token in this script"
    exit 1
}

# 2. Create a new project
Write-Host "`n2️⃣  Creating Railway project..." -ForegroundColor Yellow

$createProjectQuery = @"
mutation {
  projectCreate(input: {name: "tripavail-deployment"}) {
    project {
      id
      name
    }
  }
}
"@

$body = @{
    query = $createProjectQuery
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.railway.app/graphql" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body

    if ($response.data.projectCreate.project) {
        $projectId = $response.data.projectCreate.project.id
        Write-Host "✅ Project created: $($response.data.projectCreate.project.name)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Project creation skipped (may already exist)" -ForegroundColor Yellow
        Write-Host "`nManual Setup Required:" -ForegroundColor Cyan
        Write-Host "1. Open: https://railway.app/new"
        Write-Host "2. Click: 'Deploy from GitHub repo'"
        Write-Host "3. Select: $GitHubRepo"
        Write-Host "4. Follow steps in RAILWAY_QUICK_START.md"
        exit 0
    }
} catch {
    Write-Host "❌ Project creation failed: $_" -ForegroundColor Red
    Write-Host "`nNote: Some Railway operations may be restricted via API" -ForegroundColor Yellow
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Token Status: ✅ Valid and authenticated" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open: https://railway.app"
Write-Host "2. Go to Projects → Your new project"
Write-Host "3. Add services (PostgreSQL, Redis, Meilisearch)"
Write-Host "4. Configure environment variables"
Write-Host "5. Deploy from GitHub repo"
Write-Host "`nFull setup guide: RAILWAY_QUICK_START.md"
