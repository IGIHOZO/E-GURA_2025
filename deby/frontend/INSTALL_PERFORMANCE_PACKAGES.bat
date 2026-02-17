@echo off
echo ================================================================================
echo Installing Performance Optimization Packages
echo ================================================================================
echo.
echo This will install:
echo   - vite-plugin-compression (Gzip + Brotli compression)
echo   - rollup-plugin-visualizer (Bundle analyzer)
echo.
pause

echo.
echo Installing packages...
echo.

npm install --save-dev vite-plugin-compression rollup-plugin-visualizer

echo.
echo ================================================================================
echo Installation Complete!
echo ================================================================================
echo.
echo Next steps:
echo   1. Run 'npm run dev' to start development server
echo   2. Run 'npm run build' to create optimized production build
echo   3. Run 'ANALYZE=true npm run build' to analyze bundle size
echo   4. Run 'npm run preview' to preview production build
echo.
echo Performance features are now active!
echo Target: Page load time less than 2 seconds
echo.
pause
