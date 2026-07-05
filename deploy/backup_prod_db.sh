#!/bin/bash
# ============================================================
# 프로덕션 DB 백업 스크립트
# 배포 전 필수 실행
#
# 실제 프로덕션 구성 (ax.claros.co.kr / Lightsail 3.38.107.23):
#   - 프로젝트 디렉터리: /home/ubuntu/netplus-mis
#   - compose 파일: docker-compose.lightsail.yml
#   - DB는 호스트가 아니라 netplus-postgres 컨테이너 안에서 동작 (Docker 기반)
# ============================================================

set -e

PROJECT_DIR="/home/ubuntu/netplus-mis"
DB_CONTAINER="netplus-postgres"
DB_NAME="netplus_mis"
DB_USER="netplus_user"

BACKUP_DIR="/home/ubuntu/db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="netplus_mis_backup_${TIMESTAMP}.sql"

echo "=========================================="
echo "  프로덕션 DB 백업 시작"
echo "=========================================="

cd "$PROJECT_DIR"

mkdir -p "$BACKUP_DIR"

echo ""
echo "[1/3] 백업 디렉토리: $BACKUP_DIR"

echo ""
echo "[2/3] netplus-postgres 컨테이너에서 pg_dump 실행..."

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "DB 컨테이너(${DB_CONTAINER})가 실행 중이 아닙니다"
    exit 1
fi

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

echo "백업 완료: $BACKUP_DIR/$BACKUP_FILE"
ls -lh "$BACKUP_DIR/$BACKUP_FILE"

# 최근 백업 유지 (최근 7개만 보관)
echo ""
echo "[3/3] 오래된 백업 정리..."
find "$BACKUP_DIR" -name "netplus_mis_backup_*" -mtime +7 -delete

echo ""
echo "=========================================="
echo "  백업 완료!"
echo "=========================================="
echo ""
echo "백업 파일:"
ls -lt "$BACKUP_DIR" | head -5
