# Windows용 PostgreSQL 설치 가이드

## 방법 1: Docker Desktop 사용 (권장)

### 1. Docker Desktop 설치

1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치
2. WSL 2 기능 활성화 (PowerShell 관리자 모드):
```powershell
wsl --install
```
3. 재부팅 후 Docker Desktop 시작

### 2. 프로젝트 PostgreSQL 실행

```bash
cd C:\work\claude_code\claros-mis-ai-dashboard

# PostgreSQL 컨테이너 시작
docker-compose up -d db redis

# 상태 확인
docker-compose ps
```

### 3. 데이터베이스 설정

`claros-mis-backend/.env` 파일:
```env
DB_TYPE=local
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password_2024
DB_HOST=db
DB_PORT=5432
```

---

## 방법 2: 로컬 PostgreSQL 설치

### 1. PostgreSQL 다운로드

1. [PostgreSQL Windows 다운로드](https://www.postgresql.org/download/windows/)
2. **EnterpriseDB** installer 다운로드 (버전 15 또는 16)
3. 설치 파일 실행 (예: `postgresql-15.7-1-windows-x64.exe`)

### 2. 설치 설정

| 항목 | 값 |
|------|-----|
| Port | 5432 |
| Password | (기억할 비밀번호 입력) |
| Locale | Korean, South Korea |
| Components | pgAdmin 4 선택 |

### 3. 설치 후 환경변수 확인

설치가 완료되면 PostgreSQL은 다음 경로에 설치됩니다:
- `C:\Program Files\PostgreSQL\15\bin`

PATH에 자동 추가됩니다. 명령 프롬프트에서 확인:
```cmd
psql --version
```

### 4. 데이터베이스 생성

**방법 A: SQL Shell (psql) 사용**

설치된 **SQL Shell (psql)** 실행:
```
Server [localhost]:
Database [postgres]:
Port [5432]:
Username [postgres]:
Password: (설치 시 입력한 비밀번호)
```

```sql
-- 데이터베이스 생성
CREATE DATABASE claros_mis;

-- 사용자 생성
CREATE USER claros_user WITH PASSWORD 'claros_password';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE claros_mis TO claros_user;

-- 종료
\q
```

**방법 B: pgAdmin 4 사용**

1. pgAdmin 4 실행
2. Servers > PostgreSQL 15 > Databases 우클릭
3. Create > Database
   - Database: `claros_mis`
4. Login/Group Roles 우클릭 > Create > Login/Group Role
   - Name: `claros_user`
   - Password: `claros_password`

### 5. .env 파일 설정

`claros-mis-backend\.env`:
```env
DB_TYPE=local
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password
DB_HOST=localhost
DB_PORT=5432
```

### 6. Django 마이그레이션

```cmd
cd C:\work\claude_code\claros-mis-ai-dashboard\claros-mis-backend

# 의존성 설치
pip install psycopg2-binary

# 마이그레이션
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser
```

---

## 방법 3: Portable PostgreSQL (빠른 테스트용)

### 1. PostgreSQL Portable 다운로드

1. [Enterprisedb PostgreSQL Portable](https://www.enterprisedb.com/download-postgresql-binaries) 다운로드
2. 압축 해제: `C:\postgresql15`

### 2. 데이터베이스 초기화

```cmd
cd C:\postgresql15\bin

# 데이터 디렉토리 생성
initdb -D C:\postgresql15\data -U postgres -W -E UTF8

# 비밀번호 입력 프롬프트
```

### 3. 서버 시작

```cmd
# 새 명령 프롬프트
cd C:\postgresql15\bin
pg_ctl -D C:\postgresql15\data -l logfile start
```

### 4. 데이터베이스 생성

```cmd
psql -U postgres
```

```sql
CREATE DATABASE claros_mis;
CREATE USER claros_user WITH PASSWORD 'claros_password';
GRANT ALL PRIVILEGES ON DATABASE claros_mis TO claros_user;
\q
```

---

## 방법 4: Chocolatey로 설치

### 1. Chocolatey 설치 (없는 경우)

PowerShell 관리자 모드:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. PostgreSQL 설치

```powershell
choco install postgresql --params '/Password:your_password'
```

---

## 문제 해결

### 포트 충돌

```
port 5432 is already in use
```

해결:
1. PostgreSQL이 이미 실행 중인지 확인
2. 작업 관리자 > 서비스 > postgresql-x64-15

### PATH 문제

```
'psql' is not recognized
```

해결:
1. 환경변수 PATH에 PostgreSQL bin 경로 추가
2. 또는 전체 경로 사용: `C:\Program Files\PostgreSQL\15\bin\psql.exe`

---

## 설치 완료 후 테스트

```cmd
cd C:\work\claude_code\claros-mis-ai-dashboard\claros-mis-backend

# 연결 테스트
python manage.py check

# 마이그레이션
python manage.py migrate

# 서버 시작
python manage.py runserver
```

서버가 정상적으로 시작되면 PostgreSQL 연결 성공입니다!

---

*다음 중 하나를 선택하여 진행하세요:*
- **Docker 사용**: 가장 간단하고 권장하는 방법
- **로컬 설치**: 영구적인 로컬 개발 환경
- **Portable**: 빠른 테스트용
