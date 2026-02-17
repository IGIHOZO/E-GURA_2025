@echo off
echo ================================================================================
echo Starting E-Gura Backend Server
echo ================================================================================
echo.

cd backend

echo Checking for backend directory...
if not exist "index.js" (
    echo ERROR: backend/index.js not found!
    echo Make sure you're in the correct directory.
    pause
    exit /b 1
)

echo.
echo Starting server on port 5000...
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
