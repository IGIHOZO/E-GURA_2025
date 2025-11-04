@echo off
echo ============================================
echo  RESTARTING BACKEND WITH AI FIX
echo ============================================
echo.

cd backend

echo Killing old backend processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend*" 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Starting backend with fixed Modern AI...
echo.

start "E-Gura Backend" cmd /k "npm start"

echo.
echo ============================================
echo  BACKEND RESTARTED!
echo ============================================
echo.
echo Look for these messages in the backend window:
echo   [OK] "Modern AI bargaining engine running..."
echo   [OK] "Server running on port 5000"
echo.
echo Now test the AI Assistant again!
echo.
pause
