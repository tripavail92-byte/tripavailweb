#!/usr/bin/env pwsh
# TripAvail E2E Test Suite

$ApiBase = "https://tripavailweb.onrender.com/v1"
$FrontendBase = "https://tripavailweb-web-2ojm.vercel.app"

Write-Host "`nTripAvail E2E Test Suite`n" -ForegroundColor Cyan

function Test-AuthSignup {
    Write-Host "`n2️⃣  User Signup (OTP)" -ForegroundColor Cyan
    try {
        $body = @{
            phoneOrEmail = "traveler_$(Get-Random)@test.com"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$ApiBase/auth/send-otp" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing
        Write-Host "   ✅ OTP sent" -ForegroundColor Green
        return $response.Content | ConvertFrom-Json
    } catch {
        Write-Host "   ⚠️  Auth error: $($_.Exception.Message.Substring(0, 50))" -ForegroundColor Yellow
        return $null
    }
}

function Test-StaysEndpoint {
    Write-Host "`n3️⃣  Browse Stays" -ForegroundColor Cyan
    try {
        $stays = Invoke-WebRequest -Uri "$ApiBase/stays" -TimeoutSec 10 -UseBasicParsing
        $data = $stays.Content | ConvertFrom-Json
        Write-Host "   ✅ Stays API working" -ForegroundColor Green
        Write-Host "   📊 Response type: $($data.GetType().Name)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "   ⚠️  Stays API: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        return $false
    }
}

function Test-HotelPackagesEndpoint {
    Write-Host "`n4️⃣  Browse Hotel Packages" -ForegroundColor Cyan
    try {
        $pkgs = Invoke-WebRequest -Uri "$ApiBase/hotel-packages" -TimeoutSec 10 -UseBasicParsing
        $data = $pkgs.Content | ConvertFrom-Json
        Write-Host "   ✅ Hotel Packages API working" -ForegroundColor Green
        Write-Host "   📊 Response type: $($data.GetType().Name)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "   ⚠️  Packages API: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        return $false
    }
}

function Test-TourPackagesEndpoint {
    Write-Host "`n5️⃣  Browse Tour Packages" -ForegroundColor Cyan
    try {
        $tours = Invoke-WebRequest -Uri "$ApiBase/tour-packages" -TimeoutSec 10 -UseBasicParsing
        $data = $tours.Content | ConvertFrom-Json
        Write-Host "   ✅ Tour Packages API working" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ⚠️  Tours API: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        return $false
    }
}

function Test-FrontendAccess {
    Write-Host "`n6️⃣  Frontend Availability" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$FrontendBase" -TimeoutSec 10 -UseBasicParsing
        Write-Host "   ✅ Frontend home: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ Frontend error" -ForegroundColor Red
        return $false
    }
}

# Run tests
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TripAvail E2E Test Suite               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

$healthOk = Test-HealthCheck
$staysOk = Test-StaysEndpoint
$pkgOk = Test-HotelPackagesEndpoint
$tourOk = Test-TourPackagesEndpoint
$frontendOk = Test-FrontendAccess

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            TEST SUMMARY                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$allPass = $healthOk -and $staysOk -and $pkgOk -and $tourOk -and $frontendOk

if ($allPass) {
    Write-Host "✅ ALL TESTS PASSED - Ready for production!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed - Check logs above" -ForegroundColor Yellow
}

Write-Host "`n📋 Next: Run full booking flow test" -ForegroundColor Cyan
Write-Host "   1. Visit: $FrontendBase/traveler/discovery" -ForegroundColor Gray
Write-Host "   2. Sign up with email/phone" -ForegroundColor Gray
Write-Host "   3. Browse packages and create booking" -ForegroundColor Gray
Write-Host "   4. Complete payment with test card" -ForegroundColor Gray
Write-Host "`n   Test card: 4242 4242 4242 4242 (any future date, any CVC)`n" -ForegroundColor Yellow
