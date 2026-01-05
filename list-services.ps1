$apiKey = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
$h = @{'Authorization' = "Bearer $apiKey"}

$services = Invoke-RestMethod -Uri 'https://api.render.com/v1/services' -Headers $h

foreach ($item in $services.value) {
    $s = $item.service
    Write-Host "$($s.name) - ID: $($s.id) - URL: $($s.serviceDetails.url)"
}
