#!/bin/bash
# ============================================================
# 프로덕션 마이그레이션 적용 스크립트
# DB 설정 모델(ERPConnectionConfigModel) 테이블 생성
#
# 실제 프로덕션 구성: /home/ubuntu/netplus-mis, docker-compose.lightsail.yml
# ============================================================

set -e

PROJECT_DIR="/home/ubuntu/netplus-mis"
COMPOSE_FILE="docker-compose.lightsail.yml"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  프로덕션 마이그레이션 적용 시작"
echo "=========================================="

# Docker 컨테이너 내에서 마이그레이션 실행
echo ""
echo "[1/2] Docker 컨테이너 확인..."
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "[2/2] 마이그레이션 적용..."
docker compose -f "$COMPOSE_FILE" exec backend python manage.py migrate erp_sync

echo ""
echo "=========================================="
echo "  마이그레이션 완료!"
echo "=========================================="

# 테이블 생성 확인
echo ""
echo "테이블 생성 확인:"
docker compose -f "$COMPOSE_FILE" exec backend python manage.py shell -c "
from erp_sync.models import ERPConnectionConfigModel
print('ERPConnectionConfigModel 테이블 존재 확인:')
print(f'  - 테이블명: {ERPConnectionConfigModel._meta.db_table}')
print(f'  - 필드 수: {len(ERPConnectionConfigModel._meta.get_fields())}')
"
