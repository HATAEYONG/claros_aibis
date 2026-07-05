# 프로덕션 배포 가이드
DB 설정 모델 기반 연결 제어 시스템 배포

## 배포 준비물

### 1. 필수 파일
- SSH 키 파일 ( Lightsail 접속용 )
- 배포 스크립트:
  - `deploy/update-prod-connection-config.sh` (메인 배포)
  - `deploy/backup_prod_db.sh` (DB 백업)
  - `deploy/apply_prod_migrations.sh` (마이그레이션)
  - `deploy/create_prod_configs.sh` (설정 생성)

### 2. 수정된 파일 목록
- `backend/erp_sync/models.py` - ERPConnectionConfigModel 모델 추가
- `backend/erp_sync/services/erp_connection_service.py` - DB 모델 기반 리라이트
- `backend/erp_sync/erp_connection_config.py` - 리팩토링
- `backend/erp_sync/serializers/connection_config_serializers.py`
- `backend/erp_sync/views/connection_config_views.py`
- `backend/erp_sync/urls.py` - URL 라우팅 추가
- `backend/erp_sync/management/commands/import_backup_db.py`
- `backend/erp_sync/management/commands/test_connection_toggle_v2.py`
- `backend/erp_sync/migrations/0010_add_connection_config_model.py`

## 배포 절차

### 1단계: DB 백업 (필수)
```bash
# 프로덕션 서버에서 직접 실행 또는 배포 스크립트 포함 실행
ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126
cd ~/claros-mis
chmod +x backup_prod_db.sh && ./backup_prod_db.sh
```

### 2단계: 업데이트 배포 실행
```bash
# 로컬에서 실행
chmod +x deploy/update-prod-connection-config.sh
./deploy/update-prod-connection-config.sh ~/.ssh/lightsail-key.pem
```

### 3단계: 배포 확인
```bash
# 컨테이너 상태 확인
ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126 \
  "cd ~/claros-mis && docker compose ps"

# 연결 설정 확인
curl http://52.79.230.126/api/erp-sync/connection-config/

# 로그 확인
ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126 \
  "cd ~/claros-mis && docker compose logs --tail=50 backend"
```

## 배포 후 검증

### API 테스트
```bash
# 연결 설정 목록
curl http://52.79.230.126/api/erp-sync/connection-config/

# 연결 테스트
curl -X POST http://52.79.230.126/api/erp-sync/connection-config/test-connection/ \
  -H "Content-Type: application/json" \
  -d '{"source_code": "YH"}'

# 연결 토글 (비활성화)
curl -X POST http://52.79.230.126/api/erp-sync/connection-config/toggle-connection/ \
  -H "Content-Type: application/json" \
  -d '{"source_code": "YH", "enabled": false}'
```

### 관리 명령어 테스트
```bash
# 연결 토글 테스트
ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126 \
  "cd ~/claros-mis && docker compose exec backend python manage.py test_connection_toggle_v2"

# SQL 덤프 import (덤프 파일 준비 후)
ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126 \
  "cd ~/claros-mis && docker compose exec backend python manage.py import_backup_db --dump-file /path/to/dump.sql"
```

## 롤백 절차

문제 발생 시 이전 버전으로 복구:
```bash
# 1. DB 롤백
ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126
cd ~/claros-mis
sudo cp /var/backups/claros-mis/db_YYYYMMDD_HHMMSS.sqlite3 db.sqlite3

# 2. 컨테이너 재시작
docker compose restart backend

# 3. 이전 코드 복구 (git reset 또는 백업 파일 사용)
```

## 주의사항

1. **DB 백업 필수**: 배포 전 반드시 DB 백업을 실행하세요
2. **테스트 환경 먼저**: 로컬에서 충분히 테스트 후 프로덕션에 배포하세요
3. **모니터링**: 배포 후 로그를 모니터링하여 이상 확인
4. **YH 연결 주의**: YH 원격 DB 연결 설정은 신중하게 처리하세요

## 연락처

배포 문제 발생 시:
- 배포 로그: `docker compose logs backend`
- 서버 접속: `ssh -i ~/.ssh/lightsail-key.pem ubuntu@52.79.230.126`
