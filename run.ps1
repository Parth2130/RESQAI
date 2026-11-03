# RESQAI All-in-One Startup Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RESQAI: AI-Powered Emergency Management & Response" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check Python venv
$VenvPython = Join-Path $ScriptDir "venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "[1/3] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\pip.exe install -r backend\requirements.txt
} else {
    Write-Host "[1/3] Python virtual environment ready." -ForegroundColor Green
}

# Check frontend dist
$DistIndex = Join-Path $ScriptDir "frontend\dist\index.html"
if (-not (Test-Path $DistIndex)) {
    Write-Host "[2/3] Building frontend assets..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "frontend")
    npm.cmd run build
    Set-Location $ScriptDir
} else {
    Write-Host "[2/3] Frontend build ready." -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/3] Starting RESQAI Unified Server on http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "  - Web App: http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location (Join-Path $ScriptDir "backend")
& $VenvPython -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
