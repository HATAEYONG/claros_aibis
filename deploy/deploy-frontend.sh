#!/bin/bash
# ============================================================
# Claros MIS-AI Dashboard Frontend만 재배포
# 코드 수정 후 실행
# ============================================================

set -e

FRONTEND_DIR="/var/www/claros-mis/frontend"
BACKUP_DIR="/var/www/claros-mis/backup"

echo "=========================================="
echo "  Frontend 재배포 시작"
echo "=========================================="

# 백업 생성
echo ""
echo "[1/4] 기존 빌드 백업..."
sudo mkdir -p $BACKUP_DIR
sudo cp -r $FRONTEND_DIR/dist $BACKUP_DIR/dist-$(date +%Y%m%d_%H%M%S) || true

# 소스 코드 업데이트 (git pull 또는 rsync)
echo ""
echo "[2/4] 소스 코드 업데이트..."
# cd /home/ubuntu/claros-mis-frontend && git pull
# cp -r /home/ubuntu/claros-mis-frontend/* $FRONTEND_DIR/

# npm install 및 빌드
echo ""
echo "[3/4] npm install & build..."
cd $FRONTEND_DIR
npm install
npm run build

# 권한 설정
echo ""
echo "[4/4] 권한 설정..."
sudo chown -R www-data:www-data $FRONTEND_DIR
sudo chmod -R 755 $FRONTEND_DIR

echo ""
echo "=========================================="
echo "  Frontend 재배포 완료!"
echo "=========================================="
