@echo off
title E-Gura Frontend Dev Server
cd /d "%~dp0frontend"
echo Clearing Vite cache...
rd /s /q "node_modules\.vite" 2>nul
echo Starting Frontend Dev Server on port 4000...
call npm run dev
pause
