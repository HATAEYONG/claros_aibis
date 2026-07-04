# Claros MIS-AI Dashboard 기술문서 v3.0

## 문서 버전 정보

| 버전 | 일자 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 3.0 | 2026-03-04 | Claude | 16개 모듈 96개 API 반영, 아키텍처 상세화 |
| 2.0 | 2025-12-20 | Claude | ERP 매핑 시스템 추가 |
| 1.0 | 2025-01-01 | System | 초기 버전 |

---

## 1. 시스템 개요

### 1.1 프로젝트 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Claros MIS-AI Dashboard |
| **대상 기업** | 유한산업 (YH ERP) |
| **목적** | 이기종 ERP 연계 매핑 관리 시스템을 통한 경영정보 시각화 및 AI 기반 분석 제공 |
| **아키텍처** | Django 5.0 Backend + React 18/TypeScript Frontend |
| **데이터베이스** | PostgreSQL 15.x (운영), YH ERP PostgreSQL (원천) |

### 1.2 기술 스택

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Backend** | Django | 5.0 | 웹 프레임워크 |
| **Backend** | Django REST Framework | 3.14 | REST API |
| **Database** | PostgreSQL | 15.x | 운영 DB |
| **Frontend** | React | 18.2 | UI 프레임워크 |
| **Frontend** | TypeScript | 5.x | 타입스크립트 |
| **Frontend** | Vite | 5.x | 빌드 도구 |
| **UI Library** | TailwindCSS | 3.x | 스타일링 |
| **UI Library** | shadcn/ui | latest | 컴포넌트 |
| **Charts** | Recharts | latest | 차트 라이브러리 |
| **HTTP Client** | axios | latest | API 호출 |

### 1.3 시스템 특징

- **이기종 ERP 연계**: YH, FOM, SAP 등 다중 ERP 소스 지원
- **동적 매핑 관리**: UI 기반 테이블/필드 매핑 관리
- **폴백 메커니즘**: ERP 연결 실패 시 Mock 데이터 자동 제공
- **96개 API 엔드포인트**: 16개 모듈 커버리지
- **실시간 데이터 동기화**: 우선순위 기반 데이터 동기화

---

## 2. 모듈 구성

### 2.1 전체 모듈 목록

| # | 모듈 | API 수 | 주요 기능 |
|---|------|--------|-----------|
| 1 | 재무제표 | 4 | 손익계산서, 대차대조표, 현금흐름표, 자본변동표 |
| 2 | 재무관리 | 6 | 예산대비실적, 부서수익성, 계정별원가, 월간재무요약 |
| 3 | 영업관리 | 5 | 매출실적, 고객분석, 수주관리, 매출추이, 납품현황 |
| 4 | 생산성분석 | 4 | OEE분석, 라인생산성, 설비가동률, 시간별생산 |
| 5 | 개발관리 | 5 | R&D프로젝트, 개발일정, 개발예산, 자원배정, 성과분석 |
| 6 | 생산관리 | 6 | 생산계획, 생산현황, 작업지시, BOM, MRP, 설비상태 |
| 7 | 품질관리 | 6 | 입하검사, 불량관리, SPC분석, 품질클레임, 개선활동, 품질지표 |
| 8 | 인사관리 | 6 | 직원목록, 부서조직, 급여정보, 근태관리, 인력통계, 휴가관리 |
| 9 | 자재관리 | 6 | 재고현황, 자재소요계획, 창고관리, 자재소비, 재고이동, 자재수불부 |
| 10 | 구매관리 | 7 | 구매발주, 구매요청, 구매실적, 구매계획, 공급사평가, 공급사관리, 구매통계 |
| 11 | 물류관리 | 6 | 입고관리, 출고관리, 창고관리, 배송관리, 재고이동, 운송관리 |
| 12 | 설비관리 | 6 | 설비목록, 설비상태, 예방보전, 고장보전, 수리이력, 설비성과 |
| 13 | 제조관리 | 6 | 생산계획, 작업지시, 생산실적, 공정관리, 라우팅관리, 작업장관리 |
| 14 | 원가관리 | 6 | 제품별원가, 원자재비, 노무비, 제조경비, 원가배부, 원가비교 |
| 15 | 프로젝트관리 | 6 | 프로젝트현황, 진척관리, 예산관리, 자원배정, 마일스톤, 성과분석 |
| 16 | 관리회계 | 6 | 비용센터분석, 수익센터분석, 원가차이분석, 손익분기점, 예산대비실적, ABC원가 |

### 2.2 대시보드 레이어 API

| 경로 | 기능 | 소스 테이블 |
|------|------|-------------|
| `/dashboard/executive-summary/` | 경영진 요약 | SDY100_YH, SDM100_YH |
| `/dashboard/sales/` | 영업 대시보드 | SDY100_YH, SDA500_YH, SDA510_YH |
| `/dashboard/production/` | 생산 대시보드 | PPB120_YH, PPB125_YH |
| `/dashboard/quality/` | 품질 대시보드 | QMM140_YH, QMM200_YH |
| `/dashboard/inventory/` | 재고 대시보드 | LEB950_YH, LEB980_YH |
| `/dashboard/procurement/` | 구매 대시보드 | MMA100_YH, MMA200_YH |
| `/dashboard/financial/` | 재무 대시보드 | CAM200_YH, CAM300_YH |
| `/dashboard/hr/` | 인사 대시보드 | PPB100_YH, HRT100_YH |

### 2.3 KPI 레이어 API

| 경로 | 기능 | 소스 테이블 |
|------|------|-------------|
| `/kpi/sales-performance/` | 매출 성과 | SDY100_YH |
| `/kpi/production-performance/` | 생산 성과 | PPB100_YH, PPB120_YH |
| `/kpi/quality-performance/` | 품질 성과 | QMM140_YH, QMM200_YH |
| `/kpi/equipment-efficiency/` | 설비 효율 | FMA100_YH, PPC140_YH |

---

## 3. ERP 매핑 관리 시스템

### 3.1 데이터 모델 구조

#### 3.1.1 ERP 소스 모델 (`erp_sync/models/erp_source.py`)

```python
class ERPSource(models.Model):
    """ERP 시스템 소스 정의"""
    erp_source_id = AutoField(primary_key=True)
    source_code = CharField(max_length=20, unique=True)  # YH, FOM, SAP
    source_name = CharField(max_length=100)
    source_type = CharField(max_length=20)  # postgresql, mssql, mysql, oracle
    host = CharField(max_length=255)
    port = IntegerField()
    database_name = CharField(max_length=100)
    is_default = BooleanField(default=False)
    is_active = BooleanField(default=True)

class ERPTableDefinition(models.Model):
    """ERP 테이블 정의"""
    table_id = AutoField(primary_key=True)
    erp_source = ForeignKey(ERPSource)
    source_table_name = CharField(max_length=100)  # SDY100_YH
    module_code = CharField(max_length=50)  # SD, PP, QM, MM, FI
    record_count = IntegerField(default=0)

class ERPFieldDefinition(models.Model):
    """ERP 필드 정의"""
    field_id = AutoField(primary_key=True)
    table_definition = ForeignKey(ERPTableDefinition)
    source_field_name = CharField(max_length=100)
    source_field_type = CharField(max_length=50)
    is_primary_key = BooleanField(default=False)
```

#### 3.1.2 MIS 타겟 모델 (`erp_sync/models/mis_target.py`)

```python
class ERPTargetModel(models.Model):
    """MIS 타겟 모델 정의"""
    target_model_id = AutoField(primary_key=True)
    model_name = CharField(max_length=100, unique=True)  # MonthlySales
    app_label = CharField(max_length=50)  # sales, production
    model_type = CharField(max_length=20)  # fact, dimension, snapshot

class ERPTargetField(models.Model):
    """MIS 타겟 필드 정의"""
    target_field_id = AutoField(primary_key=True)
    target_model = ForeignKey(ERPTargetModel)
    field_name = CharField(max_length=100)
    field_type = CharField(max_length=50)  # CharField, IntegerField, DecimalField
    is_required = BooleanField(default=False)
```

#### 3.1.3 매핑 모델 (`erp_sync/models/mapping.py`)

```python
class ERPTableMapping(models.Model):
    """ERP 테이블 매핑"""
    mapping_id = AutoField(primary_key=True)
    mapping_code = CharField(max_length=50, unique=True)
    source_table = ForeignKey(ERPTableDefinition)
    target_model = ForeignKey(ERPTargetModel)
    sync_priority = IntegerField(default=2)  # 1:실시간, 2:시간별, 3:일별, 4:주별
    sync_type = CharField(max_length=20)  # full, incremental, cdc
    is_active = BooleanField(default=True)

class ERPFieldMapping(models.Model):
    """ERP 필드 매핑"""
    field_mapping_id = AutoField(primary_key=True)
    table_mapping = ForeignKey(ERPTableMapping)
    source_field = ForeignKey(ERPFieldDefinition)
    target_field = ForeignKey(ERPTargetField)
    transform_rule = CharField(max_length=20)  # none, upper, date_format, decimal_cast
    default_value = CharField(max_length=255, blank=True)
    is_key_field = BooleanField(default=False)
```

### 3.2 서비스 레이어 아키텍처

```
erp_sync/services/
├── dashboard_data_service.py      # 대시보드 레이어 데이터
├── financial_statement_service.py  # 재무제표 데이터
├── financial_management_data_service.py    # 재무관리 데이터
├── sales_data_service.py           # 영업관리 데이터
├── productivity_data_service.py    # 생산성분석 데이터
├── development_data_service.py     # 개발관리 데이터
├── production_data_service.py      # 생산관리 데이터
├── quality_data_service.py         # 품질관리 데이터
├── hr_management_data_service.py   # 인사관리 데이터
├── material_management_data_service.py  # 자재관리 데이터
├── procurement_management_data_service.py  # 구매관리 데이터
├── logistics_management_data_service.py    # 물류관리 데이터
├── equipment_management_data_service.py    # 설비관리 데이터
├── manufacturing_management_data_service.py # 제조관리 데이터
├── cost_management_data_service.py # 원가관리 데이터
├── project_management_data_service.py  # 프로젝트관리 데이터
└── managerial_accounting_data_service.py # 관리회계 데이터
```

### 3.3 데이터 동기화 흐름

```
1. 요청 단계
   → API 요청 수신
   → Query Parameters 파싱

2. ERP 연결 단계
   → DataSyncService.get_default_source()
   → ERP Source 정보 조회

3. 데이터 조회 단계
   → DataSyncService.fetch_from_erp()
   → PostgreSQL YH ERP 접속
   → SQL 쿼리 실행

4. 데이터 변환 단계
   → JSON 파싱
   → 필드 매핑 적용
   → 데이터 변환 규칙 적용

5. 응답 단계
   → Response 반환
   → source_tables, data_source 포함

6. 폴백 단계 (ERP 실패 시)
   → Mock 데이터 생성
   → data_source = 'fallback' 표시
```

---

## 4. API 레퍼런스

### 4.1 API URL 구조

```
/api/erp-sync/
├── dashboard/           # 대시보드 레이어 (8 endpoints)
├── kpi/                # KPI 레이어 (4 endpoints)
├── data/               # 원본 ERP 테이블 데이터 (1 endpoint)
├── financial/          # 재무제표 (4 endpoints)
├── productivity/        # 생산성분석 (4 endpoints)
├── sales/              # 영업관리 (5 endpoints)
├── development/         # 개발관리 (5 endpoints)
├── production/          # 생산관리 (6 endpoints)
├── quality/             # 품질관리 (6 endpoints)
├── hr/                 # 인사관리 (6 endpoints)
├── material/            # 자재관리 (6 endpoints)
├── procurement/         # 구매관리 (7 endpoints)
├── logistics/           # 물류관리 (6 endpoints)
├── equipment/           # 설비관리 (6 endpoints)
├── manufacturing/       # 제조관리 (6 endpoints)
├── cost/               # 원가관리 (6 endpoints)
├── project/            # 프로젝트관리 (6 endpoints)
├── managerial-accounting/  # 관리회계 (6 endpoints)
├── sources/            # ERP 소스 CRUD (ViewSets)
├── table-definitions/  # 테이블 정의 CRUD (ViewSets)
├── field-definitions/  # 필드 정의 CRUD (ViewSets)
├── target-models/      # 타겟 모델 CRUD (ViewSets)
├── target-fields/      # 타겟 필드 CRUD (ViewSets)
├── table-mappings/     # 테이블 매핑 CRUD (ViewSets)
├── field-mappings/     # 필드 매핑 CRUD (ViewSets)
├── validations/        # 매핑 검증 (ViewSets)
└── import-export/       # CSV 가져오기/내보내기 (ViewSets)
```

### 4.2 API 응답 형식

#### 4.2.1 성공 응답

```json
{
    "factory_code": "FAC01",
    "work_month": "202603",
    "total_count": 50,
    "results": [
        {
            "item_code": "ITEM-001",
            "item_name": "품목명",
            "quantity": 1000,
            "unit_price": 5000,
            "source_tables": ["SDY100_YH"],
            "data_source": "erp"
        }
    ],
    "source_tables": ["SDY100_YH"],
    "data_source": "erp"
}
```

#### 4.2.2 에러 응답

```json
{
    "error": "Error message description",
    "results": [],
    "total_count": 0
}
```

### 4.3 Query Parameters

| 파라미터 | 타입 | 설명 | 예시 |
|----------|------|------|------|
| factory_code | string | 공장 코드 | FAC01 |
| from_date | string | 시작일자 | 2026-01-01 |
| to_date | string | 종료일자 | 2026-12-31 |
| work_month | string | 작업년월 | 202603 |
| work_year | string | 작업년도 | 2026 |
| status | string | 상태 코드 | pending, progress, complete |
| limit | integer | 반환 레코드 수 | 100 |

---

## 5. 데이터베이스 스키마

### 5.1 테이블 목록

| 테이블명 | 설명 | 레코드 수 |
|----------|------|-----------|
| erp_source | ERP 소스 정보 | 1-10 |
| erp_table_definition | ERP 테이블 정의 | 100-200 |
| erp_field_definition | ERP 필드 정의 | 1000-2000 |
| erp_target_model | MIS 타겟 모델 | 50-100 |
| erp_target_field | MIS 타겟 필드 | 500-1000 |
| erp_table_mapping | 테이블 매핑 | 100-200 |
| erp_field_mapping | 필드 매핑 | 1000-2000 |
| erp_mapping_validation | 매핑 검증 기록 | Unlimited |
| erp_sync_config | 동기화 설정 | 1 |
| erp_sync_log | 동기화 로그 | Unlimited |

### 5.2 인덱스 정의

```sql
-- ERP Source
CREATE INDEX idx_erp_source_code ON erp_source(source_code);
CREATE INDEX idx_erp_source_default ON erp_source(is_default);
CREATE INDEX idx_erp_source_active ON erp_source(is_active);

-- ERP Table Definition
CREATE INDEX idx_table_source ON erp_table_definition(erp_source_id);
CREATE INDEX idx_table_module ON erp_table_definition(module_code);
CREATE INDEX idx_table_name ON erp_table_definition(source_table_name);

-- ERP Field Definition
CREATE INDEX idx_field_table ON erp_field_definition(table_definition_id);
CREATE INDEX idx_field_name ON erp_field_definition(source_field_name);

-- ERP Table Mapping
CREATE INDEX idx_mapping_source ON erp_table_mapping(source_table_id);
CREATE INDEX idx_mapping_target ON erp_table_mapping(target_model_id);
CREATE INDEX idx_mapping_priority ON erp_table_mapping(sync_priority);
CREATE INDEX idx_mapping_active ON erp_table_mapping(is_active);

-- ERP Field Mapping
CREATE INDEX idx_field_mapping_table ON erp_field_mapping(table_mapping_id);
CREATE INDEX idx_field_mapping_source ON erp_field_mapping(source_field_id);
CREATE INDEX idx_field_mapping_target ON erp_field_mapping(target_field_id);
```

---

## 6. 배포 가이드

### 6.1 사전 요구사항

- Python 3.11+
- PostgreSQL 15.x
- Node.js 18+
- npm or yarn

### 6.2 Backend 설치

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install django==5.0 djangorestframework psycopg2-binary

# 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 초기 데이터 로드
python manage.py loaddata erp_sync_initial_data.json

# 서버 시작
python manage.py runserver 0.0.0.0:8000
```

### 6.3 Frontend 설치

```bash
# 의존성 설치
npm install

# 개발 모드 시작
npm run dev

# 프로덕션 빌드
npm run build
```

### 6.4 환경 변수 설정

```bash
# Backend .env
DATABASE_URL=postgresql://user:password@localhost:5432/claros_mis
SECRET_KEY=your-secret-key
DEBUG=True

# ERP Connection (YH)
YH_ERP_HOST=133.186.214.219
YH_ERP_PORT=27455
YH_ERP_DATABASE=yuhan
YH_ERP_USER=postgres
YH_ERP_PASSWORD=password
```

---

## 7. 운영 관리

### 7.1 로그 모니터링

```python
# 로그 설정 (settings.py)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/erp_sync.log',
        },
    },
    'loggers': {
        'erp_sync': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 7.2 성능 모니터링

- **API 응답시간**: < 500ms (평균)
- **데이터 동기화**: 우선순위별 주기 관리
- **DB 연결풀**: 최대 20개 연결
- **캐시 정책**: Redis 적용 고려

### 7.3 백업 전략

```bash
# PostgreSQL 매일 백업
0 2 * * * pg_dump -U postgres claros_mis > backup_$(date +\%Y\%m\%d).sql

# ERP 매핑 설정 백업
python manage.py dumpdata erp_sync > erp_mapping_backup_$(date +\%Y\%m\%d).json
```

---

## 8. 문의 및 지원

- **기술 문의**: dev@claros.co.kr
- **운영 문의**: ops@claros.co.kr
- **프로젝트 저장소**: https://github.com/claros/mis-ai-dashboard

---

## 부록 A: ERP 테이블 매핑 상세

- ERP_MAPPING_HR_LOGISTICS_EQUIPMENT.md: 인사/물류/설비관리 매핑
- ERP_MAPPING_SYSTEM.md: 매핑 시스템 전체 설계
- API_REFERENCE.md: API 상세 레퍼런스

## 부록 B: 변경 이력

| 일자 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-03-04 | 3.0 | 16개 모듈 96개 API 반영, 문서 전면 개편 |
| 2025-12-20 | 2.0 | ERP 매핑 시스템 추가 |
| 2025-01-01 | 1.0 | 초기 버전 |
