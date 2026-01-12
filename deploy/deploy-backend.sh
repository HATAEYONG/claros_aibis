#!/bin/bash
# ============================================================
# NetPlus MIS-AI Dashboard Backend만 재배포
# 코드 수정 후 실행
# ============================================================

set -e

BACKEND_DIR="/var/www/netplus-mis/backend"
VENV_DIR="/var/www/netplus-mis/venv"
SERVICE_NAME="netplus-mis"

echo "=========================================="
echo "  Backend 재배포 시작"
echo "=========================================="

# 소스 코드 업데이트
echo ""
echo "[1/4] 소스 코드 업데이트..."
# cd /home/ubuntu/netplus-mis-backend && git pull
# sudo cp -r /home/ubuntu/netplus-mis-backend/* $BACKEND_DIR/

# 가상환경 활성화 및 패키지 업데이트
echo ""
echo "[2/4] Python 패키지 업데이트..."
source $VENV_DIR/bin/activate
pip install --upgrade pip
pip install -r $BACKEND_DIR/requirements.txt

# Django 마이그레이션 및 정적 파일
echo ""
echo "[3/4] Django 마이그레이션 및 static 파일..."
cd $BACKEND_DIR
python manage.py migrate
python manage.py collectstatic --noinput

# 서비스 재시작
echo ""
echo "[4/4] Gunicorn 서비스 재시작..."
sudo systemctl restart $SERVICE_NAME

# 상태 확인
echo ""
echo "=========================================="
echo "  Backend 재배포 완료!"
echo "=========================================="
sudo systemctl status $SERVICE_NAME --no-pager
