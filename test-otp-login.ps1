# Test OTP login flow

$email = "test@example.com"
$channel = "email"
$purpose = "login"

# Step 1: Start OTP
Write-Host "Starting OTP..." -ForegroundColor Cyan
$startBody = @{
    channel = $channel
    email = $email
    purpose = $purpose
} | ConvertTo-Json

$startResponse = Invoke-WebRequest -Uri "http://localhost:4100/v1/auth/start" `
    -Method Post `
    -ContentType "application/json" `
    -Body $startBody `
    -ErrorAction Stop

$startData = $startResponse.Content | ConvertFrom-Json
Write-Host "Start OTP Response: $($startData | ConvertTo-Json)" -ForegroundColor Green
$generatedCode = $startData.code
Write-Host "Generated Code: $generatedCode" -ForegroundColor Yellow

# Step 2: Verify OTP with the code from response
Write-Host "`nVerifying OTP with code: $generatedCode" -ForegroundColor Cyan
$verifyBody = @{
    channel = $channel
    email = $email
    code = $generatedCode
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-WebRequest -Uri "http://localhost:4100/v1/auth/verify" `
        -Method Post `
        -ContentType "application/json" `
        -Body $verifyBody `
        -ErrorAction Stop

    $verifyData = $verifyResponse.Content | ConvertFrom-Json
    Write-Host "Verify OTP Response: $($verifyData | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Verify OTP Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
