################################################################################
# DNS Monitoring - Optimized All-in-One Docker Image
#
# Architecture: Single container with nginx (frontend) + Node.js (backend)
#   - Stage 1: Build React frontend with Vite
#   - Stage 2: Runtime - nginx serves static assets, Node.js runs API
#
# Build: docker build -t dns-monitoring .
# Run:   docker-compose -f docker-compose.prod.yml up -d
################################################################################

# ============================================================================
# STAGE 1: Build Frontend (React + Vite)
# ============================================================================
FROM node:20-alpine AS frontend-build

LABEL stage=builder
WORKDIR /app/frontend

# Copy dependencies first for better layer caching
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Verify build output
RUN test -d dist || (echo "Frontend build failed" && exit 1)


# ============================================================================
# STAGE 2: Runtime - Nginx + Node Backend (All-in-One)
# ============================================================================
FROM node:20-alpine

LABEL maintainer="DNS Monitoring"
LABEL description="DNS Monitoring - All-in-one container (nginx + backend)"

# Install nginx and dumb-init (better process management)
RUN apk add --no-cache \
    nginx \
    dumb-init \
    curl

WORKDIR /app

# ============================================================================
# Backend Setup
# ============================================================================

# Copy backend dependencies first (better layer caching)
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy backend source code
COPY backend/src ./src

WORKDIR /app

# ============================================================================
# Frontend Setup
# ============================================================================

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# ============================================================================
# Nginx Configuration
# ============================================================================

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx cache directory
RUN mkdir -p /var/cache/nginx && \
    chmod 755 /var/cache/nginx

# ============================================================================
# Security: Non-Root User
# ============================================================================

# Create app user with minimal privileges
RUN addgroup -S appuser && \
    adduser -S appuser -G appuser

# Set proper permissions
RUN chown -R appuser:appuser /app \
    && chown -R appuser:appuser /usr/share/nginx/html \
    && chown -R appuser:appuser /var/cache/nginx \
    && chown -R appuser:appuser /etc/nginx \
    && chmod 755 /app

# ============================================================================
# Startup Script
# ============================================================================

# Copy entrypoint script for proper process management
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    chown appuser:appuser /app/entrypoint.sh

# ============================================================================
# Health Check
# ============================================================================

# Health check for orchestration (Docker Compose, Kubernetes, etc.)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# ============================================================================
# Metadata & Ports
# ============================================================================

# Expose ports:
# 80   = Nginx (frontend + reverse proxy to backend)
# 3000 = Node.js backend API (internal, proxied through nginx)
EXPOSE 80 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV PATH=/app/backend/node_modules/.bin:$PATH

# ============================================================================
# Startup
# ============================================================================

# Use dumb-init to handle signals properly (PID 1 process management)
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["/app/entrypoint.sh"]

# ============================================================================
# Image Info
# ============================================================================
#
# All-in-One Architecture:
#
#   Client (Browser)
#     |
#     v
#   [nginx:80] ← Frontend assets + reverse proxy
#     |
#     ├─→ GET /        → /usr/share/nginx/html/index.html (static)
#     ├─→ GET /assets/* → /usr/share/nginx/html/assets/* (static)
#     └─→ /api/*       → localhost:3000 (proxied to backend)
#     |
#     v
#   [Node.js:3000] ← Backend API
#     |
#     v
#   [SQLite] ← Database
#
# Volumes:
#   /app/data         = SQLite database persistence
#   /var/cache/nginx  = Nginx cache (optional)
#
# Environment Variables:
#   NODE_ENV=production
#   PORT=3000
#   Plus: CORS_ORIGIN, VITE_API_URL, etc. (from .env.prod)
#
############################################################################
