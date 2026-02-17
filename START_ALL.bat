@echo off
echo ================================================================================
echo Starting E-Gura Full Stack Application
echo ================================================================================
echo.

echo This will start:
echo   1. Backend Server (Port 5000)
echo   2. Frontend Server (Port 4000)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Starting Backend Server...
start "E-Gura Backend (Port 5000)" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "E-Gura Frontend (Port 4000)" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================================================
echo Both servers are starting!
echo ================================================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:4000
echo.
echo Check the new command windows for server status.
echo.
pause
