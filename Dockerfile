# Multi-stage build for DNS Monitoring
# Stage 1: Build frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend runtime
FROM node:20-alpine
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy backend source
COPY backend/src ./backend/src

# Install nginx for serving frontend
FROM node:20-alpine as final
WORKDIR /app

# Copy node_modules and backend from previous stage
RUN apk add --no-cache nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY backend/package*.json ./backend/
COPY backend/src ./backend/src

WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app /usr/share/nginx/html

EXPOSE 80 3000

# Start both nginx and backend
CMD ["sh", "-c", "nginx -g 'daemon off;' & cd /app/backend && npm start"]
