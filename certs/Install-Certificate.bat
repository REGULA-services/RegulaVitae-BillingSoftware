@echo off
setlocal
echo ========================================================
echo Installing MADRAS ORTHO CLINIC SOFTWARE Certificate
echo This ensures Windows 10 and Windows 11 trust the software.
echo ========================================================
set CERT_PATH=%~dp0MadrasOrthoClinic.cer

:: Install into Current User stores (works without elevation)
certutil -user -addstore -f "TrustedPeople" "%CERT_PATH%" >nul 2>&1
certutil -user -addstore -f "TrustedPublisher" "%CERT_PATH%" >nul 2>&1
certutil -user -addstore -f "Root" "%CERT_PATH%" >nul 2>&1

:: Also attempt Machine stores (if run as Administrator)
certutil -addstore -f "TrustedPeople" "%CERT_PATH%" >nul 2>&1
certutil -addstore -f "TrustedPublisher" "%CERT_PATH%" >nul 2>&1
certutil -addstore -f "Root" "%CERT_PATH%" >nul 2>&1

echo.
echo [SUCCESS] Certificate installed successfully!
echo Windows 10 and Windows 11 will now trust MADRAS ORTHO CLINIC SOFTWARE.
echo.
pause
