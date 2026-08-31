#!/bin/bash
# IBVAP Production Deployment Script
# Usage: ./deploy/install.sh

set -e

echo "=========================================="
echo "IBVAP - Intelligent Border Video Analytics Platform"
echo "Production Installation Script"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/ibvap"
DATA_DIR="/var/lib/ibvap"
LOG_DIR="/var/log/ibvap"
SERVICE_USER="ibvap"
PYTHON_VERSION="3.11"

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine OS"
        exit 1
    fi
    source /etc/os-release
    log_info "Detected OS: $PRETTY_NAME"
}

install_dependencies() {
    log_info "Installing system dependencies..."
    
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y \
            python3 python3-pip python3-venv \
            redis-server postgresql postgresql-contrib \
            ffmpeg libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1-mesa-glx \
            nginx supervisor \
            git curl wget \
            build-essential cmake pkg-config \
            libjpeg-dev libpng-dev libtiff-dev libavcodec-dev libavformat-dev libswscale-dev \
            libv4l-dev libxvidcore-dev libx264-dev \
            libgtk-3-dev libatlas-base-dev gfortran
    elif command -v yum &> /dev/null; then
        yum install -y \
            python3 python3-pip \
            redis postgresql-server postgresql-contrib \
            ffmpeg \
            nginx supervisor \
            git curl wget \
            gcc gcc-c++ make cmake pkgconfig \
            libjpeg-devel libpng-devel libtiff-devel \
            libv4l-devel xvidcore-devel x264-devel \
            gtk3-devel atlas-devel gfortran
    else
        log_error "Unsupported package manager"
        exit 1
    fi
}

setup_user() {
    log_info "Setting up service user..."
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$INSTALL_DIR" "$SERVICE_USER"
    fi
}

setup_directories() {
    log_info "Creating directories..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"/{recordings,models,watchlist}
    mkdir -p "$LOG_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR" "$DATA_DIR" "$LOG_DIR"
}

install_python_deps() {
    log_info "Installing Python dependencies..."
    
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" python3 -m venv venv
    sudo -u "$SERVICE_USER" venv/bin/pip install --upgrade pip
    sudo -u "$SERVICE_USER" venv/bin/pip install -r requirements.txt
    
    # Download models
    sudo -u "$SERVICE_USER" venv/bin/python -c "
from ultralytics import YOLO
YOLO('yolov8n.pt')
print('Base model downloaded')
"
}

setup_redis() {
    log_info "Configuring Redis..."
    sed -i 's/^bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf 2>/dev/null || true
    sed -i 's/^# requirepass foobared/requirepass ibvap_redis_secret/' /etc/redis/redis.conf 2>/dev/null || true
    systemctl enable redis-server
    systemctl restart redis-server
}

setup_postgresql() {
    log_info "Configuring PostgreSQL..."
    systemctl enable postgresql
    systemctl start postgresql
    
    sudo -u postgres psql -c "CREATE USER ibvap WITH PASSWORD 'ibvap_secret';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE ibvap OWNER ibvap;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ibvap TO ibvap;" 2>/dev/null || true
}

setup_supervisor() {
    log_info "Configuring Supervisor..."
    
    cat > /etc/supervisor/conf.d/ibvap.conf << EOF
[program:ibvap-api]
command=$INSTALL_DIR/venv/bin/python main.py
directory=$INSTALL_DIR
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/api.log
environment=PYTHONPATH="$INSTALL_DIR",REDIS_HOST="localhost",REDIS_PORT="6379",POSTGRES_HOST="localhost",POSTGRES_PASSWORD="ibvap_secret"

[program:ibvap-detector]
command=$INSTALL_DIR/venv/bin/python -m services.detection_worker.service
directory=$INSTALL_DIR
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/detector.log
environment=PYTHONPATH="$INSTALL_DIR",REDIS_HOST="localhost",REDIS_PORT="6379",DETECTION_DEVICE="cuda",DETECTION_HALF="true"

[program:ibvap-tracker]
command=$INSTALL_DIR/venv/bin/python -m services.tracking_service.service
directory=$INSTALL_DIR
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/tracker.log
environment=PYTHONPATH="$INSTALL_DIR",REDIS_HOST="localhost",REDIS_PORT="6379"

[program:ibvap-alerts]
command=$INSTALL_DIR/venv/bin/python -m services.alert_engine.service
directory=$INSTALL_DIR
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/alerts.log
environment=PYTHONPATH="$INSTALL_DIR",REDIS_HOST="localhost",REDIS_PORT="6379",POSTGRES_HOST="localhost",POSTGRES_PASSWORD="ibvap_secret"

[program:ibvap-recorder]
command=$INSTALL_DIR/venv/bin/python -m services.recording_service.service
directory=$INSTALL_DIR
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/recorder.log
environment=PYTHONPATH="$INSTALL_DIR",REDIS_HOST="localhost",REDIS_PORT="6379"
EOF
    
    supervisorctl reread
    supervisorctl update
}

setup_nginx() {
    log_info "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/ibvap << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/ibvap /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
}

setup_firewall() {
    log_info "Configuring firewall..."
    if command -v ufw &> /dev/null; then
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 8000/tcp
        ufw allow 3000/tcp
        ufw --force enable
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --reload
    fi
}

create_env() {
    log_info "Creating environment file..."
    
    cat > "$INSTALL_DIR/.env" << EOF
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=ibvap_redis_secret

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ibvap
POSTGRES_USER=ibvap
POSTGRES_PASSWORD=ibvap_secret

# Detection
DETECTION_MODEL=yolov8n.pt
DETECTION_DEVICE=cuda
DETECTION_CONF=0.35
DETECTION_IOU=0.45
DETECTION_CLASSES=[0,1,2,3,5,7]
DETECTION_IMGSZ=640
DETECTION_HALF=true

# Tracking
TRACKER_TYPE=botsort
TRACK_BUFFER=30
MATCH_THRESH=0.8

# Zones
ZONES_CONFIG=zones.json

# Alerts
ALERT_COOLDOWN=5.0
ALERT_MAX_HISTORY=1000

# Recording
RECORD_ENABLED=true
RECORD_SEGMENT_DURATION=300
RECORD_RETENTION_DAYS=30
RECORD_PATH=$DATA_DIR/recordings

# API
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
EOF
    
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/.env"
}

build_dashboard() {
    log_info "Building dashboard..."
    if [[ -d "$INSTALL_DIR/dashboard" ]]; then
        cd "$INSTALL_DIR/dashboard"
        if command -v npm &> /dev/null; then
            sudo -u "$SERVICE_USER" npm install
            sudo -u "$SERVICE_USER" npm run build
            cp -r dist/* /var/www/ibvap/ 2>/dev/null || mkdir -p /var/www/ibvap && cp -r dist/* /var/www/ibvap/
        else
            log_warn "npm not found, skipping dashboard build"
        fi
    fi
}

main() {
    echo "Starting IBVAP installation..."
    
    check_root
    check_os
    install_dependencies
    setup_user
    setup_directories
    install_python_deps
    setup_redis
    setup_postgresql
    setup_supervisor
    setup_nginx
    setup_firewall
    create_env
    build_dashboard
    
    log_info "=========================================="
    log_info "IBVAP installation complete!"
    log_info "=========================================="
    log_info "Services managed by Supervisor:"
    log_info "  - ibvap-api (port 8000)"
    log_info "  - ibvap-detector (GPU)"
    log_info "  - ibvap-tracker"
    log_info "  - ibvap-alerts"
    log_info "  - ibvap-recorder"
    log_info ""
    log_info "Access dashboard at: http://<server-ip>"
    log_info "API docs at: http://<server-ip>:8000/docs"
    log_info ""
    log_info "Configuration: $INSTALL_DIR/.env"
    log_info "Data directory: $DATA_DIR"
    log_info "Logs: $LOG_DIR"
    log_info ""
    log_warn "Remember to:"
    log_warn "  1. Update .env with your camera RTSP URLs"
    log_warn "  2. Configure zones in zones.json"
    log_warn "  3. Set up SSL certificates for production"
    log_warn "  4. Change default passwords!"
}

main "$@"