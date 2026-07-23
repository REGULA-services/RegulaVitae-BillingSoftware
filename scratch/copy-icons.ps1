$src = "C:\Users\joeli\.gemini\antigravity-ide\brain\ff45dbb2-d0d4-4638-b650-050b98408d38\regula_icon_square_1784807901318.png"
$root = "F:\Baker's Chest Billing software"

# Copy to all required icon locations
Copy-Item $src "$root\public\icon.png" -Force
Copy-Item $src "$root\src\renderer\public\icon.png" -Force
Copy-Item $src "$root\src\renderer\public\icons\icon-512.png" -Force

Write-Host "Icon files copied successfully."
