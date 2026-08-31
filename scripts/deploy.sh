#!/usr/bin/env bash
set -e

# Change directory to project root
cd "$(dirname "$0")/.."

echo "====================================================================="
echo "      IBVAP - AI Border Surveillance & Tactical Intelligence"
echo "                  Linux / Cloud Production Deployment"
echo "====================================================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

echo "[1/3] Installing Python dependencies..."
pip3 install --no-cache-dir -r requirements.txt
pip3 install --no-cache-dir ultralytics opencv-python-headless

echo "[2/3] Checking Frontend Distribution..."
if [ ! -d "frontend/dist" ]; then
    echo "[INFO] Compiling Vite Frontend..."
    cd frontend && npm install && npm run build && cd ..
fi

echo "[3/3] Starting IBVAP Server on 0.0.0.0:8000..."
echo "---------------------------------------------------------------------"
echo "  Dashboard:       http://0.0.0.0:8000/"
echo "  Surveillance:    http://0.0.0.0:8000/surveillance"
echo "  Tracking:        http://0.0.0.0:8000/tracking"
echo "  Evidence Vault:  http://0.0.0.0:8000/evidence"
echo "  Swagger Docs:    http://0.0.0.0:8000/docs"
echo "---------------------------------------------------------------------"

export PORT=8000
export HOST=0.0.0.0
export PYTHONPATH=.
python3 run.py
