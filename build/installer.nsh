; ==============================================================================
; MADRAS ORTHO CLINIC SOFTWARE - Custom NSIS Installer Script
; Prevents "App cannot be closed. Please close it manually" error during install.
; ==============================================================================

!macro customInit
  ; Forcefully terminate any running instances of the app or older versions
  ; right as the installer initializes so all file handles and locks are released.
  DetailPrint "Terminating any running instances before setup..."
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "MADRAS ORTHO CLINIC SOFTWARE.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "BakersChestPOS.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "BillingSoftwarePOS.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "RegulaVitae POS.exe" /T'
  Pop $R0
  Sleep 1000
!macroend

!macro customCheckAppRunning
  ; Override electron-builder's default app-running check.
  ; Default check shows "cannot be closed. Please close it manually and click Retry".
  ; This custom macro forcefully terminates the process tree silently without blocking the user.
  DetailPrint "Ensuring ${PRODUCT_NAME} is closed..."
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "MADRAS ORTHO CLINIC SOFTWARE.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "BakersChestPOS.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "BillingSoftwarePOS.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "RegulaVitae POS.exe" /T'
  Pop $R0
  Sleep 1000
!macroend

!macro customInstall
  ; Immediately before copying/extracting files to destination folder,
  ; re-verify that no process has reopened or locked the directory.
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "MADRAS ORTHO CLINIC SOFTWARE.exe" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "MADRAS ORTHO CLINIC LOCALHOST.exe" /T'
  Pop $R0
  Sleep 500

  ; Register custom local domain http://madrasorthoclinic.local in Windows hosts file
  DetailPrint "Configuring custom URL http://madrasorthoclinic.local:4848..."
  nsExec::Exec 'powershell -NoProfile -Command "try { if (-not (Select-String -Path \"$SYSDIR\drivers\etc\hosts\" -Pattern \"madrasorthoclinic\.local\" -Quiet)) { Add-Content -Path \"$SYSDIR\drivers\etc\hosts\" -Value \"`r`n127.0.0.1 madrasorthoclinic.local\" } } catch {}"'
  Pop $R0
!macroend

!macro customUnInit
  ; Ensure uninstaller can delete the executable cleanly without file-in-use errors.
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "MADRAS ORTHO CLINIC SOFTWARE.exe" /T'
  Pop $R0
  Sleep 500
!macroend

!macro customUnInstall
  ; Enable the option for the user to either delete and remove all data from the device or keep it
  ${ifNot} ${Silent}
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Would you like to completely delete and remove all clinic data, databases, and billing records from this device?$\r$\n$\r$\n• Click YES to permanently wipe ALL data, medicines, and bill records from this computer.$\r$\n• Click NO to preserve your clinic records for future use or reinstallation." IDNO keepData
  ${endif}
    DetailPrint "Deleting all clinic databases and local records..."
    RMDir /r "$APPDATA\MadrasOrthoClinicPOS"
    RMDir /r "$APPDATA\madras-ortho-clinic-software"
    RMDir /r "$APPDATA\MADRAS ORTHO CLINIC SOFTWARE"
    RMDir /r "$LOCALAPPDATA\madras-ortho-clinic-software"
    RMDir /r "$LOCALAPPDATA\madras-ortho-clinic-software-updater"
    RMDir /r "$APPDATA\BakersChestPOS"
    RMDir /r "$APPDATA\RegulaVitaePOS"
    DetailPrint "All clinic data and databases have been permanently removed."
  keepData:
!macroend
