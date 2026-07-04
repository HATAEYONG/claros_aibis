# Multi-stage Docker build for Claros MIS AI Dashboard
# 백엔드와 프론트엔드를 모두 포함한 통합 Docker 이미지

# Stage 1: Frontend Build
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY claros-mis-frontend/package*.json ./
COPY claros-mis-frontend/tsconfig.json ./
COPY claros-mis-frontend/vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy frontend source and build
COPY claros-mis-frontend/src ./src
COPY claros-mis-frontend/public ./public
COPY claros-mis-frontend/index.html .

# Build frontend
RUN npm run build

# Stage 2: Backend
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY claros-mis-backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY claros-mis-backend/ .

# Collect static files
RUN python manage.py collectstatic --noinput

# Stage 3: Production Image with Nginx
FROM nginx:alpine

# Install Python for backend execution
RUN apk add --no-cache python3 py3-pip

# Copy backend application
COPY --from=backend /app /app

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app && python manage.py migrate --noinput' >> /start.sh && \
    echo 'python manage.py runserver 0.0.0.0:8000 &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Expose ports
EXPOSE 80 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Start services
CMD ["/start.sh"]
