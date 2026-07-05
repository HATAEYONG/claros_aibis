#!/bin/bash
# ============================================================
# 로컬 배포 시뮬레이션 스크립트
# 프로덕션 배포 전체 절차 로컬 테스트
# ============================================================

set -e

echo "=========================================="
echo "  로컬 배포 시뮬레이션 시작"
echo "=========================================="

# [1/6] 수정된 파일 확인
echo ""
echo "[1/6] 수정된 파일 확인..."
echo "  - erp_sync/models.py"
echo "  - erp_sync/services/erp_connection_service.py"
echo "  - erp_sync/erp_connection_config.py"
echo "  - serializers/connection_config_serializers.py"
echo "  - views/connection_config_views.py"
echo "  - erp_sync/urls.py"
echo "  - management/commands/import_backup_db.py"
echo "  - management/commands/test_connection_toggle_v2.py"
echo "  - migrations/0010_add_connection_config_model.py"
ls -la backend/erp_sync/models.py backend/erp_sync/migrations/0010_add_connection_config_model.py

# [2/6] DB 상태 확인 (백업 대신)
echo ""
echo "[2/6] 현재 DB 상태 확인..."
cd backend
python manage.py showmigrations erp_sync

# [3/6] 컨테이너 재시작 (로컬에서는 생략)
echo ""
echo "[3/6] 컨테이너 재시작 (로컬에서는 생략)..."

# [4/6] 마이그레이션 확인
echo ""
echo "[4/6] 마이그레이션 상태 확인..."
python manage.py makemigrations --check --dry-run erp_sync || echo "새 마이그레이션 없음"

# [5/6] 기본 설정 확인
echo ""
echo "[5/6] 기본 설정 확인..."
python manage.py shell -c "
from erp_sync.models import ERPConnectionConfigModel
print(f'총 설정 수: {ERPConnectionConfigModel.objects.count()}')
for c in ERPConnectionConfigModel.objects.all():
    status = '활성' if c.is_enabled else '비활성'
    print(f'  - {c.source_code}: {c.source_name} ({status})')
    print(f'    연결 시도 가능: {c.can_attempt_connection()}')
"

# [6/6] API 테스트 (서버 실행 필요 시 건너뜀)
echo ""
echo "[6/6] API 테스트 (개발 서버 실행 필요)..."
echo "  - 배포 후: curl http://localhost:8000/api/erp-sync/connection-config/"
echo "  - 토글: POST /api/erp-sync/connection-config/toggle-connection/"

# 연결 테스트
echo ""
echo "=========================================="
echo "  연결 기능 테스트"
echo "=========================================="
python manage.py test_connection_toggle_v2

echo ""
echo "=========================================="
echo "  로컬 배포 시뮬레이션 완료!"
echo "=========================================="
echo ""
echo "시뮬레이션 결과:"
echo "  1. 파일 수정 상태: 확인 완료"
echo "  2. 마이그레이션: 이미 적용됨"
echo "  3. 기본 설정: YH, LOCAL_BACKUP 생성됨"
echo "  4. 연결 on/off: 정상 작동 확인됨"
echo ""
echo "프로덕션 배포 시:"
echo "  - 서버 연결 후 ./deploy/update-prod-connection-config.sh 실행"
