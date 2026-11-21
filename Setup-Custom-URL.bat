@echo off
:: ====================================================================
:: MADRAS ORTHO CLINIC PHARMACY SOFTWARE
:: Custom URL Configuration Script
:: Maps: http://madrasorthoclinic.local:4848 -> 127.0.0.1
:: ====================================================================

title MADRAS ORTHO CLINIC - Custom URL Setup
echo ====================================================================
echo   MADRAS ORTHO CLINIC PHARMACY SOFTWARE - CUSTOM URL SETUP
echo   Activating Custom URL: http://madrasorthoclinic.local:4848
echo ====================================================================
echo.

:: Check for Administrative permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator privileges to update hosts file...
    powershell -NoProfile -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set HOSTS_FILE=%WINDIR%\System32\drivers\etc\hosts

findstr /i "madrasorthoclinic.local" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] http://madrasorthoclinic.local is already configured in Windows hosts file!
) else (
    echo [INFO] Adding '127.0.0.1 madrasorthoclinic.local' to %HOSTS_FILE%...
    echo.>>"%HOSTS_FILE%"
    echo 127.0.0.1 madrasorthoclinic.local>>"%HOSTS_FILE%"
    echo [SUCCESS] Custom URL http://madrasorthoclinic.local:4848 is now active!
)

echo.
echo ====================================================================
echo   SETUP COMPLETE!
echo   You can now open the software in any browser using:
echo     http://madrasorthoclinic.local:4848
echo ====================================================================
echo.
pause
