@echo off
chcp 65001 >nul
setlocal

echo ==============================
echo   WDHJ Auto Commit
==============================
echo.

cd /d E:\CHENGXU\WDHJ

echo [1/4] Checking git status...
git status --short
echo.

echo [2/4] Adding all changes...
git add -A

echo [3/4] Generating commit message...
for /f "tokens=2 delims==" %%I in ('powershell -command "Get-Date -Format yyyyMMddHHmmss"') do set dt=%%I
set commitMsg=auto update %dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%

echo Commit: %commitMsg%
echo.

echo [4/4] Commit and push...
git commit -m "%commitMsg%"
git push origin main

echo.
echo ==============================
echo   Done! Pushed to main
==============================
echo.
pause
