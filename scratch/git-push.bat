@echo off
echo Updating git remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/jo-lbeatz-coder/REGULA-BillingSoftware.git

echo Pushing to GitHub repository...
git push -u origin main

echo Done!
