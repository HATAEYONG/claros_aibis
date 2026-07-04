# React Frontend Dockerfile
# Multi-stage build for smaller image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (SSL support)
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
