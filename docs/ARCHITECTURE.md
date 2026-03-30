# NetPlus MIS-AI Dashboard - 시스템 아키텍처

**문서 버전**: 1.0.0
**작성일**: 2026-03-05
**프로젝트**: NetPlus MIS-AI Dashboard (유한산업)

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [시스템 구성](#2-시스템-구성)
3. [프론트엔드 아키텍처](#3-프론트엔드-아키텍처)
4. [백엔드 아키텍처](#4-백엔드-아키텍처)
5. [데이터 아키텍처](#5-데이터-아키텍처)
6. [API 아키텍처](#6-api-아키텍처)
7. [보안 아키텍처](#7-보안-아키텍처)
8. [배포 아키텍처](#8-배포-아키텍처)

---

## 1. 아키텍처 개요

### 1.1 아키텍처 원칙

| 원칙 | 설명 |
|-----|------|
| **계층형 아키텍처** | 프레젠테이션 → 비즈니스 → 데이터 계층 분리 |
| **모듈화** | 기능별 독립적인 모듈 구성 |
| **확장성** | 수평/수직 확장이 가능한 구조 |
| **재사용성** | 공통 컴포넌트/서비스 재사용 |
| **테스트 용이성** | 단위/통합 테스트 지원 |

### 1.2 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Presentation Layer                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    React Frontend (Port 3000/3001)                  ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ ││
│  │  │ Dashboard │ │ Analysis  │ │ Prediction│ │ AI Chatbot         │ ││
│  │  │ Components│ │ Components│ │ Components│ │ Component          │ ││
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ ││
│  │  ┌─────────────────────────────────────────────────────────────┐   ││
│  │  │ Common Components (KPICard, Chart, Filter, etc.)           │   ││
│  │  └─────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API Gateway Layer                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    Django REST Framework (Port 8000)              ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ ││
│  │  │ Auth      │ │ Rate      │ │ CORS      │ │ Validation         │ ││
│  │  │ Middleware│ │ Limiting  │ │ Middleware│ │ Middleware         │ ││
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Business Logic Layer                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │ Financial │ │ Production│ │ Quality   │ │ Cost      │ │ ESG     │ │
│  │ Service   │ │ Service   │ │ Service   │ │ Service   │ │ Service │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └─────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │ Sales     │ │ Purchase  │ │ AI/LLM    │ │ Ontology           │ │
│  │ Service   │ │ Service   │ │ Service   │ │ Service            │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             Data Access Layer                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    Django ORM (Models)                             ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐ ││
│  │  │ QuerySet  │ │ Aggregation│ │ Transaction│ │ Raw SQL            │ ││
│  │  │ API       │ │ API       │ │ Management │ │ Escape             │ ││
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Data Storage Layer                           │
│  ┌───────────────┐ ┌───────────────┐ ┌─────────────────────────────────┐│
│  │ PostgreSQL    │ │ Redis Cache   │ │ File Storage                   ││
│  │ (Primary DB)  │ │ (Session/     │ │ (Uploads/Exports)              ││
│  │               │ │  Cache)       │ │                                 ││
│  └───────────────┘ └───────────────┘ └─────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    ERP Database (Yuhan)                            ││
│  │                    (6M → 4M2E → Cost → Finance → ESG)              ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 시스템 구성

### 2.1 모듈 구성도

```
NetPlus MIS-AI Dashboard
├── Frontend Modules
│   ├── Dashboard          # 통합 대시보드
│   ├── Financial Management # 재무 관리
│   ├── Production         # 생산 관리
│   ├── Quality            # 품질 관리
│   ├── Sales              # 영업 관리
│   ├── Purchase           # 구매 관리
│   ├── Manufacturing      # 제조 관리
│   ├── Cost Management    # 원가 관리
│   ├── Managerial Accounting # 관리 회계
│   ├── Development         # 개발 관리
│   ├── ESG                # ESG 경영
│   ├── FourM2E Strategy   # 4M2E 전략
│   ├── Ontology           # 온톨로지 분석
│   ├── Scenario Analysis  # 시나리오 분석
│   ├── Lot Trace          # 로트 추적
│   ├── KPI Management     # KPI 관리
│   ├── Productivity       # 생산성 분석
│   ├── Standards          # 기준정보
│   ├── Reports            # 분석 리포트
│   ├── Prediction         # AI 예측
│   └── AI Chatbot         # AI 어시스턴트
│
└── Backend Modules
    ├── Authentication     # 인증/권한
    ├── Financial          # 재무 관리 API
    ├── Production         # 생산 관리 API
    ├── Quality            # 품질 관리 API
    ├── Sales              # 영업 관리 API
    ├── Purchase           # 구매 관리 API
    ├── Manufacturing      # 제조 관리 API
    ├── Cost               # 원가 관리 API
    ├── Accounting         # 관리 회계 API
    ├── Development        # 개발 관리 API
    ├── ESG                # ESG API
    ├── Ontology           # 온톨로지 API
    ├── Prediction         # 예측 API
    ├── AI Services        # AI/LLM 서비스
    └── Reports            # 리포트 API
```

---

## 3. 프론트엔드 아키텍처

### 3.1 기술 스택

| 계층 | 기술 | 버전 | 용도 |
|-----|------|-----|-----|
| **Core** | React | 19.0.0 | UI 라이브러리 |
| | TypeScript | 5.7.2 | 타입스크립트 |
| | Vite | 6.4.1 | 빌드 도구 |
| **Styling** | TailwindCSS | 4.x | CSS 프레임워크 |
| **Charts** | Chart.js | 4.x | 차트 라이브러리 |
| | react-chartjs-2 | 5.x | React용 Chart.js |
| **HTTP** | Axios | latest | API 통신 |
| **Routing** | React Router | 6.x | 라우팅 |

### 3.2 컴포넌트 구조

```
src/
├── components/
│   ├── common/                    # 공통 컴포넌트
│   │   ├── KPICard.tsx           # KPI 카드
│   │   ├── ChartComponent.tsx    # 차트 컴포넌트
│   │   ├── AdvancedCharts.tsx    # 고급 차트
│   │   ├── InteractiveFilter.tsx # 인터랙티브 필터
│   │   ├── DataExport.tsx        # 데이터 내보내기
│   │   ├── Collaboration.tsx     # 협업 기능
│   │   ├── PerformanceComponents.tsx # 성능 컴포넌트
│   │   ├── AIComponents.tsx      # AI 컴포넌트
│   │   ├── ThemeToggle.tsx       # 테마 토글
│   │   ├── LoadingState.tsx      # 로딩 상태
│   │   ├── ErrorState.tsx        # 에러 상태
│   │   ├── Pagination.tsx        # 페이지네이션
│   │   └── SearchBar.tsx         # 검색 바
│   │
│   ├── dashboard/                 # 대시보드 컴포넌트 (25개)
│   │   ├── Dashboard.tsx         # 메인 대시보드
│   │   ├── DashboardV2.tsx       # 대시보드 V2
│   │   ├── Sales.tsx             # 영업 관리
│   │   ├── Quality.tsx           # 품질 관리
│   │   ├── Production.tsx        # 생산 관리
│   │   ├── Purchase.tsx          # 구매 관리
│   │   ├── Manufacturing.tsx    # 제조 관리
│   │   ├── FinancialManagement.tsx # 재무 관리
│   │   ├── CostManagement.tsx    # 원가 관리
│   │   ├── ManagerialAccounting.tsx # 관리 회계
│   │   ├── Development.tsx       # 개발 관리
│   │   ├── ESG.tsx               # ESG 경영
│   │   ├── FourM2EStrategy.tsx   # 4M2E 전략
│   │   ├── Ontology.tsx          # 온톨로지
│   │   ├── ScenarioAnalysis.tsx # 시나리오 분석
│   │   ├── ExtendedScenarioAnalysis.tsx # 확장 시나리오
│   │   ├── LotTrace.tsx          # 로트 추적
│   │   ├── KPIManagement.tsx     # KPI 관리
│   │   ├── Productivity.tsx     # 생산성 분석
│   │   ├── Standards.tsx        # 기준정보
│   │   ├── Reports.tsx          # 리포트
│   │   ├── SalesAnalysis.tsx    # 영업 분석
│   │   ├── QualityAnalysis.tsx  # 품질 분석
│   │   ├── ProductionAnalysis.tsx # 생산 분석
│   │   ├── FinancialIndicators.tsx # 재무 지표
│   │   ├── LocalAnalysis.tsx    # 로컬 분석
│   │   ├── YHDatabaseConnection.tsx # DB 연결
│   │   ├── AdvancedVisualization.tsx # 고급 시각화
│   │   ├── AIInsights.tsx       # AI 인사이트
│   │   ├── DataExportDemo.tsx  # 데이터 내보내기 데모
│   │   ├── CollaborationDemo.tsx # 협업 데모
│   │   ├── PerformanceOptimization.tsx # 성능 최적화
│   │   ├── WidgetPanel.tsx     # 위젯 패널
│   │   ├── PurchaseCost.tsx    # 구매원가 분석 ⭐ NEW
│   │   ├── QualityCost.tsx     # 품질원가 분석 ⭐ NEW
│   │   ├── SalesCost.tsx       # 견적원가 분석 ⭐ NEW
│   │   ├── DesignCost.tsx      # 설계원가 분석 ⭐ NEW
│   │   └── OutsourcingCost.tsx # 외주원가 분석 ⭐ NEW
│   │
│   ├── prediction/                # AI 예측 컴포넌트
│   │   ├── PredictionManagement.tsx
│   │   ├── PredictionCard.tsx
│   │   ├── PredictionChart.tsx
│   │   ├── FinancePrediction.tsx
│   │   ├── InventoryPrediction.tsx
│   │   ├── ProductionPrediction.tsx
│   │   └── QualityPrediction.tsx
│   │
│   ├── chat/                     # AI 챗봇 컴포넌트
│   │   ├── AIAssistantChat.tsx
│   │   ├── SQLResultViewer.tsx
│   │   ├── CausalAnalysisViewer.tsx
│   │   └── RootCauseViewer.tsx
│   │
│   ├── erp/                      # ERP 연동 컴포넌트
│   │   ├── ERPSourceManagement.tsx
│   │   ├── TableMappingEditor.tsx
│   │   ├── FieldMappingEditor.tsx
│   │   └── MappingManagement.tsx
│   │
│   ├── auth/                     # 인증 컴포넌트
│   │   ├── LoginPage.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── admin/                    # 관리자 컴포넌트
│   │   └── LLMSettings.tsx
│   │
│   └── icons/                    # 아이콘 (40+ 개)
│       └── Icons.tsx
│
├── context/                       # React Context
│   ├── AuthContext.tsx           # 인증 컨텍스트
│   ├── ThemeContext.tsx          # 테마 컨텍스트
│   ├── ToastContext.tsx          # 토스트 컨텍스트
│   └── WidgetContext.tsx         # 위젯 컨텍스트
│
├── services/                      # API 서비스
│   ├── api.ts                    # API 클라이언트
│   ├── authService.ts            # 인증 서비스
│   ├── dashboardService.ts       # 대시보드 서비스
│   └── ...
│
├── hooks/                         # Custom Hooks
│   ├── useAuth.ts                # 인증 훅
│   ├── useTheme.ts               # 테마 훅
│   ├── useToast.ts               # 토스트 훅
│   └── useWidget.ts              # 위젯 훅
│
├── utils/                         # 유틸리티
│   ├── formatters.ts             # 데이터 포맷터
│   ├── validators.ts             # 검증기
│   └── constants.ts              # 상수
│
├── types/                         # TypeScript 타입
│   ├── index.ts                  # 전체 타입
│   ├── dashboard.types.ts        # 대시보드 타입
│   └── ...
│
├── App.tsx                        # 메인 앱 컴포넌트
└── main.tsx                       # 엔트리 포인트
```

### 3.3 상태 관리

```
┌─────────────────────────────────────────────────────────────┐
│                      React Context API                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ AuthContext │  │ThemeContext │  │ToastContext │       │
│  │ (인증 상태) │  │ (테마 상태) │  │ (토스트 상태)│       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WidgetContext (위젯 배치 상태)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Local Component State                      │
│  각 컴포넌트의 useState, useEffect, useMemo, useCallback   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 백엔드 아키텍처

### 4.1 기술 스택

| 계층 | 기술 | 버전 | 용도 |
|-----|------|-----|-----|
| **Core** | Python | 3.11+ | 프로그래밍 언어 |
| | Django | 5.0 | 웹 프레임워크 |
| | Django REST Framework | 3.14 | API 프레임워크 |
| **Database** | SQLite | 3.x | 개발 DB |
| | PostgreSQL | 14+ | 프로덕션 DB |
| **Cache** | Redis | 7.x | 캐시/세션 |
| **Task Queue** | Celery | 5.x | 비동기 작업 |

### 4.2 프로젝트 구조

```
netplus-mis-backend/
├── config/                        # Django 설정
│   ├── __init__.py
│   ├── settings.py                # 전체 설정
│   ├── urls.py                    # URL 라우팅
│   ├── asgi.py                    # ASGI 설정
│   └── wsgi.py                    # WSGI 설정
│
├── financial/                     # 재무 관리 앱
│   ├── models.py                  # 재무 모델
│   ├── serializers.py            # 시리얼라이저
│   ├── views.py                  # 뷰
│   ├── urls.py                   # URL
│   └── admin.py                  # 관리자
│
├── production/                    # 생산 관리 앱
├── quality/                       # 품질 관리 앱
├── sales/                         # 영업 관리 앱
├── purchase/                      # 구매 관리 앱
├── manufacturing/                 # 제조 관리 앱
├── cost/                          # 원가 관리 앱
├── accounting/                    # 관리 회계 앱
├── development/                   # 개발 관리 앱
├── esg/                          # ESG 앱
├── ontology/                      # 온톨로지 앱
├── reports/                       # 리포트 앱
├── prediction/                    # 예측 앱
├── ai/                           # AI 서비스
├── erp_sync/                     # ERP 연동
├── kpi/                          # KPI 엔진
│
├── utils/                         # 유틸리티
│   ├── __init__.py
│   ├── mixins.py                 # 믹스인
│   ├── permissions.py            # 권한
│   ├── exceptions.py             # 예외
│   └── decorators.py             # 데코레이터
│
├── manage.py                      # Django 관리
└── requirements.txt               # 의존성
```

---

## 5. 데이터 아키텍처

### 5.1 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERP Database (Yuhan)                       │
│  6M → 4M2E → 원가 → 재무 → ESG                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Synchronization Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ ETL Process  │  │ Real-time    │  │ Change Data Capture  │ │
│  │ (Batch)      │  │ Sync         │  │ (CDC)                │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Application Database (PostgreSQL)            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │ Financial │  │Production │  │ Quality   │  │ Cost        │ │
│  │ Tables    │  │ Tables    │  │ Tables    │  │ Tables      │ │
│  └───────────┘  └───────────┘  └───────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Cache Layer (Redis)                      │
│  Session Cache │ Query Cache │ API Response Cache              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 온톨로지 데이터 모델

```
6M (Source)
├── Man (인력)           → HRA100, HRA200, HRK100, CAG100, CAE100
├── Machine (설비)       → FMA100, FMA130, FMA160, CAG700, CAG750
├── Material (자재)      → DMA100, DMA160, DMB110, COS220, COS400
├── Method (공법)        → DME100, DME400, PPZ100, PPC100, COS410
├── Measurement (측정)   → QMM100, QMM130
└── Mother Nature (환경) → QMM200_YH
        │
        ▼
4M2E (Transform)
├── Man (인력)           → cc_cd (원가부문)
├── Machine (설비)       → fa_no, cc_cd
├── Material (자재)      → itm_id
├── Method (공법)        → eco_no, acc_cd
├── Environment (환경)   → itm_cd, amt
└── Energy (에너지)      → mc_amt, util_amt
        │
        ▼
원가 (Cost)
├── 재료비               → COM100 (품목원가)
├── 노무비               → CAG100 (노무비집계)
├── 제조경비             → COD100 (배부결과)
└── 외주가공비           → COS410_YH (외주가공비)
        │
        ▼
재무 (Finance)
├── 재무제표             → ESF100 (재무제표집계)
├── 손익계산서           → FAB800 (계정-월집계)
└── 현금흐름표           → FAB100 (전표정보)
        │
        ▼
ESG (Sustainability)
├── Environment          → GAW990_YH (환경비용처리), FMP500 (전력비)
├── Social               → HRA100 (사원기본정보), QME200 (교육)
└── Governance           → QMM600 (공급업체대장), QMM630 (평가)
```

---

## 6. API 아키텍처

### 6.1 API 엔드포인트 구조

```
/api/v1/
├── auth/                          # 인증
│   ├── login/                    # 로그인
│   ├── logout/                   # 로그아웃
│   └── refresh/                  # 토큰 갱신
│
├── dashboard/                     # 대시보드
│   ├── kpi/                      # KPI 조회
│   └── summary/                  # 요약 정보
│
├── financial/                     # 재무 관리
│   ├── statements/               # 재무제표
│   ├── indicators/               # 재무 지표
│   └── ratios/                   # 재무 비율
│
├── production/                    # 생산 관리
│   ├── output/                   # 생산실적
│   ├── equipment/                # 설비
│   └── efficiency/               # 효율
│
├── quality/                       # 품질 관리
│   ├── inspection/               # 검사
│   ├── defects/                  # 불량
│   └── cost/                     # 품질원가 ⭐ NEW
│
├── sales/                         # 영업 관리
│   ├── revenue/                  # 매출
│   ├── orders/                   # 수주
│   └── cost/                     # 견적원가 ⭐ NEW
│
├── purchase/                      # 구매 관리
│   ├── orders/                   # 발주
│   ├── inventory/                # 재고
│   └── cost/                     # 구매원가 ⭐ NEW
│
├── manufacturing/                 # 제조 관리
│   ├── process/                  # 공정
│   ├── work-orders/              # 작업지시
│   └── outsourcing/              # 외주 ⭐ NEW
│
├── development/                   # 개발 관리
│   ├── projects/                 # 프로젝트
│   └── cost/                     # 설계원가 ⭐ NEW
│
├── cost/                          # 원가 관리
│   ├── standard/                 # 표준원가
│   ├── actual/                   # 실제원가
│   └── analysis/                 # 원가분석
│
├── accounting/                    # 관리 회계
│   ├── budget/                   # 예산
│   └── performance/              # 성과
│
├── esg/                          # ESG 경영
│   ├── environment/              # 환경
│   ├── social/                   # 사회
│   └── governance/               # 지배구조
│
├── ontology/                     # 온톨로지
│   ├── elements/                 # 요소
│   ├── relations/                # 관계
│   └── flow/                     # 데이터 흐름
│
├── prediction/                    # AI 예측
│   ├── finance/                  # 재무 예측
│   ├── inventory/                # 재고 예측
│   ├── production/               # 생산 예측
│   └── quality/                  # 품질 예측
│
├── ai/                           # AI 서비스
│   ├── chat/                     # AI 챗봇
│   ├── sql/                      # Text-to-SQL
│   ├── causal/                   # 인과관계 분석
│   └── root-cause/               # 근본 원인 분석
│
└── reports/                       # 리포트
    ├── generate/                 # 리포트 생성
    └── download/                 # 리포트 다운로드
```

### 6.2 API 응답 형식

```json
{
  "status": "success",
  "data": {
    // 결과 데이터
  },
  "meta": {
    "timestamp": "2026-03-05T12:00:00Z",
    "version": "1.0.0"
  }
}
```

### 6.3 에러 응답 형식

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "value",
      "errors": []
    }
  }
}
```

---

## 7. 보안 아키텍처

### 7.1 인증/권한

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
│  1. Client → Server: Login Request (username, password)     │
│  2. Server → Database: Verify Credentials                   │
│  3. Server → Client: JWT Access Token + Refresh Token       │
│  4. Client → Server: API Request + Access Token             │
│  5. Server: Validate Token → Process Request                │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 권한 레벨

| 레벨 | 설명 | 권한 |
|-----|------|-----|
| **Admin** | 시스템 관리자 | 전체 접근 권한 |
| **Manager** | 관리자 | 읽기/쓰기 권한 |
| **User** | 일반 사용자 | 읽기 전용 |
| **Guest** | 게스트 | 제한된 접근 |

---

## 8. 배포 아키텍처

### 8.1 개발 환경

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                  │
│  Frontend: localhost:3000 (Vite Dev Server)               │
│  Backend:  localhost:8000 (Django Runserver)               │
│  Database:  SQLite (local)                                  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 프로덕션 환경

```
┌─────────────────────────────────────────────────────────────┐
│                   Production Environment                     │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │ Nginx (Reverse │  ────▶  │ Gunicorn (Django│            │
│  │ Proxy)         │        │ Workers)        │            │
│  │ Port: 80/443   │        │ Port: 8000       │            │
│  └─────────────────┘        └─────────────────┘            │
│                                      │                      │
│                                      ▼                      │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │ React Build     │        │ PostgreSQL      │            │
│  │ (Static Files)  │        │ Port: 5432      │            │
│  └─────────────────┘        └─────────────────┘            │
│                                      │                      │
│                                      ▼                      │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │ Redis Cache     │        │ ERP Database    │            │
│  │ Port: 6379      │        │ (Yuhan)         │            │
│  └─────────────────┘        └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Docker 컴포넌트

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./netplus-mis-frontend
    ports: ["3000:3000"]

  backend:
    build: ./netplus-mis-backend
    ports: ["8000:8000"]
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=netplus_mis

  redis:
    image: redis:7-alpine
```

---

## 부록

### A. 원가 분석 컴포넌트 상세

#### A.1 PurchaseCost (구매 원가)

```typescript
interface PurchaseCostData {
  id: number;
  supplier: string;      // 협력사
  material: string;      // 자재명
  purchasePrice: number; // 구매 단가
  quantity: number;      // 수량
  totalCost: number;     // 총비용
  unit: string;          // 단위
  category: string;      // 카테고리 (원자재, 부품, 소모품, 포장재)
}
```

**기능:**
- 협력사별 구매액 분석
- 자재 카테고리별 필터링
- 월별 구매 단가 추이 차트
- 구매 원가 상세 테이블

#### A.2 QualityCost (품질 원가)

```typescript
interface QualityCostData {
  id: number;
  costType: string;      // 비용 유형 (예방/평가/내부실패/외부실패)
  description: string;   // 설명
  costAmount: number;    // 비용 금액
  defectRate: number;    // 불량률
  impactedProducts: number; // 영향 제품 수
  category: 'prevention' | 'appraisal' | 'failure' | 'external';
}
```

**기능:**
- 예방/평가/실패 비용 분석
- 불량률 추이 모니터링
- 품질 비용 구성 도넛 차트
- 월별 품질 비용 추이

#### A.3 SalesCost (견적/매출 원가)

```typescript
interface SalesCostData {
  id: number;
  product: string;       // 제품명
  costType: string;      // 원가 유형 (직접/간접)
  directCost: number;    // 직접 원가
  indirectCost: number;  // 간접 원가
  totalCost: number;     // 총 원가
  unitCost: number;      // 단위 원가
  salesVolume: number;   // 판매량
  salesRevenue: number;  // 매출액
  profitMargin: number;  // 이익률
}
```

**기능:**
- 제품별 직접/간접 원가 분석
- 수익성 및 마진율 분석
- 월별 수익성 추이
- 매출액 대비 원가 비율

#### A.4 DesignCost (설계 원가)

```typescript
interface DesignCostData {
  id: number;
  projectName: string;   // 프로젝트명
  projectCode: string;   // 프로젝트 코드
  designType: string;    // 설계 유형 (신규/변경/최적화/컨셉/시스템/해석)
  designHours: number;   // 설계 작업시간
  hourlyCost: number;    // 시간당 단가
  materialCost: number;  // 자재비
  softwareCost: number;  // 소프트웨어비
  totalCost: number;     // 총비용
  designer: string;      // 설계사
  status: 'planning' | 'in-progress' | 'review' | 'completed';
}
```

**기능:**
- 프로젝트별 설계비 분석
- 설계 유형별 비용 분석
- 설계사별 성과 분석
- 프로젝트 상태 관리

#### A.5 OutsourcingCost (외주 원가)

```typescript
interface OutsourcingData {
  id: number;
  vendor: string;        // 협력사
  itemName: string;      // 품목명
  outsourcingType: string; // 외주 유형 (가공/조립/표면처리/열처리/용접/사출성형/도장)
  quantity: number;      // 수량
  unitCost: number;      // 단가
  totalCost: number;     // 총비용
  deliveryDate: string;  // 납기일
  status: 'pending' | 'in-production' | 'delivered' | 'accepted' | 'rejected';
  qualityRating?: number; // 품질 등급
}
```

**기능:**
- 협력사별 외주액 분석
- 외주 유형별 비용 분석
- 품질 등급 관리
- 납기 준수율 추적

---

**문서 버전**: 1.0.0
**작성일**: 2026-03-05
**프로젝트**: NetPlus MIS-AI Dashboard (유한산업)
