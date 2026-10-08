@echo off
setlocal
echo ============================================================
echo   Starting Raahi Carpool Java Backend Service (Port 8080)
echo ============================================================

cd /d "%~dp0"
if not exist "bin" mkdir "bin"

echo Compiling Java source files...
dir /s /b src\*.java > sources.txt
javac -encoding UTF-8 -d bin @sources.txt
del sources.txt

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [OK] Compilation successful!
echo Starting Carpool Server...
java -cp bin com.raahi.carpool.Main
