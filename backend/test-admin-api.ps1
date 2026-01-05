# Test Admin Panel API
$BASE_URL = "http://localhost:4100/v1"

Write-Host "🧪 Testing Admin Panel API`n" -ForegroundColor Cyan

# Step 1: Send OTP
Write-Host "1️⃣ Sending OTP..." -ForegroundColor Yellow
$otpBody = @{
    channel = "email"
    email = "admin@tripavail.com"
    purpose = "login"
} | ConvertTo-Json

try {
    $otpResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/start" -Method POST -Body $otpBody -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ OTP sent to email" -ForegroundColor Green
    Write-Host "   OTP Code: $($otpResponse.code)" -ForegroundColor Cyan
    $otpCode = $otpResponse.code
} catch {
    Write-Host "❌ Failed to send OTP: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Verify OTP and login
Write-Host "`n2️⃣ Logging in with OTP..." -ForegroundColor Yellow
$loginBody = @{
    channel = "email"
    email = "admin@tripavail.com"
    code = $otpCode
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/verify" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $token = $loginResponse.accessToken
    $user = $loginResponse.user
    Write-Host "✅ Logged in as: $($user.email) | Role: $($user.role)" -ForegroundColor Green
    
    if ($user.role -ne "ADMIN") {
        Write-Host "❌ User is not an admin!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# Step 3: Test Dashboard
Write-Host "`n3️⃣ Testing GET /admin/dashboard..." -ForegroundColor Yellow
try {
    $dashboardResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/dashboard" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Dashboard stats:" -ForegroundColor Green
    Write-Host "   Users: $($dashboardResponse.totalUsers)"
    Write-Host "   Providers: $($dashboardResponse.totalProviders)"
    Write-Host "   Bookings: $($dashboardResponse.totalBookings)"
    Write-Host "   Revenue: $$($dashboardResponse.revenue)"
    Write-Host "   Open Disputes: $($dashboardResponse.openDisputes)"
} catch {
    Write-Host "❌ Dashboard failed: $_" -ForegroundColor Red
}

# Step 4: Test Users endpoint
Write-Host "`n4️⃣ Testing GET /admin/users..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/users" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Total users: $($usersResponse.count)" -ForegroundColor Green
    Write-Host "   Sample users:" ($usersResponse.users | Select-Object -First 2 | ConvertTo-Json -Compress)
} catch {
    Write-Host "❌ Users endpoint failed: $_" -ForegroundColor Red
}

# Step 5: Test Providers endpoint
Write-Host "`n5️⃣ Testing GET /admin/providers..." -ForegroundColor Yellow
try {
    $providersResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/providers" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Total providers: $($providersResponse.count)" -ForegroundColor Green
    if ($providersResponse.count -gt 0) {
        Write-Host "   Sample provider:" ($providersResponse.providers | Select-Object -First 1 | ConvertTo-Json -Compress)
    }
} catch {
    Write-Host "❌ Providers endpoint failed: $_" -ForegroundColor Red
}

# Step 6: Test Audit Logs
Write-Host "`n6️⃣ Testing GET /admin/audit-logs..." -ForegroundColor Yellow
try {
    $auditResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/audit-logs?limit=5" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Audit logs count: $($auditResponse.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Audit logs failed: $_" -ForegroundColor Red
}

# Step 7: Test KYC Pending Documents
Write-Host "`n7️⃣ Testing GET /admin/kyc/pending..." -ForegroundColor Yellow
try {
    $kycResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/kyc/pending" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Pending KYC documents: $($kycResponse.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ KYC endpoint failed: $_" -ForegroundColor Red
}

# Step 8: Test Pending Providers
Write-Host "`n8️⃣ Testing GET /admin/providers/pending..." -ForegroundColor Yellow
try {
    $pendingResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/providers/pending" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Pending providers: $($pendingResponse.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Pending providers failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ All admin API tests completed!" -ForegroundColor Green
Write-Host "`nAdmin Token (save this):" -ForegroundColor Cyan
Write-Host $token -ForegroundColor White
