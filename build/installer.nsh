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
  Sleep 500
!macroend

!macro customUnInit
  ; Ensure uninstaller can delete the executable cleanly without file-in-use errors.
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  Pop $R0
  nsExec::Exec 'taskkill /F /IM "MADRAS ORTHO CLINIC SOFTWARE.exe" /T'
  Pop $R0
  Sleep 500
!macroend
