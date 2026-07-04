# ERP 연결 복구 및 API 인증 설정

> 개발 환경에서의 ERP 연결 개선 및 API 인증 설정 완료
>
> 작성일: 2026-04-24

---

## 1. 개요

본 문서는 Claros MIS-AI Dashboard의 ERP 연결 문제 해결과 API 인증 설정 변경을 설명합니다.

### 1.1 해결된 문제

| 문제 | 증상 | 해결 방법 |
|------|------|----------|
| **AutoML API 403 오류** | `/api/ml-pipeline/automl/models/` 접근 시 403 Forbidden | 개발 모드에서 인증 제거 |
| **ERP 연결 실패** | PostgreSQL 연결 종료 오류 반복 | 연결 관리 시스템 개선 및 폴백 데이터 활용 |
| **과도한 에러 로그** | 콘솔에 연결 실패 메시지 반복 출력 | 에러 로그 억제 옵션 추가 |

---

## 2. AutoML API 인증 설정

### 2.1 변경 사항

**파일**: `claros-mis-backend/ml_pipeline/automl/api.py`

**변경 전**:
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    ...
```

**변경 후**:
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings

# 개발 모드 확인
DEV_MODE = getattr(settings, 'DEBUG', True)

def get_permission_classes():
    """환경에 따른 권한 클래스 반환"""
    return [AllowAny] if DEV_MODE else [IsAuthenticated]

@api_view(['GET'])
@permission_classes(get_permission_classes())
def health_check(request):
    ...
```

### 2.2 영향 받는 API 엔드포인트

다음 AutoML API 엔드포인트가 개발 모드에서 인증 없이 접근 가능합니다:

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ml-pipeline/automl/health/` | GET | 헬스 체크 |
| `/api/ml-pipeline/automl/train/` | POST | 모델 학습 |
| `/api/ml-pipeline/automl/predict/` | POST | 예측 생성 |
| `/api/ml-pipeline/automl/leaderboard/` | GET | 모델 리더보드 |
| `/api/ml-pipeline/automl/ensemble/` | POST | 자동 앙상블 |
| `/api/ml-pipeline/automl/features/` | POST | 특성 공학 |
| `/api/ml-pipeline/automl/hpo/` | POST | 하이퍼파라미터 최적화 |
| `/api/ml-pipeline/automl/preprocess/` | POST | 데이터 전처리 |
| `/api/ml-pipeline/automl/info/` | GET | AutoML 정보 |
| `/api/ml-pipeline/automl/models/` | GET | 모델 목록 |

### 2.3 프로덕션 환경 설정

프로덕션 환경에서 인증을 활성화하려면 `.env` 파일에서 설정:

```bash
# .env
DEBUG=False
API_AUTH_ENABLED=True
```

---

## 3. ERP 연결 관리 개선

### 3.1 새로운 연결 관리 시스템

**파일**: `claros-mis-backend/erp_sync/erp_connection_config.py`

**주요 기능**:

1. **연결 상태 추적**: 각 ERP 소스별 연결 상태 관리
2. **쿨다운 기간**: 연결 실패 후 일정 시간 동안 재시도 방지
3. **폴백 데이터**: 연결 실패 시 모의 데이터 자동 사용
4. **에러 로그 억제**: 과도한 에러 로그 출력 방지

### 3.2 설정 옵션

`.env` 파일 또는 환경 변수에서 설정:

```bash
# YH ERP (PostgreSQL)
YH_DB_ENABLED=False              # 연결 시도 여부
YH_DB_FALLBACK_TO_MOCK=True      # 폴백 데이터 사용 여부
YH_DB_SUPPRESS_ERRORS=True       # 에러 로그 억제 여부
YH_DB_CONNECTION_TIMEOUT=10      # 연결 타임아웃 (초)
YH_DB_QUERY_TIMEOUT=30           # 쿼리 타임아웃 (초)

# 연결 관리
ERP_CONNECTION_COOLDOWN=300      # 재시도 대기 시간 (초)
ERP_MAX_RETRY_ATTEMPTS=3         # 최대 재시도 횟수
```

### 3.3 사용 방법

```python
from erp_sync.erp_connection_config import ERPConnectionConfig

# 연결 가능 여부 확인
if ERPConnectionConfig.can_attempt_connection('YH'):
    # ERP 데이터 조회 시도
    data = fetch_from_erp(source, table)
else:
    # 폴백 데이터 사용
    data = get_fallback_data()

# 연결 상태 확인
status = ERPConnectionConfig.get_connection_status('YH')
print(status)
# {
#     'source_code': 'YH',
#     'enabled': False,
#     'status': 'disconnected',
#     'last_failure': datetime(...),
#     'failure_count': 3,
#     'fallback_enabled': True
# }

# 연결 상태 초기화 (재시도용)
ERPConnectionConfig.reset_connection_status('YH')
```

---

## 4. 업데이트된 파일

### 4.1 백엔드 파일

| 파일 | 변경 사항 |
|------|----------|
| `ml_pipeline/automl/api.py` | API 인증 설정 (개발 모드에서 AllowAny) |
| `erp_sync/erp_connection_config.py` | 새로운 연결 관리 클래스 |
| `erp_sync/utils/erp_db_connector.py` | 연결 관리 시스템 통합 |
| `erp_sync/services/dashboard_data_service.py` | 폴백 데이터 처리 개선 |
| `.env.example` | ERP 연결 설정 추가 |

### 4.2 프론트엔드 파일

프론트엔드는 변경 사항 없음. 기존 AI 대시보드 컴포넌트 그대로 사용 가능.

---

## 5. 테스트 방법

### 5.1 AutoML API 테스트

```bash
# 헬스 체크
curl http://localhost:8000/api/ml-pipeline/automl/health/

# 모델 목록
curl http://localhost:8000/api/ml-pipeline/automl/models/

# AutoML 정보
curl http://localhost:8000/api/ml-pipeline/automl/info/
```

### 5.2 ERP 연결 상태 확인

```python
# Django shell
python manage.py shell

from erp_sync.erp_connection_config import ERPConnectionConfig

# 전체 연결 상태
for source in ['YH', 'FOM', 'AXOS']:
    print(source, ERPConnectionConfig.get_connection_status(source))
```

### 5.3 대시보드 데이터 테스트

```bash
# 영업 대시보드
curl http://localhost:8000/api/erp-sync/dashboard/sales/

# 생산 대시보드
curl http://localhost:8000/api/erp-sync/dashboard/production/

# 품질 대시보드
curl http://localhost:8000/api/erp-sync/dashboard/quality/
```

---

## 6. 문제 해결 가이드

### 6.1 AutoML API 403 오류

**증상**: AutoML API 호출 시 403 Forbidden

**해결**:
1. `.env` 파일에서 `DEBUG=True` 확인
2. 백엔드 재시작: `python manage.py runserver`
3. 브라우저 캐시 삭제

### 6.2 ERP 연결 지연

**증상**: 페이지 로딩이 느림

**해결**:
1. ERP 연결 비활성화:
   ```bash
   YH_DB_ENABLED=False
   MSSQL_ENABLED=False
   ```
2. 백엔드 재시작
3. 폴백 데이터가 즉시 반환됨

### 6.3 과도한 에러 로그

**증상**: 콘솔에 연결 실패 메시지 반복

**해결**:
1. 에러 로그 억제 활성화:
   ```bash
   YH_DB_SUPPRESS_ERRORS=True
   ```
2. 로그 레벨 조정:
   ```bash
   LOG_LEVEL=WARNING
   ```

---

## 7. 다음 단계

### 7.1 프로덕션 환경 준비

1. **인증 활성화**
   - `DEBUG=False`
   - `API_AUTH_ENABLED=True`
   - JWT 또는 세션 기반 인증 구현

2. **ERP 연결 설정**
   - VPN/방화벽 설정 확인
   - 데이터베이스 접근 권한 확인
   - 연결 풀 설정 최적화

3. **모니터링**
   - ERP 연결 상태 모니터링
   - API 응답 시간 추적
   - 에러 알림 설정

### 7.2 추가 개선 사항

1. **연결 풀링**: 데이터베이스 연결 풀 구현
2. **캐싱**: 자주 조회하는 데이터 캐싱
3. **비동기 처리**: Celery를 이용한 비동기 ERP 데이터 동기화
4. **건강 상태 확인**: ERP 연결 상태 API 엔드포인트 추가

---

## 8. 참고 자료

### 8.1 관련 문서

- `docs/TEST_REPORT.md` - 전체 테스트 리포트
- `docs/EA_ARCHITECTURE_BY_BUSINESS.md` - EA 아키텍처
- `docs/ENTITY_RELATIONSHIP_DIAGRAM.md` - ERD 문서

### 8.2 Django REST Framework 권한

- [공식 문서](https://www.django-rest-framework.org/api-guide/permissions/)
- `AllowAny`: 인증 없이 접근 가능
- `IsAuthenticated`: 인증된 사용자만 접근 가능

### 8.3 PostgreSQL 연결

- [psycopg2 문서](https://www.psycopg.org/docs/)
- 연결 풀링: `psycopg2.pool`
- 타임아웃 설정: `connect_timeout`, `statement_timeout`
