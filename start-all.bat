@echo off
setlocal
echo ============================================================
echo   Starting Raahi Carpool (Java Backend + Next.js App)
echo ============================================================

cd /d "%~dp0"

echo [1/2] Compiling and starting Java Backend on Port 8080...
start "Raahi Java Backend" cmd /k "npm run backend:java"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Next.js Frontend on Port 3000...
start "Raahi Frontend" cmd /k "npm run dev"

echo.
echo ============================================================
echo   Both services are starting!
echo   Frontend: http://localhost:3000
echo   Java Backend: http://localhost:8080
echo ============================================================
