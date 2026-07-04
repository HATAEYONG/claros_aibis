# YH Database Configuration Guide
## Claros MIS-AI Dashboard 실제 데이터베이스 연결 설정

### 데이터베이스 연결 정보

```
Host: 133.186.214.219
Port: 27455
Database: YH
User: yh
Password: db!@yh#$1!
SSL Mode: require
```

### Django 설정 (settings.py)

이미 `claros-mis-backend/config/settings.py`에 설정이 적용되었습니다:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'YH',
        'USER': 'yh',
        'PASSWORD': 'db!@yh#$1!',
        'HOST': '133.186.214.219',
        'PORT': '27455',
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': 'require',
        },
        'CONN_MAX_AGE': 600,
        'ATOMIC_REQUESTS': True,
    }
}
```

### 개발 환경에서 SQLite 사용

개발 환경에서 SQLite를 사용하려면 환경변수를 설정하세요:

```bash
# Windows (PowerShell)
$env:DEV_DB="True"

# Linux/Mac
export DEV_DB=True
```

그 후 서버를 재시작하면 SQLite 데이터베이스가 사용됩니다.

### API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `/api/yh/config/` | YH DB 설정 정보 (비밀정보 제외) |
| `/api/yh/test/` | YH DB 연결 테스트 |
| `/api/yh/tables/` | YH DB 테이블 목록 및 스키마 |
| `/api/yh/sql/execute/` | YH DB에서 SQL 실행 |
| `/api/yh/data/` | 특정 테이블 데이터 조회 |
| `/api/yh/summary/` | 최근 3개월 데이터 요약 |

### 사용 예시

#### 1. 연결 테스트

```bash
curl http://localhost:8000/api/yh/test/
```

#### 2. 테이블 목록 조회

```bash
curl http://localhost:8000/api/yh/tables/
```

#### 3. SQL 실행

```bash
curl -X POST http://localhost:8000/api/yh/sql/execute/ \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM table_name LIMIT 10"}'
```

#### 4. 최근 3개월 데이터 요약

```bash
curl "http://localhost:8000/api/yh/summary/?days=90"
```

### 프론트엔드 사용

```typescript
import {
  executeYHSQL,
  getYHDatabaseTables,
  getYHRecentSummary,
  testYHDatabaseConnection
} from '@/services/yhDatabaseService';

// 연결 테스트
const testResult = await testYHDatabaseConnection();

// 테이블 목록 가져오기
const tablesResult = await getYHDatabaseTables();

// SQL 실행
const sqlResult = await executeYHSQL('SELECT * FROM table_name LIMIT 10');

// 최근 3개월 요약
const summaryResult = await getYHRecentSummary(90);
```

### 데이터베이스 스키마 탐색

서버가 시작되면 다음 엔드포인트로 스키마를 탐색할 수 있습니다:

1. `GET /api/yh/tables/` - 전체 테이블 목록과 컬럼 정보
2. `GET /api/yh/summary/?days=90` - 각 테이블의 최근 데이터 현황

이 정보를 사용하여 `textToSqlService.ts`의 스키마 메타데이터를 실제 YH 데이터베이스 구조로 업데이트하세요.

### 문제 해결

#### 연결 실패 시

1. **SSL 인증서 오류**: `sslmode='disable'` 로 변경 시도
2. **방화벽 문제**: 서버 관리자에게 IP 접근 권한 확인
3. **비밀번호 오류**: 비밀번호에 특수문자가 포함되어 있음

#### Django 마이그레이션 오류 시

```bash
# 개발용 SQLite 사용
export DEV_DB=True
python manage.py migrate
```

### 보안 참고사항

- 비밀번호는 소스 코드에 커밋하지 마세요
- 환경 변수로 관리하는 것을 권장합니다
- 프로덕션 환경에서는 `.env` 파일을 사용하세요

### 현재 상태

**개발 환경에서의 상태**:
- Django 백엔드: 실행 중 (SQLite 사용, `DEV_DB=True` 설정됨)
- YH 데이터베이스 연결: 현재 네트워크 환경에서 접속 불가
- API 엔드포인트: 정상 작동 중 (적절한 에러 메시지 반환)

**연결 실패 원인**:
```
Unable to connect to database server.
Please check network connectivity and firewall settings.
```
- 현재 개발 환경에서는 YH 데이터베이스 서버(133.186.214.219:27455)에 접근할 수 없습니다.
- 방화벽 또는 네트워크 제약으로 인해 외부 PostgreSQL 데이터베이스에 연결되지 않습니다.

### 다음 단계 (프로덕션 환경에서)

**프로덕션 배포 시**:
1. `.env` 파일에서 `DEV_DB=True` 제거 또는 `DEV_DB=False`로 설정
2. 서버가 YH 데이터베이스에 접근 가능한 네트워크 환경에 배포
3. `/api/yh/test/` 로 연결 테스트
4. `/api/yh/tables/` 로 실제 테이블 목록 확인
5. 실제 테이블 구조에 맞춰 `textToSqlService.ts` 업데이트
6. 최근 3개월 데이터 조회로 데이터 확인

**배포 체크리스트**:
- [ ] 서버가 YH DB 네트워크에 접근 가능한지 확인
- [ ] `.env`에서 `DEV_DB=True` 제거
- [ ] Django 마이그레이션 실행 (`python manage.py migrate`)
- [ ] `/api/yh/test/` 테스트 - 연결 성공 확인
- [ ] `/api/yh/tables/` 테스트 - 테이블 목록 확인
- [ ] `/api/yh/summary/?days=90` 테스트 - 최근 3개월 데이터 확인

### 개발 환경에서의 테스트

현재 개발 환경에서는 다음과 같이 테스트할 수 있습니다:

1. **테스트 페이지 열기**: `claros-mis-frontend/test-yh-connection.html`
2. **API 직접 테스트**:
   ```bash
   curl http://localhost:8000/api/yh/config/
   curl http://localhost:8000/api/yh/test/
   ```

### 프로덕션 환경 배포 가이드

**1. 환경 변수 설정**:
```bash
# .env 파일에서 DEV_DB=True 제거 또는 주석 처리
# DEV_DB=True
```

**2. 서버 배포**:
```bash
# Django 마이그레이션
python manage.py migrate

# 정적 파일 수집
python manage.py collectstatic --noinput

# 서버 시작
python manage.py runserver 0.0.0.0:8000
# 또는 gunicorn 사용
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

**3. 연결 테스트**:
```bash
curl http://localhost:8000/api/yh/test/
```

**4. 스키마 업데이트**:
연결이 성공하면 다음 명령어로 스키마를 확인하고 시스템을 업데이트하세요:
```bash
curl http://localhost:8000/api/yh/tables/ > yh_tables.json
curl "http://localhost:8000/api/yh/summary/?days=90" > yh_summary.json
```

---

**문서 버전**: 1.1
**작성일**: 2026-02-22
**데이터베이스**: YH (PostgreSQL)
**상태**: 개발 환경 설정 완료, 프로덕션 배포 대기 중
