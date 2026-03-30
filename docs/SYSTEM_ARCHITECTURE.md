# NetPlus MIS-AI Dashboard 시스템 아키텍처

## 문서 정보

| 버전 | 일자 | 작성자 | 설명 |
|------|------|--------|------|
| 1.0 | 2026-03-04 | Claude | 시스템 아키텍처 초판 |

---

## 1. 아키텍처 개요

### 1.1 시스템 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    React 18 + TypeScript 5.x                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐    │  │
│  │  │ Dashboard │ │ KPI      │ │ Reports  │ │ AI Assistant       │    │  │
│  │  │ Pages     │ │ Pages    │ │ Pages    │ │ (Chat Interface)   │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐    │  │
│  │  │         ERP Mapping Management UI Components              │    │  │
│  │  │  - Source Management  - Table Mapping  - Field Mapping     │    │  │
│  │  │  - Import/Export CSV  - Validation  - Sync Monitoring    │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    State Management (Zustand/Redux)                  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │  │
│  │  │ User Store  │ │ Data Store  │ │ Mapping Store│                  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Django REST Framework 3.14                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────────┐    │  │
│  │  │ ViewSets    │ │ API Views   │ │ Serializers             │    │  │
│  │  │ (CRUD)      │ │ (Business   │ │ (Request/Response        │    │  │
│  │  │             │ │  Logic)     │ │  Transformation)        │    │  │
│  │  └─────────────┘ └─────────────┘ └──────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐    │  │
│  │  │              Middleware Layer                                 │    │  │
│  │  │  - Authentication  - Permission  - Rate Limiting            │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Data Service Classes                             │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   │  │
│  │  │ DashboardData  │  │ 16 Module       │  │ DataSyncService    │   │  │
│  │  │ Service        │  │  Services       │  │ (ERP Connector)    │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Business Logic Layer                             │  │
│  │  - Data Transformation  - Validation  - Aggregation               │  │
│  │  - Fallback Management  - Error Handling                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌─────────────────────────────┐   ┌─────────────────────────────────┐
│     POSTGRESQL DB            │   │      ERP SOURCES                │
│  (NetPlus MIS Data)          │   │  ┌─────────────────────────┐   │
│  ┌───────────────────────┐   │   │  │  YH ERP (PostgreSQL)    │   │
│  │ erp_source           │   │   │  │  Host: 133.186.214.219 │   │
│  │ erp_table_definition │   │   │  │  Port: 27455           │   │
│  │ erp_field_definition │   │   │  │  DB: yuhan             │   │
│  │ erp_target_model     │   │   │  └─────────────────────────┘   │
│  │ erp_target_field     │   │   │  ┌─────────────────────────┐   │
│  │ erp_table_mapping    │   │   │  │  FOM ERP (MSSQL)        │   │
│  │ erp_field_mapping    │   │   │  │  Host: fom-server       │   │
│  │ erp_mapping_validation│   │   │  └─────────────────────────┘   │
│  └───────────────────────┘   │   │  ┌─────────────────────────┐   │
│  ┌───────────────────────┐   │   │  │  SAP ERP (Oracle)       │   │
│  │ Django Migrations     │   │   │  │  Host: sap-server       │   │
│  │ Session Management    │   │   │  └─────────────────────────┘   │
│  └───────────────────────┘   │   └─────────────────────────────────┘
└─────────────────────────────┘
```

### 1.2 레이어별 설명

#### Frontend Layer
- **Framework**: React 18 + TypeScript 5.x
- **UI Library**: TailwindCSS + shadcn/ui
- **State Management**: Zustand/Redux
- **Routing**: React Router v6
- **HTTP Client**: Axios

#### API Gateway Layer
- **Framework**: Django 5.0 + DRF 3.14
- **Authentication**: JWT Token
- **Permission**: Django Guardian
- **Rate Limiting**: Django Ratelimit

#### Service Layer
- **Data Services**: 16개 모듈별 서비스 클래스
- **Sync Service**: ERP 연동 및 데이터 동기화
- **Business Logic**: 데이터 변환, 검증, 집계

#### Data Layer
- **Primary DB**: PostgreSQL 15.x
- **ERP Sources**: YH ERP (PostgreSQL), FOM ERP (MSSQL), SAP (Oracle)
- **Cache**: Redis (선택 사항)

---

## 2. 컴포넌트 아키텍처

### 2.1 Frontend 컴포넌트 구조

```
src/
├── components/
│   ├── dashboard/              # 대시보드 컴포넌트
│   │   ├── ExecutiveSummary.tsx
│   │   ├── SalesDashboard.tsx
│   │   ├── ProductionDashboard.tsx
│   │   ├── QualityDashboard.tsx
│   │   ├── InventoryDashboard.tsx
│   │   ├── ProcurementDashboard.tsx
│   │   ├── FinancialDashboard.tsx
│   │   └── HRDashboard.tsx
│   ├── kpi/                    # KPI 컴포넌트
│   │   ├── SalesPerformance.tsx
│   │   ├── ProductionPerformance.tsx
│   │   ├── QualityPerformance.tsx
│   │   └── EquipmentEfficiency.tsx
│   ├── erp/                    # ERP 매핑 관리 컴포넌트
│   │   ├── ERPSourceManagement.tsx
│   │   ├── TableMappingEditor.tsx
│   │   ├── FieldMappingEditor.tsx
│   │   ├── ImportExportMappings.tsx
│   │   └── SyncMonitoring.tsx
│   ├── module/                 # 모듈별 컴포넌트
│   │   ├── financial/           # 재무제표/재무관리
│   │   ├── sales/               # 영업관리
│   │   ├── production/          # 생산관리/생산성
│   │   ├── development/         # 개발관리
│   │   ├── quality/             # 품질관리
│   │   ├── hr/                  # 인사관리
│   │   ├── material/            # 자재관리
│   │   ├── procurement/         # 구매관리
│   │   ├── logistics/           # 물류관리
│   │   ├── equipment/           # 설비관리
│   │   ├── manufacturing/       # 제조관리
│   │   ├── cost/                # 원가관리
│   │   ├── project/             # 프로젝트관리
│   │   └── managerial-accounting/ # 관리회계
│   └── shared/                 # 공통 컴포넌트
│       ├── Layout.tsx
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Chart.tsx
│       └── DataTable.tsx
├── pages/                       # 페이지 컴포넌트
├── services/
│   └── api/                    # API 서비스
├── store/                       # 상태 관리
├── hooks/                       # 커스텀 훅
├── utils/                       # 유틸리티
└── types/                       # TypeScript 타입 정의
```

### 2.2 Backend 컴포넌트 구조

```
netplus-mis-backend/
├── erp_sync/
│   ├── models/                  # Django 모델
│   │   ├── __init__.py
│   │   ├── erp_source.py       # ERP 소스 모델
│   │   ├── mis_target.py       # MIS 타겟 모델
│   │   ├── mapping.py          # 매핑 모델
│   │   └── base.py             # 기존 모델 (ERPSyncConfig, ERPSyncLog)
│   ├── serializers/             # DRF 시리얼라이저
│   │   ├── erp_source.py
│   │   ├── mis_target.py
│   │   └── mapping.py
│   ├── views/                   # DRF ViewSets
│   │   ├── erp_source.py
│   │   ├── mis_target.py
│   │   └── mapping.py
│   ├── services/                # 비즈니스 로직
│   │   ├── dashboard_data_service.py
│   │   ├── financial_statement_service.py
│   │   ├── financial_management_data_service.py
│   │   ├── hr_management_data_service.py
│   │   ├── material_management_data_service.py
│   │   ├── productivity_data_service.py
│   │   ├── sales_data_service.py
│   │   ├── development_data_service.py
│   │   ├── production_data_service.py
│   │   ├── quality_data_service.py
│   │   ├── procurement_management_data_service.py
│   │   ├── logistics_management_data_service.py
│   │   ├── equipment_management_data_service.py
│   │   ├── manufacturing_management_data_service.py
│   │   ├── cost_management_data_service.py
│   │   ├── project_management_data_service.py
│   │   └── managerial_accounting_data_service.py
│   ├── urls.py                  # URL 라우팅
│   ├── admin.py                 # Django Admin
│   └── apps.py                  # 앱 설정
├── config/                      # 설정 파일
├── static/                      # 정적 파일
└── manage.py                   # Django 관리 스크립트
```

---

## 3. 데이터 흐름 아키텍처

### 3.1 API 요청/응답 흐름

```
┌─────────┐    HTTP GET    ┌─────────┐    Django     ┌─────────┐
│ Browser │ ─────────────> │ Django  │ ────────────> │ Service │
│         │    Response    │ View    │    Call      │ Layer   │
└─────────┘    <──────────── │         │ <─────────── │         │
                JSON          │         │    Return     │         │
                                └─────────┘                │
                                                 │
                                                 ▼
                                        ┌─────────────────────┐
                                        │  DataSyncService    │
                                        │  - get_default_source()│
                                        │  - fetch_from_erp()   │
                                        └─────────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────────┐
                                        │  YH ERP PostgreSQL  │
                                        │  @ 133.186.214.219 │
                                        │  :27455/yuhan        │
                                        └─────────────────────┘
```

### 3.2 ERP 동기화 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. 사용자가 ERP 소스 등록                                          │
│    → ERPSource.create(source_code='YH', host='...', port=27455)    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. 사용자가 테이블 매핑 생성                                         │
│    → ERPTableMapping.create(                                       │
│       source_table='SDY100_YH',                                    │
│       target_model='MonthlySales',                                  │
│       sync_priority=2)                                             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. 사용자가 필드 매핑 생성                                         │
│    → ERPFieldMapping.create(                                        │
│       source_field='plan_rev',                                      │
│       target_field='revenue',                                       │
│       transform_rule='decimal_cast')                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. 스케줄러 실행 동기화 작업                                         │
│    → ERP Connection → Data Fetch → Transform → Save to DB           │
│    → ERPSyncLog记录 결과                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 폴백 메커니즘

```
┌─────────────────────────────────────────────────────────────────────┐
│ API 요청 수신                                                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌────────────────────────┐
                    │ ERP 연결 가능 여부 체크 │
                    └────────────────────────┘
                         │                │
                    Yes│                │No
                       ▼                ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  ERP 데이터 조회   │  │  Mock 데이터      │
        │  - fetch_from_erp │  │  생성 및 반환    │
        └──────────────────┘  └──────────────────┘
                  │                      │
                  ▼                      ▼
        ┌──────────────────────────────────────────────────────┐
        │                Response 생성                         │
        │  {                                                    │
        │    "source_tables": ["SDY100_YH"],                   │
        │    "data_source": "erp"  or  "fallback"               │
        │  }                                                    │
        └──────────────────────────────────────────────────────┘
```

---

## 4. 배포 아키텍처

### 4.1 개발 환경

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Developer Machine                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Frontend (Vite Dev Server)    Backend (Django Dev Server)    │ │
│  │  localhost:5173                localhost:8000                 │ │
│  │  Hot Module Replacement       Auto-reload on change          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (Docker)        YH ERP (Remote)                  │ │
│  │  localhost:5432              133.186.214.219:27455          │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 운영 환경

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DMZ Layer                                │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                Nginx / Load Balancer                         │ │
│  │  SSL Termination  →  Reverse Proxy  →  Static Files         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐           ┌───────────────────────┐
        │  Application Server 1  │           │  Application Server 2  │
        │  ┌─────────────────┐  │           │  ┌─────────────────┐  │
        │  │ Gunicorn + Django│  │           │  │ Gunicorn + Django│  │
        │  │ (4 Workers)      │  │           │  │ (4 Workers)      │  │
        │  └─────────────────┘  │           │  └─────────────────┘  │
        │  ┌─────────────────┐  │           │  ┌─────────────────┐  │
        │  │ React Build      │  │           │  │ React Build      │  │
        │  │ (Static Files)   │  │           │  │ (Static Files)   │  │
        │  └─────────────────┘  │           │  └─────────────────┘  │
        └───────────────────────┘           └───────────────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
                        ┌───────────────────────────────────┐
                        │   Database Layer (HA Cluster)     │
                        │  ┌─────────────────────────────┐ │
                        │  │ PostgreSQL Primary           │ │
                        │  │  + Streaming Replication    │ │
                        │  └─────────────────────────────┘ │
                        │  ┌─────────────────────────────┐ │
                        │  │ PostgreSQL Standby 1         │ │
                        │  │ PostgreSQL Standby 2         │ │
                        │  └─────────────────────────────┘ │
                        └───────────────────────────────────┘
```

### 4.3 Docker Compose 배포

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/build:/usr/share/nginx/html
    depends_on:
      - backend

  backend:
    build: ./netplus-mis-backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/netplus_mis
      - YH_ERP_HOST=133.186.214.219
      - YH_ERP_PORT=27455
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=netplus_mis
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 5. 보안 아키텍처

### 5.1 인증/인가 흐름

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│  User   │                  │  React  │                  │ Django  │
│  Browser│                  │  App    │                  │  Backend │
└─────────┘                  └─────────┘                  └─────────┘
     │                            │                            │
     │ 1. Login                  │                            │
     ├──────────────────────────>│                            │
     │                            │                            │
     │                            │ 2. POST /api/auth/login     │
     │                            ├──────────────────────────>│
     │                            │                            │
     │                            │                            │ 3. Validate
     │                            │                            │    Credentials
     │                            │                            │
     │                            │ 4. Return JWT Token       │
     │                            │<──────────────────────────┤
     │                            │                            │
     │ 5. Store Token            │                            │
     │    (LocalStorage)          │                            │
     │<───────────────────────────│                            │
     │                            │                            │
     │ 6. API Request             │                            │
     │    + Authorization Header  │                            │
     ├──────────────────────────>│                            │
     │                            │ 7. Forward + Token        │
     │                            ├──────────────────────────>│
     │                            │                            │
     │                            │                            │ 8. Verify Token
     │                            │                            │
     │                            │ 9. Return Data            │
     │                            │<──────────────────────────┤
     │<───────────────────────────│                            │
```

### 5.2 권한 모델

```python
# 권한 레벨 정의
PERMISSION_LEVELS = {
    'admin': '관리자 - 전체 접근',
    'manager': '매니저 - 모듈별 접근',
    'user': '사용자 - 읽기 전용',
    'viewer': '뷰어 - 대시보드만'
}

# 모듈별 권한
MODULE_PERMISSIONS = {
    'dashboard': ['viewer', 'user', 'manager', 'admin'],
    'financial': ['manager', 'admin'],
    'hr': ['manager', 'admin'],
    'production': ['user', 'manager', 'admin'],
    'erp_mapping': ['admin']
}
```

### 5.3 데이터 보안

```python
# 1. 암호화 설정
SECRET_KEY = env('SECRET_KEY')  # JWT 서명
PASSWORD_HASH = 'bcrypt'        # 비밀번호 해싱
DB_ENCRYPTION = True            # DB 암호화

# 2. CORS 설정
CORS_ALLOWED_ORIGINS = [
    'https://mis.netplus.co.kr',
    'https://erp-mapping.netplus.co.kr'
]

# 3. Rate Limiting
RATE_LIMIT = {
    'authentication': '5/minute',
    'api_calls': '1000/minute',
    'export': '10/hour'
}

# 4. SQL Injection 방지
# Django ORM 사용 (자동 이스케이프 처리)

# 5. XSS 방지
# React 기본 이스케이프 처리
```

---

## 6. 통합 아키텍처

### 6.1 ERP 연동 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERP Integration Layer                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   DataSyncService                             │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  ERP Connection Pool                                   │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │  │
│  │  │  │ YH ERP   │  │ FOM ERP  │  │ SAP ERP  │           │  │  │
│  │  │  │ Pool(5)  │  │ Pool(3)  │  │ Pool(2)  │           │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Query Builder                                         │  │  │
│  │  │  - WHERE clause generation                              │  │  │
│  │  │  - JOIN support                                        │  │  │
│  │  │  - Pagination                                          │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Data Transformer                                       │  │  │
│  │  │  - Field mapping                                        │  │  │
│  │  │  - Type conversion                                     │  │  │
│  │  │  - Custom rules                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 이기종 ERP 연결

```python
# ERP 소스별 연결 설정
ERP_SOURCES = {
    'YH': {
        'engine': 'postgresql',
        'host': '133.186.214.219',
        'port': 27455,
        'database': 'yuhan',
        'schema': 'public',
        'pool_size': 5,
        'timeout': 30
    },
    'FOM': {
        'engine': 'mssql+pymssql',
        'host': 'fom-server.netplus.co.kr',
        'port': 1433,
        'database': 'FOM_DB',
        'pool_size': 3,
        'timeout': 30
    },
    'SAP': {
        'engine': 'oracle+cx_oracle',
        'host': 'sap-server.netplus.co.kr',
        'port': 1521,
        'service_name': 'SAP_SERVICE',
        'pool_size': 2,
        'timeout': 60
    }
}
```

### 6.3 API 라우팅 구조

```
/api/erp-sync/
├── /sources/ (ViewSet)
│   ├── GET    - 목록 조회
│   ├── POST   - 소스 등록
│   ├── PUT    - 전체 수정
│   ├── PATCH  - 부분 수정
│   └── DELETE - 소스 삭제
│
├── /table-definitions/ (ViewSet)
│   └── GET    - 테이블 정의 목록
│
├── /field-definitions/ (ViewSet)
│   └── GET    - 필드 정의 목록
│
├── /table-mappings/ (ViewSet)
│   ├── GET    - 매핑 목록
│   ├── POST   - 매핑 생성
│   ├── PUT    - 매핑 수정
│   └── DELETE - 매핑 삭제
│
├── /field-mappings/ (ViewSet)
│   ├── GET    - 필드 매핑 목록
│   ├── POST   - 필드 매핑 생성
│   └── DELETE - 필드 매핑 삭제
│
├── /dashboard/ (API Views)
│   ├── /executive-summary/
│   ├── /sales/
│   ├── /production/
│   ├── /quality/
│   ├── /inventory/
│   ├── /procurement/
│   ├── /financial/
│   └── /hr/
│
├── /{module}/ (API Views)
│   ├── /financial/
│   ├── /productivity/
│   ├── /sales/
│   ├── /development/
│   ├── /production/
│   ├── /quality/
│   ├── /hr/
│   ├── /material/
│   ├── /procurement/
│   ├── /logistics/
│   ├── /equipment/
│   ├── /manufacturing/
│   ├── /cost/
│   ├── /project/
│   └── /managerial-accounting/
│
└── /import-export/ (ViewSet)
    ├── /import_from_csv/
    ├── /export_to_csv/
    └── /validation/
```

---

## 7. 모니터링 아키텍처

### 7.1 로그 수집

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Django Logging                                               │ │
│  │  ├── INFO: API requests, data sync                          │ │
│  │  ├── WARNING: ERP connection failures, fallback usage        │ │
│  │  ├── ERROR: Exceptions                                       │ │
│  │  └── DEBUG: Detailed SQL queries                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Centralized Logging                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  File Storage (Daily Rotation)                               │ │
│  │  ├── logs/api.log                                            │ │
│  │  ├── logs/erp_sync.log                                      │ │
│  │  └── logs/errors.log                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 메트릭 수집

```python
# 수집 메트릭
METRICS = {
    'api_response_time': 'API 응답시간 (ms)',
    'api_request_count': 'API 요청 수',
    'api_error_count': 'API 에러 수',
    'erp_sync_count': 'ERP 동기화 수',
    'erp_sync_duration': 'ERP 동기화 소요시간 (ms)',
    'erp_connection_failures': 'ERP 연결 실패 수',
    'db_query_time': 'DB 쿼리 시간 (ms)',
    'db_connection_pool': 'DB 연결풀 사용량'
}

# 모니터링 도구
- Prometheus: 메트릭 수집
- Grafana: 대시보드 시각화
- Sentry: 에러 추적
```

---

## 8. 확장성 아키텍처

### 8.1 신규 모듈 추가 절차

```
1. 데이터 서비스 생성
   → services/{module}_data_service.py
   → {Module}DataService 클래스 생성
   → 6개 API 메서드 구현

2. URL 라우팅 추가
   → urls.py에 임포트 추가
   → URL 패턴 6개 추가

3. 데이터베이스 모델 (필요시)
   → models/{module}.py 생성
   → 마이그레이션 생성

4. Frontend 컴포넌트 (필요시)
   → components/{module}/ 생성
   → 페이지 컴포넌트 생성

5. 기술문서 업데이트
   → API_REFERENCE.md 업데이트
   → ERP_MAPPING_{MODULE}.md 생성
```

### 8.2 신규 ERP 연동 절차

```
1. ERP 소스 등록
   → ERPSource 테이블에 새로운 ERP 정보 추가
   → 연결 정보 입력 (host, port, database)

2. 테이블 정의 가져오기
   → import_tables/{source_code}/
   → 자동으로 테이블 메타데이터 추출

3. 타겟 모델 정의
   → ERPTargetModel에 Django 모델 정보 추가

4. 매핑 생성
   → ERPTableMapping 생성
   → ERPFieldMapping 생성

5. 동기화 실행
   → 스케줄러 또는 수동으로 동기화 실행
```

---

## 9. 성능 아키텍처

### 9.1 캐싱 전략

```python
# Redis 캐싱 전략
CACHE_STRATEGY = {
    'api_response': {
        'ttl': 300,  # 5분
        'key_pattern': 'api:{url}:{params_hash}'
    },
    'erp_data': {
        'ttl': 3600,  # 1시간
        'key_pattern': 'erp:{table}:{where_clause_hash}'
    },
    'user_session': {
        'ttl': 7200,  # 2시간
        'key_pattern': 'session:{user_id}'
    }
}
```

### 9.2 쿼리 최적화

```python
# DB 인덱스 전략
INDEXES = {
    'erp_source': ['source_code', 'is_default', 'is_active'],
    'erp_table_definition': ['erp_source_id', 'module_code'],
    'erp_field_definition': ['table_definition_id', 'source_field_name'],
    'erp_table_mapping': ['source_table_id', 'target_model_id', 'sync_priority'],
    'erp_field_mapping': ['table_mapping_id', 'source_field_id', 'target_field_id']
}

# Query 최적화
- select_related: Foreign Key 미리 로딩
- prefetch_related: M2M 관계 미리 로딩
- only(): 필요한 필드만 조회
- defer(): 제외할 필드 지정
```

### 9.3 동시성 처리

``┌─────────────────────────────────────────────────────────────────────┐
│  HTTP Request                                                     │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────┐                                                │
│  │  Django View │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌───────────────┐                                              │
│  │  Celery Task  │ (Heavy Operations)                         │
│  │  - ERP Sync  │                                              │
│  │  - Data Export│                                             │
│  └───────┬───────┘                                              │
│          │                                                        │
│          ▼                                                        │
│  ┌───────────────┐                                              │
│  │  RabbitMQ/Redis│                                              │
│  │  (Message Queue)│                                             │
│  └───────┬───────┘                                              │
│          │                                                        │
│          ▼                                                        │
│  ┌───────────────┐                                              │
│  │  Worker Process│                                              │
│  │  - Process Task│                                             │
│  └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. 참고 문서

| 문서 | 설명 |
|------|------|
| TECHNICAL_DOCUMENTATION_V3.md | 기술문서 v3.0 |
| ERP_MAPPING_SYSTEM.md | ERP 매핑 시스템 설계 |
| DATABASE_SCHEMA.md | 데이터베이스 스키마 |
| API_REFERENCE.md | API 레퍼런스 |
| USER_GUIDE.md | 사용자 가이드 |
| ERP_MAPPING_HR_LOGISTICS_EQUIPMENT.md | 인사/물류/설비 매핑 상세 |

---

**문서 버전**: 1.0
**최종 수정일**: 2026-03-04
**유지보안**: Confidential
