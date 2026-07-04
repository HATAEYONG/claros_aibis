# PostgreSQL 설정 가이드

## 개요

Claros MIS-AI Dashboard는 **PostgreSQL**을 기본 데이터베이스로 사용합니다.

## 데이터베이스 구성 옵션

| DB_TYPE | 설명 | 사용 환경 |
|---------|------|-----------|
| `local` | 로컬 PostgreSQL | 개발 (기본) |
| `prod` | 운영 YH PostgreSQL | 운영 |
| `sqlite` | SQLite | 간단한 테스트 |

---

## 1. Docker를 사용한 PostgreSQL (권장)

### 1.1 docker-compose로 PostgreSQL 실행

```bash
cd C:\work\claude_code\claros-mis-ai-dashboard

# PostgreSQL 컨테이너만 실행
docker-compose up -d db redis

# 상태 확인
docker-compose ps
```

### 1.2 .env 파일 설정

```bash
cd claros-mis-backend
cp .env.example .env
```

`.env` 파일에서 다음 설정 확인:
```env
DB_TYPE=local
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password_2024
DB_HOST=db
DB_PORT=5432
```

### 1.3 데이터베이스 마이그레이션

```bash
cd claros-mis-backend

# Docker 컨테이너 내에서 마이그레이션 실행
docker-compose exec backend python manage.py migrate

# 또는 로컬에서 직접 실행 (PostgreSQL이 로컬에 설치된 경우)
python manage.py migrate
```

### 1.4 슈퍼유저 생성

```bash
# Docker 컨테이너 내
docker-compose exec backend python manage.py createsuperuser

# 또는 로컬
python manage.py createsuperuser
```

---

## 2. 로컬 PostgreSQL 설치 (Windows)

### 2.1 PostgreSQL 다운로드 및 설치

1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치파일 다운로드
2. 설치 시 다음 설정:
   - Port: `5432`
   - Password: 기억하기 쉬운 비밀번호 (예: `postgres`)
   - Stack Builder: 선택 사항

### 2.2 데이터베이스 및 사용자 생성

**pgAdmin 4** 또는 **SQL Shell (psql)** 사용:

```sql
-- 데이터베이스 생성
CREATE DATABASE claros_mis;

-- 사용자 생성
CREATE USER claros_user WITH PASSWORD 'claros_password';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE claros_mis TO claros_user;

-- 데이터베이스 소유자 변경
ALTER DATABASE claros_mis OWNER TO claros_user;

-- 종료
\q
```

### 2.3 .env 파일 설정

```env
DB_TYPE=local
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password
DB_HOST=localhost
DB_PORT=5432
```

### 2.4 마이그레이션 실행

```bash
cd claros-mis-backend
python manage.py migrate
```

---

## 3. 데이터베이스 연결 테스트

```bash
cd claros-mis-backend

# Django 쉘 실행
python manage.py shell

# 연결 테스트
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT version()")
print(cursor.fetchone())

# 테이블 목록 확인
cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname='public'")
print(cursor.fetchall())
```

---

## 4. 데이터베이스 초기화

### 4.1 모든 마이그레이션 초기화 (주의: 데이터 삭제)

```bash
# Docker 컨테이너 내
docker-compose exec backend python manage.py migrate zero

# 또는 로컬
python manage.py migrate zero
```

### 4.2 마이그레이션 재실행

```bash
# Docker 컨테이너 내
docker-compose exec backend python manage.py migrate

# 또는 로컬
python manage.py migrate
```

### 4.3 초기 데이터 로드 (fixture가 있는 경우)

```bash
# Docker 컨테이너 내
docker-compose exec backend python manage.py loaddata initial_data

# 또는 로컬
python manage.py loaddata initial_data
```

---

## 5. PostgreSQL 백업 및 복구

### 5.1 백업

```bash
# Docker 컨테이너에서 백업
docker-compose exec db pg_dump -U claros_user claros_mis > backup_$(date +%Y%m%d).sql

# 로컬 PostgreSQL에서 백업
pg_dump -U claros_user -h localhost claros_mis > backup_$(date +%Y%m%d).sql
```

### 5.2 복구

```bash
# Docker 컨테이너에서 복구
docker-compose exec -T db psql -U claros_user claros_mis < backup_20250228.sql

# 로컬 PostgreSQL에서 복구
psql -U claros_user -h localhost claros_mis < backup_20250228.sql
```

---

## 6. PostgreSQL 성능 최적화

### 6.1 postgresql.conf 설정

```
# 메모리 설정 (시스템 메모리에 따라 조정)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# 연결 설정
max_connections = 100

# WAL 설정
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# 로그 설정
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
```

### 6.2 Django 설정 (settings.py)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'claros_mis',
        'USER': 'claros_user',
        'PASSWORD': 'claros_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'connect_timeout': 10,
        },
        'CONN_MAX_AGE': 600,  # 연결 풀 사용
        'ATOMIC_REQUESTS': False,  # 개발 환경
    }
}
```

---

## 7. 문제 해결

### 7.1 연결 거부 오류

```
connection refused
```

해결:
1. PostgreSQL 서비스가 실행 중인지 확인
2. 방화벽 설정 확인
3. 포트 번호 확인 (기본: 5432)

### 7.2 인증 오류

```
password authentication failed
```

해결:
1. `pg_hba.conf` 파일 확인
2. 인증 방식을 `md5` 또는 `scram-sha-256`으로 변경

### 7.3 데이터베이스가 없음

```
database "claros_mis" does not exist
```

해결:
1. `CREATE DATABASE claros_mis;` 실행

---

## 8. 운영 YH PostgreSQL 연결

운영 환경에서 YH PostgreSQL에 연결하려면:

```env
DB_TYPE=prod
DB_NAME=YH
DB_USER=yh
DB_PASSWORD=db!@yh#$1!
DB_HOST=133.186.214.219
DB_PORT=27455
```

**⚠️ 주의**: 운영 데이터베이스에 직접 연결할 때는 신중해야 합니다.

---

## 9. Django Docker Compose 전체 실행

```bash
cd C:\work\claude_code\claros-mis-ai-dashboard

# 모든 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 서비스 중지
docker-compose down

# 데이터 볼륨 포함하여 완전히 삭제
docker-compose down -v
```

---

## 10. 유용한 Django 명령어

```bash
# 마이그레이션 상태 확인
python manage.py showmigrations

# 새로운 마이그레이션 생성
python manage.py makemigrations

# 마이그레이션 적용
python manage.py migrate

# 마이그레이션 롤백
python manage.py migrate app_name migration_name

# Django 쉘
python manage.py shell

# 슈퍼유저 생성
python manage.py createsuperuser

# 정적 파일 수집
python manage.py collectstatic

# 서버 실행
python manage.py runserver
```

---

*문서 버전: 1.0.0*
*최종 수정: 2026-02-28*
