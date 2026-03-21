#!/bin/bash

################################################################################
# DNS Monitoring - Database Backup Script
# Creates timestamped backups of the SQLite database
#
# Usage:
#   ./backup.sh              # Backup to backups/ directory
#   ./backup.sh /path/to/dir # Backup to custom directory
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Get backup directory
BACKUP_DIR="${1:-.}/backups"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="dns-monitor-backup-${TIMESTAMP}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "=========================================="
log_info "DNS Monitoring Database Backup"
log_info "=========================================="
echo ""
log_info "Backup Directory: $BACKUP_DIR"
log_info "Backup Name: $BACKUP_NAME"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_warning "Docker daemon is not running"
    log_info "Attempting local backup instead..."

    if [ -d "dns-data" ]; then
        cp -r dns-data "$BACKUP_DIR/$BACKUP_NAME"
        log_success "Local backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_warning "No dns-data directory found"
        exit 1
    fi
    exit 0
fi

# Check if containers are running
if ! docker-compose -f docker-compose.prod.yml ps backend 2>/dev/null | grep -q "Up"; then
    log_warning "Backend container is not running"
    log_info "Attempting local backup instead..."

    if [ -d "dns-data" ]; then
        cp -r dns-data "$BACKUP_DIR/$BACKUP_NAME"
        log_success "Local backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_warning "No dns-data directory found"
        exit 1
    fi
    exit 0
fi

# Create backup from running container
log_info "Creating backup from running container..."

# Copy data from container volume
docker-compose -f docker-compose.prod.yml exec -T backend \
    tar czf - /app/data | \
    tar xzf - -C "$BACKUP_DIR"

# Rename extracted data directory
if [ -d "$BACKUP_DIR/app/data" ]; then
    mv "$BACKUP_DIR/app/data" "$BACKUP_DIR/$BACKUP_NAME"
    rm -rf "$BACKUP_DIR/app"
    log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
else
    log_warning "Could not extract backup, trying fallback method..."

    # Fallback: use volume mount directly
    docker cp dns-monitoring-backend:/app/data "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null || \
        cp -r dns-data "$BACKUP_DIR/$BACKUP_NAME"

    log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Get backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
log_success "Backup size: $BACKUP_SIZE"

# List recent backups
echo ""
log_info "Recent backups:"
ls -lhd "$BACKUP_DIR"/dns-monitor-backup-* 2>/dev/null | tail -5 | awk '{print "  " $9 " (" $5 ")"}'

# Cleanup old backups (keep last 10)
OLD_BACKUPS=$(ls -1d "$BACKUP_DIR"/dns-monitor-backup-* 2>/dev/null | wc -l)
if [ "$OLD_BACKUPS" -gt 10 ]; then
    log_warning "Found $OLD_BACKUPS backups (keeping last 10)"
    ls -1d "$BACKUP_DIR"/dns-monitor-backup-* | sort -r | tail -n +11 | while read backup; do
        rm -rf "$backup"
        log_info "Deleted old backup: $(basename $backup)"
    done
fi

echo ""
log_success "Backup complete!"
echo ""
echo "Restore with:"
echo "  ${BLUE}./restore.sh $BACKUP_DIR/$BACKUP_NAME${NC}"
echo ""
