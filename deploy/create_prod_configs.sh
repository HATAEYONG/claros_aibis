#!/bin/bash
# ============================================================
# 프로덕션 연결 설정 생성 스크립트
# YH, LOCAL_BACKUP 연결 설정 생성
#
# 실제 프로덕션 구성: /home/ubuntu/netplus-mis, docker-compose.lightsail.yml
# ============================================================

set -e

PROJECT_DIR="/home/ubuntu/netplus-mis"
COMPOSE_FILE="docker-compose.lightsail.yml"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  프로덕션 연결 설정 생성 시작"
echo "=========================================="

echo ""
echo "[1/1] DB 설정 생성..."

docker compose -f "$COMPOSE_FILE" exec backend python manage.py shell << 'ENDPYTHON'
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from erp_sync.models import ERPConnectionConfigModel

# 로컬 백업 DB 설정: 실제로 도달 가능한 프로덕션 자체 postgres(netplus-postgres 컨테이너,
# 같은 docker 네트워크)를 가리키도록 설정한다 - 증강 생성된 실제 시계열 데이터가 이미 들어있음.
# 자격증명은 스크립트에 하드코딩하지 않고, 이 컨테이너가 이미 쓰고 있는 Django DB 설정에서
# 그대로 재사용한다 (docker-compose 환경변수로 주입된 값).
db_settings = settings.DATABASES['default']

local_config, _ = ERPConnectionConfigModel.objects.get_or_create(source_code='LOCAL_BACKUP')
local_config.source_name = '로컬 백업 DB (증강 데이터)'
local_config.source_type = 'postgresql'
local_config.description = 'YH 원격 연결 불가 시 사용하는 로컬 백업 DB. 실제 과거 패턴 기반 증강 시계열 데이터 보유.'
local_config.host = db_settings['HOST']
local_config.port = int(db_settings['PORT'])
local_config.database_name = db_settings['NAME']
local_config.schema_name = 'public'
local_config.username = db_settings['USER']
local_config.password = db_settings['PASSWORD']
local_config.is_enabled = True
local_config.use_fallback = False
local_config.save()

print(f"LOCAL_BACKUP 설정 완료")
print(f"  - 소스: {local_config.source_code}")
print(f"  - 이름: {local_config.source_name}")
print(f"  - 활성화: {local_config.is_enabled}")

# YH 원격 DB: 지금 비활성화하고, 폴백은 LOCAL_BACKUP으로 연결
yh_config, _ = ERPConnectionConfigModel.objects.get_or_create(source_code='YH')
yh_config.source_name = 'YH 원격 DB (프로덕션)'
yh_config.source_type = 'postgresql'
yh_config.description = '유한산업 YH 원격 PostgreSQL DB - 프로덕션 환경'
yh_config.host = '133.186.214.219'
yh_config.port = 27455
yh_config.database_name = 'YH'
yh_config.schema_name = 'public'
yh_config.username = 'yh'
yh_config.is_enabled = False  # 지금 비활성화
yh_config.use_fallback = True
yh_config.fallback_source = local_config
yh_config.connection_timeout = 10
yh_config.query_timeout = 30
yh_config.max_retry_attempts = 3
yh_config.cooldown_seconds = 300
yh_config.suppress_errors = True
yh_config.save()

print(f"YH 설정 완료")
print(f"  - 소스: {yh_config.source_code}")
print(f"  - 활성화: {yh_config.is_enabled}")
print(f"  - 폴백: {yh_config.fallback_source.source_code if yh_config.fallback_source else None}")

# 전체 설정 목록
print(f"\n총 설정 수: {ERPConnectionConfigModel.objects.count()}")
for config in ERPConnectionConfigModel.objects.all():
    status = "활성" if config.is_enabled else "비활성"
    print(f"  - {config.source_code}: {config.source_name} ({status})")
ENDPYTHON

echo ""
echo "=========================================="
echo "  설정 생성 완료!"
echo "=========================================="
