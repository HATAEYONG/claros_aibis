# NetPlus MIS-AI Dashboard 실행방법

## 1. 개요

본 프로젝트는 Django Backend와 React/TypeScript Frontend로 구성된 통합 MIS-AI 시스템입니다.

```
netplus-mis-ai-dashboard/
├── netplus-mis-backend/   # Django Backend (포트: 8000)
└── netplus-mis-frontend/  # React Frontend (포트: 5173)
```

---

## 2. 사전 준비

### 2.1 필수 프로그램 설치

| 프로그램 | 버전 | 확인 명령 |
|---------|------|----------|
| Python | 3.9+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Git | 최신 | `git --version` |

---

## 3. Backend 실행 (Django)

### 3.1 가상환경 설정

```bash
# Windows (PowerShell)
cd netplus-mis-ai-dashboard\netplus-mis-backend
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
cd netplus-mis-ai-dashboard/netplus-mis-backend
python3 -m venv venv
source venv/bin/activate
```

### 3.2 패키지 설치

```bash
pip install -r requirements.txt
```

**requirements.txt 내용:**
```
Django==5.0.1
djangorestframework==3.14.0
django-cors-headers==4.3.1
python-dotenv==1.0.0
drf-yasg==1.21.7
django-filter==23.5
```

### 3.3 DB 마이그레이션

```bash
# 마이그레이션 생성
python manage.py makemigrations

# 마이그레이션 적용
python manage.py migrate

# 초기 데이터 로드 (옵션)
python manage.py loaddata seed_data.json
```

### 3.4 Django 서버 시작

```bash
python manage.py runserver 8000
```

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
Django version 5.0.1, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### 3.5 API 확인

| URL | 설명 |
|-----|------|
| http://localhost:8000/api/ | API 루트 |
| http://localhost:8000/swagger/ | Swagger API 문서 |
| http://localhost:8000/admin/ | Django 관리자 |

---

## 4. Frontend 실행 (React)

### 4.1 패키지 설치

```bash
cd netplus-mis-frontend
npm install
```

**package.json 주요 의존성:**
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "tailwindcss": "^3.3.6",
  "vite": "^5.0.8"
}
```

### 4.2 개발 서버 시작

```bash
npm run dev
```

Vite 개발 서버가 시작되면 다음과 같은 메시지가 표시됩니다:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### 4.3 빌드 (운영 배포용)

```bash
npm run build
```

빌드가 완료되면 `dist/` 디렉토리에 정적 파일이 생성됩니다.

---

## 5. 전체 실행 절차 (한 번에 실행)

### Windows (PowerShell)

```powershell
# 터미널 1개 - Backend
cd netplus-mis-ai-dashboard\netplus-mis-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000

# 터미널 2개 - Frontend (새 창 열기)
cd netplus-mis-ai-dashboard\netplus-mis-frontend
npm install
npm run dev
```

### Linux/Mac

```bash
# 터미널 1개 - Backend
cd netplus-mis-ai-dashboard/netplus-mis-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000

# 터미널 2개 - Frontend (새 창 열기)
cd netplus-mis-ai-dashboard/netplus-mis-frontend
npm install
npm run dev
```

---

## 6. 접속 URL

| 서비스 | URL |
|--------|-----|
| **Frontend (대시보드)** | http://localhost:5173/ |
| **Backend API** | http://localhost:8000/api/ |
| **Swagger API 문서** | http://localhost:8000/swagger/ |
| **Django Admin** | http://localhost:8000/admin/ |

---

## 7. 환경 설정 (옵션)

### 7.1 Frontend 환경 변수

파일: `netplus-mis-frontend/.env`

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# LLM Configuration (OpenAI)
VITE_OPENAI_API_KEY=sk-xxx
VITE_LLM_MODEL=gpt-4-turbo
```

### 7.2 Backend 환경 변수

파일: `netplus-mis-backend/.env`

```env
# Database Configuration (운영 MySQL 연동 시)
DB_HOST=133.186.214.219
DB_PORT=27455
DB_USER=yh
DB_NAME=YH
DB_PASSWORD=your_password

# Django Configuration
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## 8. 일반적인 문제 해결

### 8.1 포트 충돌

**문제**: `Address already in use` 오류

**해결**:
```bash
# 포트 8000 사용 중인 프로세스 찾기 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# 포트 8000 사용 중인 프로세스 찾기 (Linux/Mac)
lsof -ti:8000 | xargs kill -9
```

### 8.2 모듈NotFoundError

**문제**: Python 모듈을 찾을 수 없음

**해결**:
```bash
# 가상환경이 활성화되었는지 확인
# Windows: (venv) 표시 확인
# Linux/Mac: (venv) 표시 확인

pip install -r requirements.txt
```

### 8.3 CORS 오류

**문제**: 브라우저 콘솔에 CORS 관련 오류

**해결**: Django `settings.py`에서 다음 설정 확인:
```python
CORS_ALLOW_ALL_ORIGINS = True  # 개발 환경에서만 사용
```

### 8.4 DB 연결 오류

**문제**: `no such table` 오류

**해결**:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 9. 프로젝트 구조

### Backend (Django)

```
netplus-mis-backend/
├── config/              # 프로젝트 설정
│   ├── settings.py      # Django 설정
│   ├── urls.py          # URL 라우팅
│   └── wsgi.py
├── accounting/          # 회계 관리 앱
├── production/          # 생산 관리 앱
├── quality/             # 품질 관리 앱
├── sales/               # 영업 관리 앱
├── purchase/            # 구매 관리 앱
├── esg/                 # ESG 경영 앱
├── cost/                # 원가 관리 앱
├── manufacturing/       # 제조 현장 앱
├── productivity/        # 생산성 관리 앱
├── development/         # R&D 관리 앱
├── reports/             # 경영 보고서 앱
├── financial/           # 재무제표 앱
├── erp_sync/            # ERP 연동 앱
├── ontology/            # 온톨로지 앱
├── db.sqlite3           # SQLite DB 파일
├── manage.py            # Django 관리 명령어
└── requirements.txt     # Python 패키지
```

### Frontend (React)

```
netplus-mis-frontend/
├── src/
│   ├── components/      # React 컴포넌트
│   │   ├── dashboard/   # 대시보드 관련
│   │   ├── layout/      # 레이아웃
│   │   └── charts/      # 차트 컴포넌트
│   ├── services/        # API 서비스
│   │   ├── api.ts       # API 클라이언트
│   │   └── scenarios/   # 시나리오 분석
│   ├── pages/           # 페이지 컴포넌트
│   ├── App.tsx          # 앱 엔트리
│   └── main.tsx         # React 엔트리
├── public/              # 정적 파일
├── index.html           # HTML 템플릿
├── package.json         # Node 패키지
├── vite.config.ts       # Vite 설정
└── tailwind.config.js   # Tailwind CSS 설정
```

---

## 10. 빠른 시작 (Quick Start)

```bash
# 1. Backend 시작
cd netplus-mis-backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000

# 2. Frontend 시작 (새 터미널)
cd netplus-mis-frontend
npm install
npm run dev

# 3. 브라우저 접속
# http://localhost:5173/
```

---

**문서 작성**: NetPlus MIS-AI Dashboard 개발팀
**최종 수정일**: 2024-12-26
