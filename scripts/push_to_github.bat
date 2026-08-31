@echo off
title Push IBVAP to GitHub (SK999CodingWorld/ibvap-123321)
color 0A
echo ======================================================================
echo    IBVAP - Pushing to https://github.com/SK999CodingWorld/ibvap-123321
echo ======================================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in system PATH.
    echo Opening GitHub Upload Page in your default browser...
    start https://github.com/SK999CodingWorld/ibvap-123321/upload
    echo.
    echo Please drag and drop your project files into the browser window.
    echo.
    pause
    exit /b 1
)

echo [1/4] Initializing Git repository...
if not exist ".git" (
    git init
    git branch -M main
)

echo [2/4] Staging files...
git add .

echo [3/4] Committing changes...
git commit -m "IBVAP - Complete AI Video Analytics Platform Release (Real-Time Vision, ANPR, Face Re-ID, Heatmap & Evidence Vault)"

echo [4/4] Setting remote and pushing to https://github.com/SK999CodingWorld/ibvap-123321.git...
git remote remove origin 2>nul
git remote add origin https://github.com/SK999CodingWorld/ibvap-123321.git
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ======================================================================
    echo    SUCCESSFULLY PUSHED TO GITHUB!
    echo    Repository: https://github.com/SK999CodingWorld/ibvap-123321
    echo ======================================================================
) else (
    echo [NOTE] If push was rejected, you can force push to the new empty repo with:
    echo   git push -u origin main --force
)

echo.
pause
