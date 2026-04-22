# ConstructSync - Startup Script (Tabbed Version)
# Launches all services in a single Windows Terminal window with tabs.

$rootDir = Get-Location
$services = @(
    @{ name = "Gateway"; path = "backend\gateway" },
    @{ name = "Auth"; path = "backend\auth-service" },
    @{ name = "Labour"; path = "backend\labour-service" },
    @{ name = "Attendance"; path = "backend\attendance-service" },
    @{ name = "Deployment"; path = "backend\deployment-service" },
    @{ name = "Reporting"; path = "backend\reporting-service" },
    @{ name = "Frontend"; path = "frontend" }
)

Write-Host "Checking services and preparing tabs..." -ForegroundColor Cyan

if (Get-Command wt -ErrorAction SilentlyContinue) {
    # Windows Terminal (wt) detected - Building one big command for tabs
    $wtCommand = ""
    
    foreach ($s in $services) {
        $fullPath = Join-Path $rootDir $s.path
        if (Test-Path $fullPath) {
            if ($wtCommand -ne "") { $wtCommand += " `; " }
            # Build the tab command: new-tab, set directory, set title, run npm
            $wtCommand += "nt -d `"$fullPath`" --title `"$($s.name)`" powershell.exe -NoExit -Command `"npm run dev`""
        }
    }
    
    Write-Host "Launching Windows Terminal with tabs..." -ForegroundColor Green
    Start-Process wt -ArgumentList $wtCommand
} else {
    # Fallback to individual classic PowerShell windows
    foreach ($s in $services) {
        $fullPath = Join-Path $rootDir $s.path
        if (Test-Path $fullPath) {
            Write-Host "Launching $($s.name) in new window..." -ForegroundColor Green
            Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location `"$fullPath`"; `$host.ui.RawUI.WindowTitle = '$($s.name)'; npm run dev"
        }
    }
}

Write-Host "`nAll services triggered. If a tab closes immediately, run 'npm install' in that directory." -ForegroundColor Cyan
