# PowerShell script to set token environment variables
Write-Host "Setting token environment variables..." -ForegroundColor Green

$env:ADMIN_STAFF_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/admin_staff-token.txt"
Write-Host "ADMIN_STAFF_TOKEN set" -ForegroundColor Cyan
$env:PHYSICIAN_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/physician-token.txt"
Write-Host "PHYSICIAN_TOKEN set" -ForegroundColor Cyan
$env:ADMIN_REFERRING_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/admin_referring-token.txt"
Write-Host "ADMIN_REFERRING_TOKEN set" -ForegroundColor Cyan
$env:SUPER_ADMIN_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/super_admin-token.txt"
Write-Host "SUPER_ADMIN_TOKEN set" -ForegroundColor Cyan
$env:ADMIN_RADIOLOGY_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/admin_radiology-token.txt"
Write-Host "ADMIN_RADIOLOGY_TOKEN set" -ForegroundColor Cyan
$env:SCHEDULER_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/scheduler-token.txt"
Write-Host "SCHEDULER_TOKEN set" -ForegroundColor Cyan
$env:RADIOLOGIST_TOKEN = Get-Content -Path "/Users/brad/Documents/Code/RadMiddle/Frontend-MockUp/test-scripts/tokens/radiologist-token.txt"
Write-Host "RADIOLOGIST_TOKEN set" -ForegroundColor Cyan

Write-Host "All token environment variables set successfully." -ForegroundColor Green
