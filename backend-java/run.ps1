# PowerShell runner for Raahi Carpool Java Backend
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting Raahi Carpool Java Backend Service (Port 8080)   " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $ScriptDir
if (!(Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

Write-Host "Compiling Java source files..." -ForegroundColor Yellow
$sources = Get-ChildItem -Path "src" -Filter *.java -Recurse | Select-Object -ExpandProperty FullName
javac -encoding UTF-8 -d bin $sources

Write-Host "[OK] Compilation successful!" -ForegroundColor Green
Write-Host "Starting Carpool Server on http://localhost:8080 ..." -ForegroundColor Cyan

java -cp bin com.raahi.carpool.Main
