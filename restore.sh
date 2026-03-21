#!/bin/bash

################################################################################
# DNS Monitoring - Database Restore Script
# Restores a backup of the SQLite database
#
# Usage:
#   ./restore.sh backups/dns-monitor-backup-20260321-120000
################################################################################

set -e

# Colors
RED='\033[0;31m'
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

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check backup path argument
if [ -z "$1" ]; then
    log_error "Backup path required"
    echo ""
    echo "Usage: ./restore.sh <backup-path>"
    echo ""
    echo "Example:"
    echo "  ./restore.sh backups/dns-monitor-backup-20260321-120000"
    echo ""
    echo "Available backups:"
    ls -1d backups/dns-monitor-backup-* 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_PATH="$1"

# Validate backup exists
if [ ! -d "$BACKUP_PATH" ] && [ ! -f "$BACKUP_PATH" ]; then
    log_error "Backup path not found: $BACKUP_PATH"
    exit 1
fi

# Get backup info
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" 2>/dev/null | cut -f1)
BACKUP_NAME=$(basename "$BACKUP_PATH")

clear
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  DNS Monitoring - Database Restore                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

log_info "=========================================="
log_info "Restore Configuration"
log_info "=========================================="
echo ""
echo "  Backup: $BACKUP_NAME"
echo "  Size: $BACKUP_SIZE"
echo "  Path: $BACKUP_PATH"
echo ""

log_warning "This will replace your current database with the backup!"
log_warning "Current data will be lost unless you created a backup first."
echo ""

# Confirmation
read -p "Are you sure you want to restore? (type 'yes' to confirm): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Create safety backup of current data
log_info "Creating safety backup of current data..."
if [ -d "dns-data" ]; then
    SAFETY_BACKUP="backups/pre-restore-$(date +%Y%m%d-%H%M%S)"
    mkdir -p backups
    cp -r dns-data "$SAFETY_BACKUP"
    log_success "Safety backup created: $SAFETY_BACKUP"
else
    log_warning "No current data directory found (fresh installation)"
fi

echo ""

# Check if containers are running
CONTAINERS_RUNNING=false
if docker info > /dev/null 2>&1 && \
   docker-compose -f docker-compose.prod.yml ps backend 2>/dev/null | grep -q "Up"; then
    CONTAINERS_RUNNING=true
    log_warning "Stopping containers..."
    docker-compose -f docker-compose.prod.yml stop backend nginx
    sleep 2
fi

# Restore data
log_info "Restoring database..."

if [ -f "$BACKUP_PATH/dns_monitor.db" ]; then
    # Single file restore
    mkdir -p dns-data
    cp "$BACKUP_PATH/dns_monitor.db" dns-data/
    log_success "Database restored"
elif [ -d "$BACKUP_PATH" ]; then
    # Directory restore
    rm -rf dns-data
    cp -r "$BACKUP_PATH" dns-data
    log_success "Database restored"
else
    log_error "Unrecognized backup format"
    exit 1
fi

# Set permissions
if [ -d "dns-data" ]; then
    chmod -R 755 dns-data
    log_success "Permissions set"
fi

# Restart containers if they were running
if [ "$CONTAINERS_RUNNING" = true ]; then
    log_info "Restarting containers..."
    docker-compose -f docker-compose.prod.yml up -d
    sleep 5

    # Wait for health check
    log_info "Waiting for backend to be healthy..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.prod.yml exec -T backend \
           curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        echo -n "."
        sleep 1
    done
fi

echo ""
log_success "=========================================="
log_success "Restore Complete!"
log_success "=========================================="
echo ""
echo "Database restored to: dns-data/"
echo ""
echo "Verify restoration:"
echo "  ${BLUE}docker-compose -f docker-compose.prod.yml logs backend${NC}"
echo ""
echo "Access your application:"
echo "  ${BLUE}curl http://localhost/api/health${NC}"
echo ""
