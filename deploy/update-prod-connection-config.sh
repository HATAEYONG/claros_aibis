#!/bin/bash
# ============================================================
# 프로덕션 업데이트 배포 스크립트
# DB 설정 모델 기반 연결 제어 시스템 배포
#
# 실제 프로덕션 구성 (ax.claros.co.kr / Lightsail 3.38.107.23):
#   - 프로젝트 디렉터리: /home/ubuntu/netplus-mis (git 저장소)
#   - compose 파일: docker-compose.lightsail.yml
#   - 컨테이너: claros-backend, claros-frontend, netplus-postgres
# 개별 파일을 scp로 올리는 대신, 이미 origin/main에 커밋된 코드를
# 서버에서 그대로 git pull 받아 백엔드 이미지를 재빌드하는 방식을 사용한다
# (이 프로젝트에서 실제로 검증된 배포 절차와 동일).
# ============================================================

set -e

# 설정 변수
SERVER_IP="3.38.107.23"
SERVER_USER="ubuntu"
KEY_PATH="$1"  # SSH 키 경로 (첫 번째 인자)
PROJECT_DIR="/home/ubuntu/netplus-mis"
COMPOSE_FILE="docker-compose.lightsail.yml"

if [ -z "$KEY_PATH" ]; then
    echo "사용법: $0 <ssh-key-path>"
    echo "예시: $0 ~/.ssh/LightsailDefaultKey-ap-northeast-2.pem"
    exit 1
fi

echo "=========================================="
echo "  DB 설정 모델 업데이트 배포"
echo "  서버: $SERVER_IP"
echo "=========================================="

# 1. DB 백업 (원격 서버에서 실행)
echo ""
echo "[1/6] DB 백업..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    deploy/backup_prod_db.sh \
    $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP \
    "cd $PROJECT_DIR && chmod +x backup_prod_db.sh && ./backup_prod_db.sh"

# 2. 최신 코드 pull + 백엔드 이미지 재빌드
echo ""
echo "[2/6] 최신 코드 pull 및 백엔드 재빌드..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP \
    "cd $PROJECT_DIR && git pull origin main && docker compose -f $COMPOSE_FILE build backend"

# 3. 컨테이너 재시작
echo ""
echo "[3/6] 컨테이너 재시작..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP \
    "cd $PROJECT_DIR && docker compose -f $COMPOSE_FILE up -d backend && sleep 15"

# 4. 마이그레이션 적용
echo ""
echo "[4/6] 마이그레이션 적용..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    deploy/apply_prod_migrations.sh \
    $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP \
    "cd $PROJECT_DIR && chmod +x apply_prod_migrations.sh && ./apply_prod_migrations.sh"

# 5. 기본 설정 생성
echo ""
echo "[5/6] 기본 설정 생성..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    deploy/create_prod_configs.sh \
    $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP \
    "cd $PROJECT_DIR && chmod +x create_prod_configs.sh && ./create_prod_configs.sh"

# 6. 배포 확인
echo ""
echo "[6/6] 배포 상태 확인..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
cd $PROJECT_DIR

echo ""
echo "=========================================="
echo "  컨테이너 상태"
echo "=========================================="
docker compose -f $COMPOSE_FILE ps

echo ""
echo "=========================================="
echo "  연결 설정 확인"
echo "=========================================="
docker compose -f $COMPOSE_FILE exec backend python manage.py shell -c "
from erp_sync.models import ERPConnectionConfigModel
print(f'총 설정 수: {ERPConnectionConfigModel.objects.count()}')
for c in ERPConnectionConfigModel.objects.all():
    print(f'  - {c.source_code}: {c.source_name} (' + ('활성' if c.is_enabled else '비활성') + ')')
"

echo ""
echo "=========================================="
echo "  API 테스트"
echo "=========================================="
curl -s http://localhost:8000/api/erp-sync/connection-config/ | python3 -m json.tool || echo "API 접속 실패"
ENDSSH

# 완료 메시지
echo ""
echo "=========================================="
echo "  업데이트 배포 완료!"
echo "=========================================="
echo ""
echo "배포된 기능:"
echo "  1. DB 설정 모델 (ERPConnectionConfigModel)"
echo "  2. 연결 제어 API (/api/erp-sync/connection-config/)"
echo "  3. SQL 덤프 import 명령"
echo "  4. 연결 테스트 명령"
echo ""
echo "유용한 명령어:"
echo "  - 연결 설정 조회: curl https://ax.claros.co.kr/api/erp-sync/connection-config/"
echo "  - YH 연결 비활성화: POST /api/erp-sync/connection-config/toggle-connection/"
echo "  - 연결 테스트: docker compose -f $COMPOSE_FILE exec backend python manage.py test_connection_toggle_v2"
echo ""
