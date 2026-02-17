@echo off
echo ================================================================================
echo CLEANUP UNUSED FILES - Reduce Project Size
echo ================================================================================
echo.
echo This will delete:
echo   - Unused documentation files (.txt, redundant .md)
echo   - Old test files and fix scripts
echo   - Unused page components
echo   - Backup/duplicate files
echo.
echo WARNING: This cannot be undone!
echo.
pause

echo.
echo Starting cleanup...
echo.

REM ========== DELETE UNUSED DOCUMENTATION FILES ==========
echo Cleaning up documentation files...

del "ADMIN_LOGIN_FIX.md" 2>nul
del "ADMIN_ORDER_IMAGES_FIXED.txt" 2>nul
del "ADMIN_ORDER_IMAGES_REAL_FIX.txt" 2>nul
del "ADMIN_SHIPPING_MANAGEMENT_ADDED.txt" 2>nul
del "AI_FIX_APPLIED.txt" 2>nul
del "AI_UPGRADE_QUICK_START.txt" 2>nul
del "BACKEND_RUNNING_SUCCESS.txt" 2>nul
del "BLOG_SITEMAP_COMPLETE.txt" 2>nul
del "BLOG_SITEMAP_INTEGRATION.md" 2>nul
del "BLOG_SITEMAP_QUICKSTART.md" 2>nul
del "CLEANUP_COMPLETE_SUMMARY.txt" 2>nul
del "COMPETITIVE_ANALYSIS.md" 2>nul
del "CONSOLE_ERRORS_FIXED.txt" 2>nul
del "CUSTOMER_ACCOUNT_DATABASE_CONNECTED.txt" 2>nul
del "CUSTOMER_ACCOUNT_FINAL_FIX.txt" 2>nul
del "DATABASE_CONNECTION_FIXED.md" 2>nul
del "FEATURES_ANALYSIS_REPORT.txt" 2>nul
del "FINAL_CLEANUP_REPORT.txt" 2>nul
del "HOW_TO_RESTART_BACKEND.txt" 2>nul
del "IMPLEMENTATION_PLAN.md" 2>nul
del "MEDIA_UPLOAD_QUICKSTART.txt" 2>nul
del "MEDIA_UPLOAD_SYSTEM_COMPLETE.md" 2>nul
del "MODERN_AI_UPGRADE.txt" 2>nul
del "README_COMPETITIVE.md" 2>nul
del "README_QUICK_FIX.txt" 2>nul
del "REDUCE_SIZE_TO_300MB.txt" 2>nul
del "SEARCH_V2_API_EXAMPLES.http" 2>nul
del "SEO_GENERATOR_AND_SHIPPING_BUTTONS_ADDED.txt" 2>nul
del "SEO_IMPLEMENTATION_COMPLETE.md" 2>nul
del "SHIPPING_FEE_FIXED.txt" 2>nul
del "SHOP_PAGE_VIDEO_FIXED.md" 2>nul
del "SIZE_REDUCTION_COMPLETE.txt" 2>nul
del "TRACKING_AND_WISHLIST_FIXED.txt" 2>nul
del "TRACKING_CRASH_FIXED.txt" 2>nul
del "TRACKING_FIXED_DATABASE.txt" 2>nul

echo Documentation files deleted.

REM ========== DELETE TEST FILES ==========
echo Cleaning up test files...

del "test-modern-ai.js" 2>nul
del "test-customer-api.js" 2>nul
del "test-blog-sitemap.js" 2>nul
del "test-frontend.html" 2>nul
del "check-orders.js" 2>nul
del "diagnose-search.js" 2>nul
del "backend\test-order-data.js" 2>nul
del "backend\test-order-data-fixed.js" 2>nul

echo Test files deleted.

REM ========== DELETE FIX SCRIPTS ==========
echo Cleaning up fix scripts...

del "fix-search-feature-flag.js" 2>nul
del "fix-indexes.js" 2>nul
del "fix-search-now.js" 2>nul
del "enable-search-v2-now.js" 2>nul
del "enable-search-v2.js" 2>nul
del "backend\fix-order-images.js" 2>nul
del "backend\fix-mongodb-timeout.js" 2>nul
del "backend\fix-column-lengths.js" 2>nul
del "backend\fix-all-indexes.js" 2>nul
del "backend\fix-order-indexes.js" 2>nul

echo Fix scripts deleted.

REM ========== DELETE UNUSED PAGE COMPONENTS ==========
echo Cleaning up unused page components...

del "frontend\src\pages\Account.jsx" 2>nul
del "frontend\src\pages\Product.jsx" 2>nul
del "frontend\src\pages\AddProductPage.jsx" 2>nul
del "frontend\src\pages\CustomerAccount.jsx" 2>nul
del "frontend\src\pages\AdminDashboardNew.jsx" 2>nul
del "frontend\src\pages\AdminDashboardComplete.jsx" 2>nul
del "frontend\src\pages\AdminAdvancedDashboard.jsx" 2>nul
del "frontend\src\pages\Home.jsx" 2>nul
del "frontend\src\pages\HomeAdvanced.jsx" 2>nul
del "frontend\src\pages\HomeNew.jsx" 2>nul
del "frontend\src\pages\HomeNewDesign.jsx" 2>nul
del "frontend\src\pages\Shop.jsx" 2>nul
del "frontend\src\pages\ShopNew.jsx" 2>nul
del "frontend\src\pages\SMSLogin.jsx" 2>nul

echo Unused page components deleted.

REM ========== DELETE UNUSED TRYON COMPONENTS ==========
echo Cleaning up old Virtual Try-On components...

del "frontend\src\components\VirtualTryOn.jsx" 2>nul
del "frontend\src\components\AdvancedVirtualTryOn.jsx" 2>nul

echo Old Try-On components deleted.

REM ========== DELETE TEST PAGE ==========
del "frontend\src\TestPage.jsx" 2>nul

echo Test page deleted.

REM ========== DELETE PUBLIC TEST FILES ==========
del "public\test-frontend.html" 2>nul

REM ========== DELETE ROOT NODE_MODULES (IF ANY) ==========
if exist "node_modules" (
    echo Removing root node_modules folder...
    rmdir /s /q "node_modules" 2>nul
)

echo.
echo ================================================================================
echo CLEANUP COMPLETE!
echo ================================================================================
echo.
echo Deleted:
echo   - 30+ documentation files
echo   - 8 test files
echo   - 10 fix scripts
echo   - 14 unused page components
echo   - 2 old Try-On components
echo   - Test page
echo.
echo Project size significantly reduced!
echo.
echo Recommended next steps:
echo   1. Test your application: npm run dev
echo   2. Verify all pages work correctly
echo   3. Create a production build: npm run build
echo.
pause
