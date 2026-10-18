@echo off
setlocal
echo ============================================================
echo   Starting Raahi Carpool (Java Backend + Next.js App)
echo ============================================================

cd /d "%~dp0"

echo [1/3] Compiling and starting Java Backend on Port 8080...
start "Raahi Java Backend" cmd /k "npm run backend:java"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Next.js Frontend on Port 3000...
start "Raahi Frontend" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Raahi Admin Portal on Port 3001...
start "Raahi Admin Portal" cmd /k "npm --prefix ..\raahi-admin-portal run dev"

echo.
echo ============================================================
echo   All services are starting!
echo   Frontend:     http://localhost:3000
echo   Admin Portal: http://localhost:3001
echo   Java Backend: http://localhost:8080
echo ============================================================
