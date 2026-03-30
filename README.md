# Netplus MIS-AI Dashboard

> 제조업 통합 경영정보시스템 (MIS) with AI 어시스턴트

**Netplus**의 제조 현업 관리를 위한 통합 MIS-AI 대시보드 시스템입니다. 생산, 품질, 재무, 영업, 구매 등 전체 비즈니스 프로세스를 한 곳에서 관리하고, AI 어시스턴트를 통해 데이터 분석 및 의사결정 지원을 받을 수 있습니다.

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [주요 기능](#2-주요-기능)
3. [기술 스택](#3-기술-스택)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [설치 및 실행](#5-설치-및-실행)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Netplus MIS-AI Dashboard |
| **개발사** | Netplus |
| **목적** | 제조업 통합 경영정보시스템 |
| **버전** | 1.0.0 |
| **개발 환경** | Windows 10, Python 3.11, Node.js 18+ |

### 1.2 시스템 특징

- **통합 대시보드**: 전체 경영 지표를 한눈에 확인
- **AI 어시스턴트**: 온톨로지 기반 지식 검색 및 Text-to-SQL
- **KPI 관리**: 8개 카테고리 80개 KPI 실시간 모니터링
- **로트 추적**: 원자재부터 완제품까지 전 공정 추적
- **시나리오 분석**: 6M/4M2E 기반 원인분석 및 대책 수립

### 1.3 모듈 구성

| 모듈 | 설명 |
|------|------|
| **통합 대시보드** | 전사 경영지표 요약 |
| **기준정보** | 생산/품질/재고/설비 기준정보 관리 |
| **KPI 관리** | 8개 카테고리 80개 KPI 관리 |
| **재무 관리** | 재무제표, 손익분석 |
| **재무 지표** | 유동성, 수익성, 성장성 지표 |
| **생산성 분석** | OEE, 설비가동률, 노무생산성 |
| **영업 관리** | 매출, 수주, 고객 관리 |
| **견적 원가** | 제품별 직접/간접 원가 분석 |
| **개발 관리** | R&D 프로젝트 관리 |
| **설계 원가** | 설계 작업비, 자재비, 소프트웨어비 분석 |
| **생산 관리** | 작업지시, 생산실적, BOM |
| **외주 원가** | 협력사별 외주비, 품질등급 분석 |
| **품질 관리** | 검사, 불량, 품질보고서 |
| **품질 원가** | 예방/평가/실패 비용 분석 |
| **구매/자재** | 발주, 재고, 공급사 관리 |
| **구매 원가** | 자재별 구매 단가, 협력사 비용 분석 |
| **제조 관리** | 공정, 작업표준, 설비관리 |
| **원가 관리** | 표준원가, 원가분석 |
| **관리 회계** | 예산관리, 성과평가 |
| **재무 관리** | 재무제표, 손익분석 |
| **ESG/4M2E** | 환경, 사회, 지배구조 |
| **온톨로지 분석** | 6M, 4M2E 개념 및 관계 분석 |
| **6M 시나리오 분석** | 원인-결과-대책 분석 |
| **확장 시나리오 분석** | 고급 시나리오 분석 |
| **LOT 추적** | 제품별 전체 공정 추적 |
| **예측관리** | 매출/생산/품질/재고 예측 |
| **분석 리포트** | 경영보고서 생성 |

---

## 2. 주요 기능

### 2.1 통합 대시보드

```
┌─────────────────────────────────────────────────────────────┐
│  Netplus MIS-AI Dashboard                                  │
├─────────────────────────────────────────────────────────────┤
│  📊 통합 대시보드                                           │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                   │
│  │ 매출  │ │ 생산  │ │ 품질  │ │ 재고  │                   │
│  │ 125억 │ │ 120만 │ │ 98.5% │ │ 85%  │                   │
│  └───────┘ └───────┘ └───────┘ └───────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 AI 어시스턴트

- **온톨로지 기반 검색**: 6M(Man, Machine, Material, Method, Measurement, Mother-nature)
- **Text-to-SQL**: 자연어로 SQL 생성 및 데이터 조회
- **로트 추적**: 특정 로트의 자재/설비/작업자 추적
- **원인분석**: 불량/고장 등 이슈의 원인 및 대책 제시

### 2.3 KPI 관리

| 카테고리 | KPI 수량 | 주요 지표 |
|----------|----------|-----------|
| 생산 KPI | 10개 | 생산량, 생산효율, 가동률, 사이클타임, 불량률, OEE, 수율 |
| 품질 KPI | 10개 | 일차수율, 고객불만, 공급사품질, Cpk, RMA율 |
| 영업 KPI | 10개 | 월별매출, 성장률, 신규고객, 고객유지율, 전환율 |
| 구매 KPI | 10개 | 납기준수율, 재고회전율, 리드타임, 비용회피액 |
| 제조 KPI | 10개 | 총처리시간, 교체시간, 노무가동률, 에너지효율 |
| 관리회계 KPI | 10개 | 예산차이, 코스트센터성과, 프로젝트ROI |
| ESG KPI | 10개 | 탄소배출, 에너지절감, 재활용율, 직원만족도 |
| 리포트 KPI | 10개 | 보고서정확도, 적시성, 자동화율, 사용자만족도 |

### 2.5 원가 관리

| 원가 유형 | 설명 | 주요 기능 |
|----------|------|----------|
| **구매 원가** | 자재별 구매 단가와 총비용 분석 | 협력사별 비용, 카테고리별 추이 |
| **품질 원가** | 예방/평가/실패 비용 분석 | 불량률, 품질비용 최적화 |
| **견적 원가** | 제품별 직접/간접 원가 분석 | 수익성, 마진율 분석 |
| **설계 원가** | 설계 작업비와 자재비 분석 | 프로젝트별 설계비, 설계사 성과 |
| **외주 원가** | 협력사별 외주비 분석 | 품질등급, 납기 관리 |

### 2.4 기준정보 관리

- **생산 기준정보**: 사이클타임, 가동률, 생산량 기준
- **품질 기준정보**: 불량률, 검사 기준, Cpk 기준
- **재고 기준정보**: 안전재고, 회전율 기준
- **설비 기준정보**: 보전 주기, OEE 기준
- **공정 기준정보**: 온도, 습도, 압력 등 공정 조건
- **원가 기준정보**: 표준원가, 간접비 배부율

---

## 3. 기술 스택

### 3.1 Frontend

```
React 18 + TypeScript
├── Vite (Build Tool)
├── Tailwind CSS (Styling)
├── Chart.js (Visualization)
├── React Router (Routing)
└── Axios (HTTP Client)
```

### 3.2 Backend

```
Django 5.0 + DRF
├── Django REST Framework (API)
├── SQLite (Database)
├── Celery (Task Queue)
├── Redis (Cache)
└── OpenAI/Ollama (LLM)
```

### 3.3 AI/ML

```
AI Services
├── OpenAI GPT (Chatbot)
├── Ollama (Local LLM)
├── Text-to-SQL Engine
├── Causal Analysis Engine
└── Ontology Knowledge Base
```

---

## 4. 시스템 아키텍처

### 4.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  React Frontend (Port 3000)                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ ││
│  │  │ Dashboard   │  │ AI Chat     │  │ KPI Management │ ││
│  │  │ Components  │  │ Component   │  │ Component     │ ││
│  │  └─────────────┘  └─────────────┘  └───────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Axios API Client                                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Django Backend (Port 8000)              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Django REST Framework                                 ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ ││
│  │  │ Financial │  │ Production│  │ Quality/Purchase/ │ ││
│  │  │ Module    │  │ Module    │  │ ESG/Reports/etc.  │ ││
│  │  └───────────┘  └───────────┘  └───────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  AI Services                                            ││
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   ││
│  │  │ LLM      │  │ Text-to- │  │ Causal Analysis   │   ││
│  │  │ Service  │  │ SQL      │  │ Service           │   ││
│  │  └──────────┘  └──────────┘  └───────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  KPI Engines (8개)                                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                         │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────┐ │
│  │ Financial │  │ Production│  │ Quality/Other Tables    │ │
│  │ Tables    │  │ Tables    │  │                         │ │
│  └───────────┘  └───────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 프로젝트 구조

```
netplus-mis-ai-dashboard/
├── netplus-mis-frontend/         # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # 공통 컴포넌트
│   │   │   ├── dashboard/        # 대시보드 컴포넌트
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── DashboardV2.tsx
│   │   │   │   ├── Sales.tsx, Quality.tsx, Production.tsx
│   │   │   │   ├── Purchase.tsx, Manufacturing.tsx
│   │   │   │   ├── FinancialManagement.tsx
│   │   │   │   ├── CostManagement.tsx
│   │   │   │   ├── ManagerialAccounting.tsx
│   │   │   │   ├── ESG.tsx
│   │   │   │   ├── FourM2EStrategy.tsx
│   │   │   │   ├── PurchaseCost.tsx      # 구매원가 분석
│   │   │   │   ├── QualityCost.tsx       # 품질원가 분석
│   │   │   │   ├── SalesCost.tsx         # 견적원가 분석
│   │   │   │   ├── DesignCost.tsx        # 설계원가 분석
│   │   │   │   ├── OutsourcingCost.tsx   # 외주원가 분석
│   │   │   │   └── ...
│   │   │   ├── prediction/        # AI 예측 컴포넌트
│   │   │   ├── icons/            # 아이콘
│   │   │   ├── chat/             # AI 챗봇
│   │   │   ├── erp/              # ERP 연동
│   │   │   └── auth/             # 인증
│   │   ├── context/              # Context (Auth, Toast)
│   │   ├── hooks/                # Custom Hooks
│   │   ├── services/             # API Services
│   │   ├── utils/                # 유틸리티
│   │   └── constants/            # 상수
│   ├── package.json
│   └── README.md
│
├── netplus-mis-backend/          # Django Backend
│   ├── accounting/               # 관리회계 모듈
│   ├── ai/                       # AI 서비스
│   ├── config/                   # Django 설정
│   ├── cost/                     # 원가 관리 모듈
│   ├── development/              # 개발 관리 모듈
│   ├── erp_sync/                 # ERP 연동
│   ├── esg/                      # ESG 모듈
│   ├── financial/                # 재무 관리 모듈
│   ├── manufacturing/            # 제조 관리 모듈
│   ├── production/               # 생산 관리 모듈
│   ├── productivity/             # 생산성 분석 모듈
│   ├── purchase/                 # 구매 관리 모듈
│   ├── quality/                  # 품질 관리 모듈
│   ├── reports/                  # 보고서 모듈
│   ├── sales/                    # 영업 관리 모듈
│   └── manage.py
│
├── deploy/                       # 배포 스크립트
├── docker-compose.yml            # Docker 설정
├── start.bat                     # Windows 시작 스크립트
└── README.md                     # 이 파일
```

---

## 5. 설치 및 실행

### 5.1 사전 요구사항

| 항목 | 요구사항 |
|------|----------|
| **운영체제** | Windows 10/11, Linux, macOS |
| **Python** | 3.11 이상 |
| **Node.js** | 18.0 이상 |
| **메모리** | 8GB 이상 권장 |
| **디스크** | 2GB 이상 여유 공간 |

### 5.2 설치 방법

#### 방법 1: Anaconda 환경 사용 (권장)

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\work\claude_code\netplus-mis-ai-dashboard

# 2. Backend 가상환경 생성 및 활성화
cd netplus-mis-backend
conda create -n netplus-mis python=3.11
conda activate netplus-mis
pip install -r requirements.txt

# 3. Backend 실행
python manage.py runserver

# 4. 새로운 터미널에서 Frontend 설치 및 실행
cd netplus-mis-frontend
npm install
npm run dev
```

#### 방법 2: Docker 사용

```bash
# 프로젝트 루트에서
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

#### 방법 3: Windows 배치 파일 사용

```bash
# 프로젝트 루트에서
start.bat
```

### 5.3 실행 확인

| 서비스 | URL | 상태 확인 |
|--------|-----|-----------|
| **Frontend** | http://localhost:3000 | 브라우저 접속 |
| **Backend API** | http://localhost:8000 | 아래 API 호출 |

**API 헬스체크:**
```bash
# Swagger API 문서
http://localhost:8000/api/docs/

# API 테스트
curl http://localhost:8000/api/financial/kpi/all_kpis/
curl http://localhost:8000/api/production/kpi/all_kpis/
```

### 5.4 환경 설정

#### Backend (.env)
```bash
# Database
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# API Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# LLM Settings
LLM_PROVIDER=ollama  # openai, gemini, ollama
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=your-key-here
```

#### Frontend (.env)
```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:8000/api

# Auth
VITE_AUTH_ENABLED=false

# LLM Settings
VITE_LLM_PROVIDER=ollama
```

### 5.5 개발 서버 실행

```bash
# Backend (Django)
cd netplus-mis-backend
python manage.py runserver  # Port 8000

# Frontend (Vite)
cd netplus-mis-frontend
npm run dev                 # Port 3000
```

### 5.6 프로덕션 빌드

#### Frontend 빌드
```bash
cd netplus-mis-frontend
npm run build
# dist/ 폴더에 정적 파일 생성
```

#### Backend 배포
```bash
# 환경변수 설정
export DEBUG=False
export ALLOWED_HOSTS=yourdomain.com

# 정적 파일 수집
python manage.py collectstatic

# Gunicorn 실행
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

---

## 6. API 문서

### 6.1 KPI API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/production/kpi/all_kpis/` | GET | 생산 KPI 전체 조회 |
| `/api/quality/kpi/all_kpis/` | GET | 품질 KPI 전체 조회 |
| `/api/sales/kpi/all_kpis/` | GET | 영업 KPI 전체 조회 |
| `/api/purchase/kpi/all_kpis/` | GET | 구매 KPI 전체 조회 |
| `/api/manufacturing/kpi/all_kpis/` | GET | 제조 KPI 전체 조회 |
| `/api/accounting/kpi/all_kpis/` | GET | 관리회계 KPI 전체 조회 |
| `/api/esg/kpi/all_kpis/` | GET | ESG KPI 전체 조회 |
| `/api/reports/kpi/all_kpis/` | GET | 리포트 KPI 전체 조회 |

### 6.2 API 응답 예시

```json
{
  "target_date": "2024-12-20",
  "total_kpis": 10,
  "kpis": [
    {
      "code": "PROD_001",
      "name": "생산량",
      "value": 1250000,
      "target": 1200000,
      "unit": "개",
      "achievement_rate": 104.17,
      "status": "good",
      "calculated_at": "2024-12-20T15:30:00Z"
    }
  ]
}
```

---

## 7. 사용자 가이드

### 7.1 메뉴 구성

```
상단 메뉴:
┌─────────────────────────────────────────────────────────────┐
│  🗄️ 기준정보    📈 KPI 관리    💰 재무 관리    ...        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 AI 어시스턴트 사용법

```
1. 화면 우측 상단 🤖 버튼 클릭
2. 원하는 질문 입력
3. 질문 예시:
   - "치수불량 원인 분석해줘"
   - "LOT-2024-1226-001 추적해줘"
   - "매출 현황 조회"
   - "6M이 뭐야?"
```

---

## 8. 문제 해결

### 8.1 공통 이슈

| 증상 | 원인 | 해결방법 |
|------|------|----------|
| CORS 에러 | Frontend/Backend 포트 불일치 | .env 설정 확인 |
| DB 연결 실패 | db.sqlite3 권한 문제 | 파일 권한 확인 |
| LLM 응답 없음 | Ollama 미실행 | `ollama serve` 실행 |

### 8.2 포트 충돌 해결

```bash
# Frontend 포트 변경 (vite.config.ts)
server: {
  port: 3001  # 3000 → 3001
}

# Backend 포트 변경
python manage.py runserver 8001
```

---

## 9. 라이선스

Copyright (c) 2024 Netplus. All rights reserved.

---

## 10. 연락처

- **문서 버전**: 1.1.0
- **최종 수정일**: 2026-03-05
- **프로젝트**: Netplus MIS-AI Dashboard (유한산업)
