# AWS Lightsail 배포 명령어 (브라우저 SSH 콘솔에서 복사해서 사용)

## 1. 서버 접속 후 한 번에 실행할 전체 명령어

```bash
# Docker 설치
curl -fsSL https://get.docker.com | sudo sh

# 프로젝트 디렉토리 생성
mkdir -p ~/claros-mis/claros-mis-backend
mkdir -p ~/claros-mis/claros-mis-frontend
mkdir -p ~/claros-mis/config

# Docker Compose 파일 생성
cat > ~/claros-mis/docker-compose.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  backend:
    build: ./claros-mis-backend
    container_name: claros-backend
    restart: always
    environment:
      DEBUG: False
      SECRET_KEY: prod-secret-key-change-in-production-52-79-230-126
      ALLOWED_HOSTS: 52.79.230.126,.amazonaws.com,localhost
      DB_ENGINE: django.db.backends.sqlite3
      CORS_ALLOW_ALL_ORIGINS: "False"
      CORS_ALLOWED_ORIGINS: http://52.79.230.126,https://52.79.230.126
    volumes:
      - backend_static:/app/staticfiles
      - backend_media:/app/media
    ports:
      - "8000:8000"

  frontend:
    build: ./claros-mis-frontend
    container_name: claros-frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  backend_static:
  backend_media:
DOCKERCOMPOSE
```

## 2. Backend Dockerfile

```bash
cat > ~/claros-mis/claros-mis-backend/Dockerfile << 'DOCKERFILE'
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
DOCKERFILE
```

## 3. Frontend Dockerfile

```bash
cat > ~/claros-mis/claros-mis-frontend/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config
cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /swagger/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /static/ {
        proxy_pass http://backend:8000;
    }
}
NGINX

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE
```

## 4. 빌드 및 실행

```bash
cd ~/claros-mis
docker compose build
docker compose up -d
```

## 5. 확인

```bash
# 컨테이너 상태
docker compose ps

# 로그 확인
docker compose logs -f
```
