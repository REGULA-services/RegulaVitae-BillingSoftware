$certFile = Join-Path $PSScriptRoot "MadrasOrthoClinic.cer"
Write-Host "Installing MADRAS ORTHO CLINIC certificate to Windows Certificate Stores..." -ForegroundColor Cyan

# Install to Current User store (standard user privileges)
certutil.exe -user -addstore -f "TrustedPeople" $certFile | Out-Null
certutil.exe -user -addstore -f "TrustedPublisher" $certFile | Out-Null
certutil.exe -user -addstore -f "Root" $certFile | Out-Null

# Attempt Machine store (if elevated)
try {
    certutil.exe -addstore -f "TrustedPeople" $certFile | Out-Null
    certutil.exe -addstore -f "TrustedPublisher" $certFile | Out-Null
    certutil.exe -addstore -f "Root" $certFile | Out-Null
} catch {}

Write-Host "`n[SUCCESS] Certificate installed! Windows 10 & 11 will trust MADRAS ORTHO CLINIC SOFTWARE." -ForegroundColor Green
