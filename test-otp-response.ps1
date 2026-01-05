$response = Invoke-WebRequest -Uri "http://localhost:4100/v1/auth/start" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{ channel = 'email'; email = 'test@example.com'; purpose = 'login' } | ConvertTo-Json) `
  -UseBasicParsing `
  -ErrorAction Stop

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response Content:"
Write-Host $response.Content
$data = $response.Content | ConvertFrom-Json
Write-Host "`nParsed JSON:"
Write-Host ($data | ConvertTo-Json)
