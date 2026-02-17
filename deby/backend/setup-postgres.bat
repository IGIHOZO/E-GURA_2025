@echo off
echo ========================================
echo PostgreSQL Database Setup
echo ========================================
echo.
echo Creating database: deby_ecommerce
echo.

REM Try to create database
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE deby_ecommerce;"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database created successfully!
    echo.
) else (
    echo.
    echo ⚠️  Database might already exist or password needed
    echo.
    echo Please enter your PostgreSQL password when prompted.
    echo.
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE deby_ecommerce;"
)

echo.
echo Press any key to continue...
pause >nul
