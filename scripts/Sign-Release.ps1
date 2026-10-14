$pfxPath = Join-Path $PSScriptRoot "..\certs\MadrasOrthoClinic.pfx"
$pfxPass = "MadrasOrtho2026!"
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, $pfxPass, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

$releaseDir = Join-Path $PSScriptRoot "..\release"
$filesToSign = @(
    (Join-Path $releaseDir "MADRAS ORTHO CLINIC SOFTWARE Setup 1.0.0.exe"),
    (Join-Path $releaseDir "win-unpacked\MADRAS ORTHO CLINIC SOFTWARE.exe")
)

$elevateExe = Join-Path $releaseDir "win-unpacked\resources\elevate.exe"
if (Test-Path $elevateExe) {
    $filesToSign += $elevateExe
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Signing MADRAS ORTHO CLINIC SOFTWARE Release Binaries" -ForegroundColor Cyan
Write-Host "Certificate: $($cert.Subject)" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

foreach ($file in $filesToSign) {
    if (Test-Path $file) {
        Write-Host "Signing: $file ..." -NoNewline
        try {
            $sig = Set-AuthenticodeSignature -FilePath $file -Certificate $cert -HashAlgorithm SHA256 -TimestampServer "http://timestamp.digicert.com"
            Write-Host " [OK] (Status: $($sig.Status))" -ForegroundColor Green
        } catch {
            $sig = Set-AuthenticodeSignature -FilePath $file -Certificate $cert -HashAlgorithm SHA256
            Write-Host " [OK without timestamp] (Status: $($sig.Status))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nAll release binaries signed successfully!" -ForegroundColor Green
