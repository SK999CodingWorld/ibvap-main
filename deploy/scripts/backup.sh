#!/bin/bash
# IBVAP Backup Script
# Usage: ./backup.sh [full|incremental]

set -e

BACKUP_TYPE="${1:-incremental}"
DATA_DIR="/var/lib/ibvap"
BACKUP_DIR="/mnt/backups/ibvap"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

backup_database() {
    log_info "Backing up PostgreSQL database..."
    pg_dump -h localhost -U ibvap -d ibvap | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"
    log_info "Database backup complete: db_${DATE}.sql.gz"
}

backup_recordings() {
    log_info "Backing up recordings..."
    if [[ "$BACKUP_TYPE" == "full" ]]; then
        tar -czf "$BACKUP_DIR/recordings_${DATE}.tar.gz" -C "$DATA_DIR" recordings/
    else
        # Incremental: only files modified in last 24 hours
        find "$DATA_DIR/recordings" -type f -mtime -1 -print0 | \
            tar -czf "$BACKUP_DIR/recordings_inc_${DATE}.tar.gz" --null -T -
    fi
    log_info "Recordings backup complete"
}

backup_models() {
    log_info "Backing up models..."
    tar -czf "$BACKUP_DIR/models_${DATE}.tar.gz" -C "$DATA_DIR" models/
    log_info "Models backup complete"
}

backup_config() {
    log_info "Backing up configuration..."
    tar -czf "$BACKUP_DIR/config_${DATE}.tar.gz" \
        /opt/ibvap/.env \
        /opt/ibvap/zones.json \
        /etc/supervisor/conf.d/ibvap.conf \
        /etc/nginx/sites-available/ibvap \
        2>/dev/null
    log_info "Configuration backup complete"
}

cleanup_old() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
    log_info "Cleanup complete"
}

main() {
    log_info "Starting $BACKUP_TYPE backup..."
    
    backup_database
    backup_recordings
    backup_models
    backup_config
    cleanup_old
    
    log_info "Backup completed successfully!"
    log_info "Backups stored in: $BACKUP_DIR"
}

main