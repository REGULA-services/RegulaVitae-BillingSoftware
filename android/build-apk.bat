@echo off
setlocal
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
set "ANDROID_HOME=C:\Users\joeli\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
java -version
echo.
echo Building Android APK for MADRAS ORTHO CLINIC SOFTWARE...
echo.

cd android
call gradlew.bat assembleDebug
cd ..

echo.
echo Copying APK to release directory...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "release\MADRAS ORTHO CLINIC MOBILE APP.apk"
echo Done!
