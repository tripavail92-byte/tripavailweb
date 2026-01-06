# Simple script to add environment variables to Render via API
# Make sure you have RENDER_API_KEY set in PowerShell

# Your Stripe credentials (fill in or ask user to provide)
$STRIPE_SECRET_KEY = "sk_test_51SlrtL2HUx7H4R6HQ6hZ3z7f8p9" # You need to provide this
$STRIPE_WEBHOOK_SECRET = "whsec_2035a7586e4459cbc065d1686bfc7ca0da07d869dd9d16c8656cc3439403d6ea"
$SERVICE_ID = "srv-d5dv1pu3jp1c73f54950"

if (-not $env:RENDER_API_KEY) {
    Write-Host "❌ RENDER_API_KEY not set in environment"
    Write-Host "Set it with: `$env:RENDER_API_KEY = 'your-key-here'"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $env:RENDER_API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "🔐 Adding Stripe credentials to Render..."
Write-Host "Service ID: $SERVICE_ID"
Write-Host ""

# Add env vars one by one
$envVars = @(
    @{ key = "STRIPE_SECRET_KEY"; value = $STRIPE_SECRET_KEY }
    @{ key = "STRIPE_WEBHOOK_SECRET"; value = $STRIPE_WEBHOOK_SECRET }
    @{ key = "NODE_ENV"; value = "production" }
    @{ key = "LOG_LEVEL"; value = "debug" }
)

foreach ($var in $envVars) {
    $body = @{
        key = $var.key
        value = $var.value
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod `
            -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
            -Method POST `
            -Headers $headers `
            -Body $body
        
        Write-Host "✅ $($var.key) → set"
    } catch {
        Write-Host "⚠️  $($var.key) → error: $($_.Exception.Message.Substring(0, 50))"
    }
}

Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "  1. Go to https://dashboard.render.com/web/$SERVICE_ID"
Write-Host "  2. Go to Environment tab and verify variables were added"
Write-Host "  3. Click 'Manual Deploy' and deploy the latest commit"
Write-Host ""
Write-Host "Note: If variables aren't showing, set them manually in dashboard"
