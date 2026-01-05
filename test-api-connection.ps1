# Test API Connection Script
# Tests if the backend API at 127.0.0.1:4100 is responding

Write-Host "Testing TripAvail API Connection..." -ForegroundColor Cyan
Write-Host ""

# Check if port is listening
Write-Host "1. Checking if port 4100 is listening..." -ForegroundColor Yellow
$netstat = netstat -ano | findstr ":4101.*LISTENING"
if ($netstat) {
    Write-Host "✅ Port 4101 is LISTENING" -ForegroundColor Green
    Write-Host $netstat
} else {
    Write-Host "❌ Port 4101 is NOT listening" -ForegroundColor Red
    Write-Host "Start the backend with: cd backend; npx @nestjs/cli start --watch"
    exit 1
}

Write-Host ""
Write-Host "2. Testing TCP connection..." -ForegroundColor Yellow
$tcpTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 4101 -WarningAction SilentlyContinue
if ($tcpTest.TcpTestSucceeded) {
    Write-Host "✅ TCP connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ TCP connection failed - Windows Firewall may be blocking" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testing HTTP endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4101/v1/health" -Method Get -TimeoutSec 5
    Write-Host "✅ API is responding!" -ForegroundColor Green
    Write-Host "Response:" $response | ConvertTo-Json
} catch {
    Write-Host "❌ API is not responding" -ForegroundColor Red
    Write-Host "Error:" $_.Exception.Message
}

Write-Host ""
Write-Host "=" * 60
Write-Host "If TCP connection fails but port is listening, run as Admin:" -ForegroundColor Cyan
Write-Host 'New-NetFirewallRule -DisplayName "TripAvail API" -Direction Inbound -LocalPort 4101 -Protocol TCP -Action Allow'
Write-Host "=" * 60
