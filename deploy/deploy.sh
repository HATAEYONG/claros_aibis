#!/bin/bash
# ============================================================
# NetPlus MIS-AI Dashboard 배포 스크립트
# AWS Lightsail Ubuntu 서버용
# ============================================================

set -e

# 설정 변수
PROJECT_NAME="netplus-mis"
BACKEND_DIR="/var/www/$PROJECT_NAME/backend"
FRONTEND_DIR="/var/www/$PROJECT_NAME/frontend"
VENV_DIR="/var/www/$PROJECT_NAME/venv"
LOG_DIR="/var/log/$PROJECT_NAME"
SERVICE_NAME="netplus-mis"

echo "=========================================="
echo "  NetPlus MIS-AI Dashboard 배포 시작"
echo "=========================================="

# ============================================================
# 1. 시스템 패키지 업데이트
# ============================================================
echo ""
echo "[1/9] 시스템 패키지 업데이트..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ============================================================
# 2. 필수 패키지 설치
# ============================================================
echo ""
echo "[2/9] 필수 패키지 설치..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    postgresql \
    postgresql-contrib \
    libpq-dev \
    build-essential \
    git \
    curl \
    ufw

# ============================================================
# 3. PostgreSQL 설정
# ============================================================
echo ""
echo "[3/9] PostgreSQL 설정..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $PROJECT_NAME;" || true
sudo -u postgres psql -c "DROP USER IF EXISTS netplus_user;" || true
sudo -u postgres psql -c "CREATE USER netplus_user WITH PASSWORD 'netplus_password_2024';"
sudo -u postgres psql -c "CREATE DATABASE $PROJECT_NAME OWNER netplus_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $PROJECT_NAME TO netplus_user;"

# ============================================================
# 4. 프로젝트 디렉토리 생성
# ============================================================
echo ""
echo "[4/9] 프로젝트 디렉토리 생성..."
sudo mkdir -p /var/www/$PROJECT_NAME
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p /var/run/$PROJECT_NAME

# ============================================================
# 5. Python 가상환경 및 Backend 설치
# ============================================================
echo ""
echo "[5/9] Python 가상환경 및 Backend 설치..."
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Backend 파일 복사 (실제 배포 시 git clone 또는 rsync 사용)
cp -r /home/ubuntu/netplus-mis-backend/* $BACKEND_DIR/

# 패키지 설치
pip install --upgrade pip
pip install -r $BACKEND_DIR/requirements.txt

# 환경변수 설정
cp $BACKEND_DIR/.env.production $BACKEND_DIR/.env
sed -i "s/your-db-password/netplus_password_2024/g" $BACKEND_DIR/.env
sed -i "s/DEBUG=True/DEBUG=False/g" $BACKEND_DIR/.env

# Django 마이그레이션
cd $BACKEND_DIR
python manage.py collectstatic --noinput
python manage.py migrate

# ============================================================
# 6. Frontend 빌드
# ============================================================
echo ""
echo "[6/9] Frontend 빌드..."
cd $FRONTEND_DIR

# Node.js 설치 (필요한 경우)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Frontend 파일 복사 (실제 배포 시 git clone 또는 rsync 사용)
cp -r /home/ubuntu/netplus-mis-frontend/* $FRONTEND_DIR/

# npm 설치 및 빌드
npm install
npm run build

# ============================================================
# 7. 권한 설정
# ============================================================
echo ""
echo "[7/9] 파일 권한 설정..."
sudo chown -R www-data:www-data /var/www/$PROJECT_NAME
sudo chmod -R 755 /var/www/$PROJECT_NAME

# ============================================================
# 8. Nginx 설정
# ============================================================
echo ""
echo "[8/9] Nginx 설정..."
sudo cp -f /home/ubuntu/deploy/nginx.conf /etc/nginx/sites-available/$PROJECT_NAME
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# ============================================================
# 9. Gunicorn 서비스 설정
# ============================================================
echo ""
echo "[9/9] Gunicorn 서비스 설정..."
sudo cp -f /home/ubuntu/deploy/gunicorn.service /etc/systemd/system/$SERVICE_NAME.service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

# ============================================================
# 방화벽 설정
# ============================================================
echo ""
echo "방화벽 설정..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# ============================================================
# 완료
# ============================================================
echo ""
echo "=========================================="
echo "  배포 완료!"
echo "=========================================="
echo ""
echo "서비스 상태:"
sudo systemctl status $SERVICE_NAME --no-pager
sudo systemctl status nginx --no-pager
echo ""
echo "=========================================="
echo "  접속 정보"
echo "=========================================="
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/"
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/"
echo "Swagger: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/swagger/"
echo ""
