# Add environment variables to Render service via API
# Usage: powershell .\render-env-setup.ps1

param(
    [string]$StripeSecretKey,
    [string]$StripeWebhookSecret,
    [string]$ApiUrl = "https://api.render.com/v1/services/srv-d5dv1pu3jp1c73f54950",
    [string]$ServiceId = "srv-d5dv1pu3jp1c73f54950"
)

$renderApiKey = $env:RENDER_API_KEY
if (-not $renderApiKey) {
    Write-Error "RENDER_API_KEY environment variable not set"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $renderApiKey"
    "Content-Type" = "application/json"
}

# Prepare environment variables
$envVars = @()

if ($StripeSecretKey) {
    $envVars += @{
        key = "STRIPE_SECRET_KEY"
        value = $StripeSecretKey
    }
    Write-Host "✓ Adding STRIPE_SECRET_KEY"
}

if ($StripeWebhookSecret) {
    $envVars += @{
        key = "STRIPE_WEBHOOK_SECRET"
        value = $StripeWebhookSecret
    }
    Write-Host "✓ Adding STRIPE_WEBHOOK_SECRET"
}

# Also add these standard vars if not already there
$envVars += @{
    key = "NODE_ENV"
    value = "production"
}

$envVars += @{
    key = "LOG_LEVEL"
    value = "debug"
}

foreach ($var in $envVars) {
    $body = @{
        key = $var.key
        value = $var.value
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/env-vars" -Method POST -Headers $headers -Body $body
        Write-Host "✅ Set $($var.key)"
    } catch {
        Write-Host "⚠️ Error setting $($var.key): $($_.Exception.Message)"
    }
}

Write-Host "`n✅ Environment variables added. Now trigger a deploy:"
Write-Host "  - Go to https://dashboard.render.com/web/$ServiceId"
Write-Host "  - Click 'Manual Deploy' → 'Deploy latest commit'"
