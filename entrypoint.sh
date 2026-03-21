#!/bin/sh
################################################################################
# DNS Monitoring - All-in-One Container Entrypoint
#
# Starts both nginx (frontend) and Node.js backend in one container
# with proper signal handling and process management
################################################################################

set -e

# Color output for clarity
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Trap signals for graceful shutdown
trap 'handle_shutdown' TERM INT

handle_shutdown() {
    echo "[shutdown] Received shutdown signal, terminating services..."
    kill %1 %2 2>/dev/null || true
    exit 0
}

# ============================================================================
# Start Services
# ============================================================================

echo "${GREEN}[startup]${NC} Starting DNS Monitoring (all-in-one container)..."
echo ""

# Start Nginx in background
echo "${BLUE}[nginx]${NC} Starting nginx on port 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Give nginx a moment to start
sleep 1

# Start Node.js backend in background
echo "${BLUE}[backend]${NC} Starting Node.js backend on port 3000..."
cd /app/backend
node src/index.js &
BACKEND_PID=$!

echo ""
echo "${GREEN}[startup]${NC} Services started:"
echo "  - nginx (PID: $NGINX_PID)"
echo "  - backend (PID: $BACKEND_PID)"
echo ""
echo "${GREEN}[startup]${NC} Application ready!"
echo "  Frontend: http://localhost/"
echo "  API: http://localhost/api"
echo "  Health: curl http://localhost/api/health"
echo ""

# Wait for both processes, keep container running
wait $NGINX_PID $BACKEND_PID

# If we get here, one of the processes exited
EXIT_CODE=$?
echo "${RED}[error]${NC} Service terminated with code $EXIT_CODE"
exit $EXIT_CODE
