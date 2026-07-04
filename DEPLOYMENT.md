# Claros MIS-AI Dashboard - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Environment Setup](#development-environment-setup)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Cloud Platform Deployment](#cloud-platform-deployment)
8. [Environment Configuration](#environment-configuration)
9. [Database Setup](#database-setup)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions for deploying the Claros MIS-AI Dashboard in various environments, from development to production.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                    │
│                    Port: 80, 443                            │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Frontend Server        │  │   Backend Server         │
│   (React + Nginx)        │  │   (Django + Gunicorn)    │
│   Port: 3000 → 80        │  │   Port: 8000             │
└──────────────────────────┘  └──────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL      │  │  Redis           │  │  Elasticsearch   │
│  Port: 5432      │  │  Port: 6379      │  │  Port: 9200      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Prerequisites

### System Requirements

#### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 20 GB | 50+ GB SSD |
| OS | Linux/Windows/macOS | Ubuntu 20.04+ LTS |

#### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| PostgreSQL | 15+ | Production database |
| Redis | 7+ | Caching & queue |
| Nginx | 1.18+ | Web server |
| Docker | 20.10+ | Containerization |
| Docker Compose | 2.0+ | Multi-container |

---

## Development Environment Setup

### Backend Setup

```bash
# 1. Navigate to backend directory
cd claros-mis-backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Set up environment variables
copy .env.example .env
# Edit .env with your settings

# 6. Run migrations
python manage.py makemigrations
python manage.py migrate

# 7. Create superuser
python manage.py createsuperuser

# 8. Load initial data (optional)
python manage.py loaddata initial_data.json

# 9. Start development server
python manage.py runserver
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd claros-mis-frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
copy .env.example .env
# Edit .env with your settings

# 4. Start development server
npm run dev
```

### Verify Installation

```bash
# Backend
curl http://localhost:8000/api/health/

# Frontend
# Open browser: http://localhost:3000
```

---

## Production Deployment

### Server Preparation

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
sudo apt install -y python3-pip python3-venv nodejs npm postgresql redis-server nginx

# 3. Create application user
sudo useradd -m -s /bin/bash claros
sudo su - claros
```

### Backend Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/claros-mis-ai-dashboard.git
cd claros-mis-ai-dashboard/claros-mis-backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
nano .env
```

#### Production Environment Variables

```bash
# .env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

```bash
# 5. Run migrations
python manage.py migrate --noinput

# 6. Collect static files
python manage.py collectstatic --noinput

# 7. Create superuser
python manage.py createsuperuser --noinput

# 8. Configure Gunicorn
sudo nano /etc/systemd/system/claros-backend.service
```

#### Gunicorn Service Configuration

```ini
[Unit]
Description=Claros MIS Backend
After=network.target

[Service]
User=claros
Group=claros
WorkingDirectory=/home/claros/claros-mis-ai-dashboard/claros-mis-backend
Environment="PATH=/home/claros/claros-mis-ai-dashboard/claros-mis-backend/venv/bin"
ExecStart=/home/claros/claros-mis-ai-dashboard/claros-mis-backend/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/home/claros/claros-mis-ai-dashboard/claros-mis-backend.sock \
          config.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
# 9. Start service
sudo systemctl start claros-backend
sudo systemctl enable claros-backend
```

### Frontend Deployment

```bash
# 1. Navigate to frontend directory
cd claros-mis-frontend

# 2. Install dependencies
npm install

# 3. Build for production
npm run build

# 4. Configure Nginx
sudo nano /etc/nginx/sites-available/claros-mis
```

#### Nginx Configuration

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /home/claros/claros-mis-ai-dashboard/claros-mis-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://unix:/home/claros/claros-mis-ai-dashboard/claros-mis-backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /home/claros/claros-mis-ai-dashboard/claros-mis-backend/static/;
    }

    # Media files
    location /media/ {
        alias /home/claros/claros-mis-ai-dashboard/claros-mis-backend/media/;
    }
}
```

```bash
# 5. Enable site
sudo ln -s /etc/nginx/sites-available/claros-mis /etc/nginx/sites-enabled/

# 6. Test configuration
sudo nginx -t

# 7. Restart Nginx
sudo systemctl restart nginx
```

---

## Docker Deployment

### Quick Start with Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/your-org/claros-mis-ai-dashboard.git
cd claros-mis-ai-dashboard

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: claros_mis
      POSTGRES_USER: claros_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./claros-mis-backend
      dockerfile: Dockerfile
    environment:
      - DEBUG=False
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    volumes:
      - ./claros-mis-backend:/app
      - static_volume:/app/static
      - media_volume:/app/media
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./claros-mis-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  celery-worker:
    build:
      context: ./claros-mis-backend
      dockerfile: Dockerfile
    command: celery -A config worker --loglevel=info
    environment:
      - DEBUG=False
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    volumes:
      - ./claros-mis-backend:/app

  celery-beat:
    build:
      context: ./claros-mis-backend
      dockerfile: Dockerfile
    command: celery -A config beat --loglevel=info
    environment:
      - DEBUG=False
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    volumes:
      - ./claros-mis-backend:/app

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:
```

### Backend Dockerfile

```dockerfile
# claros-mis-backend/Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Create static directory
RUN mkdir -p /app/static /app/media

# Expose port
EXPOSE 8000

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
```

### Frontend Dockerfile

```dockerfile
# claros-mis-frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Kubernetes Deployment

### Namespace Configuration

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: claros-mis
```

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: claros-config
  namespace: claros-mis
data:
  DEBUG: "False"
  DB_HOST: "postgres-service"
  REDIS_HOST: "redis-service"
```

### Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: claros-secret
  namespace: claros-mis
type: Opaque
data:
  SECRET_KEY: <base64-encoded-secret>
  DB_PASSWORD: <base64-encoded-password>
```

### Backend Deployment

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: claros-mis
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: claros/backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: claros-config
        - secretRef:
            name: claros-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health/
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/readiness/
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: claros-mis
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: ClusterIP
```

### Apply Kubernetes Manifests

```bash
# Apply all configurations
kubectl apply -f k8s/

# Check status
kubectl get pods -n claros-mis
kubectl get services -n claros-mis

# View logs
kubectl logs -f deployment/backend -n claros-mis
```

---

## Cloud Platform Deployment

### AWS Deployment

#### Using AWS Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init

# 3. Create environment
eb create production

# 4. Deploy
eb deploy
```

#### Using AWS ECS

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name claros-mis-backend

# 2. Build and push image
docker build -t claros-mis-backend .
docker tag claros-mis-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/claros-mis-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/claros-mis-backend:latest

# 3. Update ECS service
aws ecs update-service --cluster claros-mis --service backend --force-new-deployment
```

### Google Cloud Platform Deployment

#### Using Google Cloud Run

```bash
# 1. Build and deploy
gcloud run deploy claros-backend \
  --image gcr.io/PROJECT_ID/claros-backend \
  --platform managed \
  --region REGION \
  --allow-unauthenticated

# 2. Get URL
gcloud run services describe claros-backend --platform managed --region REGION
```

### Azure Deployment

#### Using Azure Container Instances

```bash
# 1. Create resource group
az group create --name claros-mis-rg --location eastus

# 2. Create container instance
az container create \
  --resource-group claros-mis-rg \
  --name claros-backend \
  --image claros/backend:latest \
  --cpu 1 \
  --memory 2 \
  --ports 8000
```

---

## Environment Configuration

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Debug mode | `False` |
| `SECRET_KEY` | Django secret key | - |
| `ALLOWED_HOSTS` | Allowed hosts | `*` |
| `DB_ENGINE` | Database engine | `django.db.backends.sqlite3` |
| `DB_NAME` | Database name | `db.sqlite3` |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |
| `LLM_PROVIDER` | LLM provider | `ollama` |
| `OPENAI_API_KEY` | OpenAI API key | - |

---

## Database Setup

### PostgreSQL Setup

```bash
# 1. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 2. Create database and user
sudo -u postgres psql

CREATE DATABASE claros_mis;
CREATE USER claros_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE claros_mis TO claros_user;
\q

# 3. Enable required extensions
sudo -u postgres psql claros_mis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\q
```

### Database Backup

```bash
# Backup
pg_dump -U claros_user -h localhost claros_mis > backup_$(date +%Y%m%d).sql

# Restore
psql -U claros_user -h localhost claros_mis < backup_20241220.sql
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/claros"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="claros_mis"
DB_USER="claros_user"

mkdir -p $BACKUP_DIR

pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

---

## Monitoring and Logging

### Prometheus Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'claros-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
```

### Grafana Dashboards

Import pre-configured dashboards from `deploy/grafana_dashboards/` directory.

### Log Aggregation

```bash
# Filebeat configuration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/claros/app.log
  json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "claros-mis-%{+yyyy.MM.dd}"
```

---

## Backup and Recovery

### Backup Strategy

1. **Database Backups**: Daily automated backups
2. **Media Files**: Weekly backups
3. **Configuration Files**: Version controlled
4. **Application Code**: Git repository

### Recovery Procedure

```bash
# 1. Stop services
sudo systemctl stop claros-backend

# 2. Restore database
psql -U claros_user claros_mis < backup.sql

# 3. Restore media files
rsync -av /backup/media/ /var/www/claros/media/

# 4. Start services
sudo systemctl start claros-backend
```

---

## Troubleshooting

### Common Issues

#### Database Connection Error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U claros_user -h localhost claros_mis

# View logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### High Memory Usage

```bash
# Check memory usage
free -h

# Check process memory
ps aux --sort=-%mem | head

# Restart services
sudo systemctl restart claros-backend
```

#### Slow API Response

```bash
# Check database queries
python manage.py shell
>>> from django.db import connection
>>> connection.queries

# Enable slow query logging
# settings.py
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
        },
    }
}
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/health/

# Database connection
python manage.py dbshell

# Redis connection
redis-cli ping
```

---

## Security Hardening

### SSL/TLS Configuration

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Obtain certificate
sudo certbot --nginx -d yourdomain.com

# 3. Auto-renewal
sudo certbot renew --dry-run
```

### Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Security Headers

```nginx
# Add to Nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Performance Optimization

### Caching Configuration

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'claros',
        'TIMEOUT': 300,
    }
}
```

### Database Connection Pooling

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'MAX_CONNS': 20,
        }
    }
}
```

---

## Appendix

### Useful Commands

```bash
# Docker
docker-compose logs -f backend
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py migrate

# Kubernetes
kubectl get pods -n claros-mis
kubectl logs -f deployment/backend -n claros-mis
kubectl exec -it deployment/backend -n claros-mis -- python manage.py shell

# Systemd
sudo systemctl status claros-backend
sudo journalctl -u claros-backend -f
```

### Ports Reference

| Service | Port |
|---------|------|
| Frontend | 80, 443 |
| Backend | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Elasticsearch | 9200 |
| Prometheus | 9090 |
| Grafana | 3000 |

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-31
**Maintained By**: Claros DevOps Team
