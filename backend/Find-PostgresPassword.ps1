$passwords = @("", "postgres", "admin", "123456", "password", "root", "123", "1234", "12345")
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Password Finder" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$found = $false
$index = 1

foreach ($pwd in $passwords) {
    $pwdDisplay = if ($pwd -eq "") { "EMPTY" } else { $pwd }
    Write-Host "[$index/$($passwords.Length)] Testing password: $pwdDisplay..." -NoNewline
    
    $env:PGPASSWORD = $pwd
    $result = & $psqlPath -U postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "======================================" -ForegroundColor Green
        Write-Host "FOUND! PostgreSQL password is: $pwdDisplay" -ForegroundColor Green
        Write-Host "======================================"  -ForegroundColor Green
        Write-Host ""
        Write-Host "Add this to your .env file:"
        Write-Host "POSTGRES_PASSWORD=$pwd" -ForegroundColor Yellow
        $found = $true
        break
    } else {
        Write-Host " Failed" -ForegroundColor Red
    }
    
    $index++
}

if (-not $found) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Red
    Write-Host "FAILED: None of the common passwords worked" -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please enter your PostgreSQL password manually,"
    Write-Host "or follow these steps to reset it:"
    Write-Host ""
    Write-Host "1. Open as Administrator: C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
    Write-Host "2. Change 'scram-sha-256' to 'trust' for localhost connections"
    Write-Host "3. Restart service: Restart-Service postgresql-x64-16"
    Write-Host "4. Connect: psql -U postgres"
    Write-Host "5. Reset password: ALTER USER postgres WITH PASSWORD 'newpassword';"
    Write-Host "6. Change pg_hba.conf back to 'scram-sha-256'"
    Write-Host "7. Restart service again"
}

Write-Host ""
Read-Host "Press Enter to continue"
