@echo off
echo ================================================
echo OPENING BROWSER WITH FRESH CACHE
echo ================================================
echo.
echo This will open Firefox in private mode to bypass cache
echo URL: http://localhost:4004
echo.
echo IMPORTANT: If you still see errors:
echo 1. Press Ctrl+Shift+Delete in Firefox
echo 2. Select "Everything" from time range
echo 3. Check: Cookies, Cache, Site Data
echo 4. Click "Clear Now"
echo 5. Close ALL Firefox windows
echo 6. Run this script again
echo.
pause

start firefox -private-window http://localhost:4004

echo.
echo Browser opened in private mode
echo This bypasses ALL cached files
pause
