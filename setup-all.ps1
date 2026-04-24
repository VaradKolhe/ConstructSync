# ConstructSync - Setup & Dependencies Installer
# This script runs 'npm install' in all backend services, the frontend, and the backend root.

$rootDir = Get-Location
$directories = @(
    "backend",
    "backend\auth-service",
    "backend\labour-service",
    "backend\attendance-service",
    "backend\deployment-service",
    "backend\reporting-service",
    "backend\gateway",
    "frontend"
)

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "   ConstructSync - Installing All Dependencies" -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

foreach ($dir in $directories) {
    $fullPath = Join-Path $rootDir $dir
    if (Test-Path $fullPath) {
        Write-Host "`n>> Installing dependencies in: $dir" -ForegroundColor Green
        Push-Location $fullPath
        npm ci
        Pop-Location
    } else {
        Write-Host "Warning: Directory not found - $dir" -ForegroundColor Yellow
    }
}

Write-Host "`nAll dependencies installed." -ForegroundColor Cyan
