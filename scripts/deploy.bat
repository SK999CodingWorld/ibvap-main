@echo off
title IBVAP AI Surveillance Platform - Production Deployment
color 0A
cd /d "%~dp0\.."

echo =====================================================================
echo       IBVAP - AI Border Surveillance & Tactical Intelligence
echo                   Production Deployment Launcher
echo =====================================================================
echo.

echo [1/3] Verifying Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10+ is required but not found in PATH.
    pause
    exit /b 1
)

echo [2/3] Installing/verifying dependencies...
pip install -r requirements.txt --quiet
pip install ultralytics opencv-python-headless --quiet

echo [3/3] Launching IBVAP Full-Power Surveillance Server on port 8000...
echo.
echo ---------------------------------------------------------------------
echo   Local Dashboard:       http://localhost:8000/
echo   Surveillance Wall:     http://localhost:8000/surveillance
echo   Subject Tracking Feed: http://localhost:8000/tracking
echo   Forensic Evidence:     http://localhost:8000/evidence
echo   API Swagger Docs:      http://localhost:8000/docs
echo ---------------------------------------------------------------------
echo.

python run.py
pause
