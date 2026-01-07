#!/usr/bin/env pwsh
<#
.SYNOPSIS
Verify Vercel project configuration and recent deployments.

.DESCRIPTION
This script checks:
- Project details (name, root directory, linked repo)
- Recent deployments (status, branch, URL)
- Domain mappings

.PARAMETER ProjectId
The Vercel project ID to check (default: prj_7bLZcK514TpSkjtlzHOG5wGrSiWr).

.PARAMETER Token
The Vercel API token (reads from env VERCEL_TOKEN if not provided).

.EXAMPLE
.\vercel-check.ps1
# Uses $Env:VERCEL_TOKEN and default project ID

.\vercel-check.ps1 -ProjectId "prj_xyz" -Token "abc123..."
#>

param(
  [string]$ProjectId = "prj_7bLZcK514TpSkjtlzHOG5wGrSiWr",
  [string]$Token = $Env:VERCEL_TOKEN
)

$ErrorActionPreference = 'Stop'

# Validate token — read from environment only, never hardcode
if (-not $Env:VERCEL_TOKEN) {
  Write-Host "ERROR: VERCEL_TOKEN environment variable not set." -ForegroundColor Red
  Write-Host "Set it in your shell before running this script:" -ForegroundColor Yellow
  Write-Host '  $Env:VERCEL_TOKEN = "<your-vercel-api-token>"' -ForegroundColor Gray
  exit 1
}

$Token = $Env:VERCEL_TOKEN

# Mask token for display
$maskedToken = $Token.Substring(0, [Math]::Min(10, $Token.Length)) + "***"
Write-Host "Vercel Check" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan
Write-Host "Token: $maskedToken"
Write-Host "Project ID: $ProjectId`n"

$headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
$apiBase = "https://api.vercel.com"

try {
  # Fetch project details
  Write-Host "Fetching project details..." -ForegroundColor Gray
  $proj = Invoke-RestMethod -Uri "$apiBase/v9/projects/$ProjectId" -Headers $headers -Method Get
  
  Write-Host "Project Details:" -ForegroundColor Green
  Write-Host "  Name: $($proj.name)"
  Write-Host "  Framework: $($proj.framework)"
  Write-Host "  Root Directory: $(if ($proj.rootDirectory) { $proj.rootDirectory } else { '(root)' })"
  Write-Host "  Repo: $($proj.link.type)/$($proj.link.repo)"
  Write-Host ""

  # Fetch recent deployments
  Write-Host "Fetching recent deployments..." -ForegroundColor Gray
  $deps = Invoke-RestMethod -Uri "$apiBase/v6/deployments?projectId=$ProjectId&limit=5" -Headers $headers -Method Get

  Write-Host "Recent Deployments:" -ForegroundColor Green
  if ($deps.deployments -and $deps.deployments.Count -gt 0) {
    $now = [DateTimeOffset]::UtcNow
    foreach ($dep in $deps.deployments) {
      $branch = if ($dep.meta.githubCommitRef) { $dep.meta.githubCommitRef } else { "(unknown)" }
      $state = $dep.state
      
      # Convert epoch ms to age
      $ageStr = "(unknown)"
      if ($dep.createdAt) {
        try {
          $createdAtMs = [int64]$dep.createdAt
          $created = [DateTimeOffset]::FromUnixTimeMilliseconds($createdAtMs)
          $age = $now - $created
          $ageStr = if ($age.TotalMinutes -lt 1) { "<1m" } elseif ($age.TotalHours -lt 1) { "$([int]$age.TotalMinutes)m" } else { "$([int]$age.TotalHours)h" }
        } catch {
          # If not a number, assume it's already a timestamp
          $ageStr = "(unknown)"
        }
      }
      
      # Color-code state
      $stateColor = switch ($state) {
        'READY' { 'Green' }
        'ERROR' { 'Red' }
        'BUILDING' { 'Yellow' }
        default { 'Gray' }
      }

      Write-Host "  [$state] $($dep.uid.Substring(0,8))... | age: $ageStr" -ForegroundColor $stateColor
      Write-Host "    URL: https://$($dep.url)"
      Write-Host "    Branch: $branch"
      Write-Host ""
    }
  } else {
    Write-Host "  (No deployments found)" -ForegroundColor Gray
  }

  # Fetch custom domains
  Write-Host "Fetching custom domains..." -ForegroundColor Gray
  try {
    $domains = Invoke-RestMethod -Uri "$apiBase/v8/projects/$ProjectId/domains" -Headers $headers -Method Get
    if ($domains.domains -and $domains.domains.Count -gt 0) {
      Write-Host "Custom Domains:" -ForegroundColor Green
      foreach ($domain in $domains.domains) {
        Write-Host "  $($domain.name)"
      }
    }
  } catch {
    Write-Host "  (No custom domains)" -ForegroundColor Gray
  }

  Write-Host "`nVerification complete!" -ForegroundColor Cyan

} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Message -match "404|not found") {
    Write-Host "  Project ID '$ProjectId' not found or token invalid." -ForegroundColor Yellow
  }
  exit 1
}
