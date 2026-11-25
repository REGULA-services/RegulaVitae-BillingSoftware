; ==============================================================================
; MADRAS ORTHO CLINIC SOFTWARE & LOCALHOST - Enterprise NSIS Installer Script
; Completely prevents "App cannot be closed. Please close it manually" error.
; Forcefully terminates ONLY target clinic app processes (never Setup/Uninstall!)
; Ensures 100% clean installation and complete uninstallation without leftover locks.
; ==============================================================================

!macro _KILL_CLINIC_APPS
  ; Terminate ONLY exact clinic application executables and port 4848 Listen process.
  ; NEVER use wildcards like MADRAS* because that matches Setup / Uninstall executables!
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $R0
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "MADRAS ORTHO CLINIC LOCALHOST.exe"`
  Pop $R0
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "MADRAS ORTHO CLINIC SOFTWARE.exe"`
  Pop $R0
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "BakersChestPOS.exe"`
  Pop $R0
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "BillingSoftwarePOS.exe"`
  Pop $R0
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "RegulaVitae POS.exe"`
  Pop $R0
  nsExec::Exec `powershell.exe -NoProfile -NonInteractive -Command "try { Stop-Process -Name 'MADRAS ORTHO CLINIC LOCALHOST','MADRAS ORTHO CLINIC SOFTWARE','BakersChestPOS','BillingSoftwarePOS','RegulaVitae POS' -Force -ErrorAction SilentlyContinue } catch {}; try { Stop-Process -Id (Get-NetTCPConnection -LocalPort 4848 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique) -Force -ErrorAction SilentlyContinue } catch {}"`
  Pop $R0
!macroend

!macro customInit
  ; Fast startup: terminate exact running app processes & port 4848 listener cleanly without stalling UI launch,
  ; and shift CWD to $TEMP so no directory handles are held.
  SetOutPath $TEMP
  !insertmacro _KILL_CLINIC_APPS
!macroend

!macro customCheckAppRunning
  ; Override electron-builder's default app-running check.
  ; Forcefully terminates the exact app process tree silently without blocking the user.
  SetOutPath $TEMP
  DetailPrint "Ensuring ${PRODUCT_NAME} is completely closed..."
  !insertmacro _KILL_CLINIC_APPS
  Sleep 800
  ; Second pass in case a worker child process was still tearing down
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $R0
  Sleep 400
!macroend

!macro customInstall
  ; Register custom local domain http://madrasorthoclinic.local in Windows hosts file
  DetailPrint "Configuring custom URL http://madrasorthoclinic.local:4848..."
  nsExec::Exec 'powershell -NoProfile -Command "try { if (-not (Select-String -Path \"$SYSDIR\drivers\etc\hosts\" -Pattern \"madrasorthoclinic\.local\" -Quiet)) { Add-Content -Path \"$SYSDIR\drivers\etc\hosts\" -Value \"`r`n127.0.0.1 madrasorthoclinic.local\" } } catch {}"'
  Pop $R0
  SetOutPath $INSTDIR
!macroend

!macro customUnInit
  ; Crucial: SetOutPath $TEMP ensures uninstaller process does not hold a CWD lock on $INSTDIR!
  SetOutPath $TEMP
  DetailPrint "Terminating application before uninstall..."
  !insertmacro _KILL_CLINIC_APPS
  Sleep 800
!macroend

!macro customRemoveFiles
  ; Replace electron-builder's default atomicRMDir which aborts if any handle lingers.
  SetOutPath $TEMP
  DetailPrint "Ensuring all clinic processes are terminated..."
  !insertmacro _KILL_CLINIC_APPS
  Sleep 800

  DetailPrint "Removing installed application files from $INSTDIR..."
  RMDir /r "$INSTDIR"
  ; Clean up any remaining folder structure or read-only attributes
  nsExec::Exec `cmd.exe /c rd /s /q "$INSTDIR"`
  Pop $R0
!macroend

!macro customUnInstall
  ; Ensure uninstaller runs from $TEMP and releases any lock on $INSTDIR
  SetOutPath $TEMP

  ; NEVER wipe clinic databases during silent upgrades or reinstalls!
  ${if} ${Silent}
    Goto keepData
  ${endif}
  ${if} ${isUpdated}
    Goto keepData
  ${endif}

  MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Would you like to completely delete and remove all clinic data, databases, and billing records from this device?$\r$\n$\r$\n• Click YES to permanently wipe ALL data, medicines, and bill records from this computer.$\r$\n• Click NO to preserve your clinic records for future use or reinstallation." IDNO keepData

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
  ; Remove shortcuts for this specific product cleanly
  ${ifNot} ${isKeepShortcuts}
    Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
    Delete "$DESKTOP\${PRODUCT_FILENAME}.lnk"
    Delete "$SMPROGRAMS\${SHORTCUT_NAME}.lnk"
    Delete "$SMPROGRAMS\${PRODUCT_FILENAME}\*.lnk"
    RMDir /r "$SMPROGRAMS\${PRODUCT_FILENAME}"
  ${endif}

  ; Ensure installation directory is completely wiped
  RMDir /r "$INSTDIR"
  nsExec::Exec `cmd.exe /c rd /s /q "$INSTDIR"`
  Pop $R0
!macroend
