; ==============================================================================
; MADRAS ORTHO CLINIC SOFTWARE & LOCALHOST - Custom NSIS Installer Script
; Completely prevents "App cannot be closed. Please close it manually" error.
; Forcefully terminates any running instances before setup, uninstallation, or upgrade.
; ==============================================================================

!macro customInit
  ; Forcefully terminate any running instances of the app, localhost server, or legacy processes
  ; right as the installer initializes so all file handles and locks are released before uninstaller or extraction.
  DetailPrint "Terminating any running instances of clinic applications..."
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC LOCALHOST.exe"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC SOFTWARE.exe"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $R0
  nsExec::Exec `powershell.exe -NoProfile -NonInteractive -Command "Stop-Process -Name 'MADRAS ORTHO CLINIC LOCALHOST', 'MADRAS ORTHO CLINIC SOFTWARE', 'BakersChestPOS', 'BillingSoftwarePOS', 'RegulaVitae POS' -Force -ErrorAction SilentlyContinue"`
  Pop $R0
  Sleep 1000
!macroend

!macro customCheckAppRunning
  ; Override electron-builder's default app-running check.
  ; Default check shows "cannot be closed. Please close it manually and click Retry".
  ; This custom macro forcefully terminates the process tree silently without blocking the user.
  DetailPrint "Ensuring ${PRODUCT_NAME} is completely closed..."
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC LOCALHOST.exe"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC SOFTWARE.exe"`
  Pop $R0
  nsExec::Exec `powershell.exe -NoProfile -NonInteractive -Command "Stop-Process -Name 'MADRAS ORTHO CLINIC LOCALHOST', 'MADRAS ORTHO CLINIC SOFTWARE', 'BakersChestPOS', 'BillingSoftwarePOS', 'RegulaVitae POS' -Force -ErrorAction SilentlyContinue"`
  Pop $R0
  Sleep 1000
!macroend

!macro customInstall
  ; Immediately before copying/extracting files to destination folder,
  ; re-verify that no process has reopened or locked the directory.
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC SOFTWARE.exe"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC LOCALHOST.exe"`
  Pop $R0
  nsExec::Exec `powershell.exe -NoProfile -NonInteractive -Command "Stop-Process -Name 'MADRAS ORTHO CLINIC LOCALHOST', 'MADRAS ORTHO CLINIC SOFTWARE' -Force -ErrorAction SilentlyContinue"`
  Pop $R0
  Sleep 500

  ; Register custom local domain http://madrasorthoclinic.local in Windows hosts file
  DetailPrint "Configuring custom URL http://madrasorthoclinic.local:4848..."
  nsExec::Exec 'powershell -NoProfile -Command "try { if (-not (Select-String -Path \"$SYSDIR\drivers\etc\hosts\" -Pattern \"madrasorthoclinic\.local\" -Quiet)) { Add-Content -Path \"$SYSDIR\drivers\etc\hosts\" -Value \"`r`n127.0.0.1 madrasorthoclinic.local\" } } catch {}"'
  Pop $R0
!macroend

!macro customUnInit
  ; Ensure uninstaller can delete the executable cleanly without file-in-use errors.
  DetailPrint "Terminating application before uninstall..."
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC LOCALHOST.exe"`
  Pop $R0
  nsExec::Exec `cmd.exe /c taskkill /F /T /IM "MADRAS ORTHO CLINIC SOFTWARE.exe"`
  Pop $R0
  nsExec::Exec `powershell.exe -NoProfile -NonInteractive -Command "Stop-Process -Name 'MADRAS ORTHO CLINIC LOCALHOST', 'MADRAS ORTHO CLINIC SOFTWARE' -Force -ErrorAction SilentlyContinue"`
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
    RMDir /r "$APPDATA\madras-ortho-clinic-localhost"
    RMDir /r "$LOCALAPPDATA\madras-ortho-clinic-localhost"
    RMDir /r "$LOCALAPPDATA\madras-ortho-clinic-localhost-updater"
    RMDir /r "$APPDATA\BakersChestPOS"
    RMDir /r "$APPDATA\RegulaVitaePOS"
    DetailPrint "All clinic data and databases have been permanently removed."
  keepData:
!macroend
