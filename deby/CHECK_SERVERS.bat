@echo off
echo ================================================================================
echo E-Gura Server Status Check
echo ================================================================================
echo.

echo Checking Backend (Port 5000)...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is RUNNING on port 5000
    curl -s http://localhost:5000/api/health
) else (
    echo ❌ Backend is NOT RUNNING on port 5000
    echo.
    echo To start backend:
    echo   cd backend
    echo   npm run dev
)

echo.
echo Checking Frontend (Port 4000)...
curl -s http://localhost:4000 > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend is RUNNING on port 4000
) else (
    echo ❌ Frontend is NOT RUNNING on port 4000
    echo.
    echo To start frontend:
    echo   cd frontend
    echo   npm run dev
)

echo.
echo Checking Database (PostgreSQL)...
sc query postgresql-x64-14 | find "RUNNING" > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PostgreSQL is RUNNING
) else (
    echo ❌ PostgreSQL is NOT RUNNING
    echo.
    echo To start PostgreSQL:
    echo   net start postgresql-x64-14
)

echo.
echo ================================================================================
echo.
pause
