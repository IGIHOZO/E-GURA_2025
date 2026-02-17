@echo off
echo ================================================================================
echo RESTARTING E-Gura Backend Server
echo ================================================================================
echo.

cd backend

echo Killing any existing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Found process %%a on port 5000
    taskkill /F /PID %%a >nul 2>&1
    echo Process killed
)

echo.
echo Starting fresh backend server...
echo.

node index.js

pause
