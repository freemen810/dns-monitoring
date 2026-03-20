# Multi-stage build for DNS Monitoring
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Final runtime (nginx + Node backend)
FROM node:20-alpine
RUN apk add --no-cache nginx

WORKDIR /app

# Copy backend files and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy backend source
COPY backend/src ./backend/src

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -S appuser && adduser -S appuser -G appuser && \
    chown -R appuser:appuser /app /usr/share/nginx/html /etc/nginx

EXPOSE 80 3000

# Start both nginx and backend
CMD ["sh", "-c", "nginx -g 'daemon off;' & cd /app/backend && npm start"]
