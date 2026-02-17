@echo off
echo ======================================
echo PostgreSQL Password Finder
echo ======================================
echo.
echo This script will help you test common PostgreSQL passwords
echo.
echo Trying common passwords...
echo.

set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe

echo [1/6] Testing empty password...
"%PSQL_PATH%" -U postgres -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is EMPTY
    echo POSTGRES_PASSWORD=
    pause
    exit /b 0
)

echo [2/6] Testing password: postgres...
set PGPASSWORD=postgres
"%PSQL_PATH%" -U postgres -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: postgres
    echo POSTGRES_PASSWORD=postgres
    pause
    exit /b 0
)

echo [3/6] Testing password: admin...
set PGPASSWORD=admin
"%PSQL_PATH%" -U postgres -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: admin
    echo POSTGRES_PASSWORD=admin
    pause
    exit /b 0
)

echo [4/6] Testing password: 123456...
set PGPASSWORD=123456
"%PSQL_PATH%" -U postgres -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: 123456
    echo POSTGRES_PASSWORD=123456
    pause
    exit /b 0
)

echo [5/6] Testing password: password...
set PGPASSWORD=password
"%PSQL_PATH%" -U postgres -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: password
    echo POSTGRES_PASSWORD=password
    pause
    exit /b 0
)

echo [6/6] Testing password: root...
set PGPASSWORD=root
"%PSQL_PATH%" -U postgres -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: root
    echo POSTGRES_PASSWORD=root
    pause
    exit /b 0
)

echo.
echo ======================================
echo FAILED: None of the common passwords worked
echo ======================================
echo.
echo You need to either:
echo 1. Remember your PostgreSQL password from installation
echo 2. Reset the password using pg_hba.conf method
echo.
echo To reset, follow these steps:
echo 1. Open C:\Program Files\PostgreSQL\16\data\pg_hba.conf as Administrator
echo 2. Change "scram-sha-256" to "trust" for localhost connections
echo 3. Restart PostgreSQL service: net stop postgresql-x64-16 ^&^& net start postgresql-x64-16
echo 4. Connect without password: psql -U postgres
echo 5. Set new password: ALTER USER postgres WITH PASSWORD 'your_new_password';
echo 6. Change pg_hba.conf back to "scram-sha-256"
echo 7. Restart service again
echo.
pause
