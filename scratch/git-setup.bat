@echo off
echo Configuring safe directory...
git config --global --add safe.directory "F:/Baker's Chest Billing software"

echo Initializing git...
git init

echo Adding files...
git add .

echo Committing files...
git commit -m "Initial commit: Rebranded POS with offline mobile PWA and Capacitor support"

echo Setting main branch...
git branch -M main

echo Configuring remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/REGULA-services/REGULA-BillingSoftware.git

echo Pushing to GitHub...
git push -u origin main

echo Done!
