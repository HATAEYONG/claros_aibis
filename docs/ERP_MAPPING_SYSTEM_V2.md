# ERP 매핑 관리 시스템 설계문서 v2.0

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | ERP 매핑 관리 시스템 설계문서 |
| 버전 | 2.0.0 |
| 작성일 | 2026-03-03 |
| 작성자 | Claude AI |

---

## 1. 시스템 개요

### 1.1 배경

기존 ERP 연계 시스템은 하드코딩된 매핑 딕셔너리를 사용하여 새로운 ERP 시스템 연계 시 코드 수정이 필요했습니다. 이를 해결하기 위해 데이터베이스 기반의 동적 매핑 관리 시스템을 구현했습니다.

### 1.2 목표

1. **다중 ERP 지원**: YH, FOM, SAP 등 다양한 ERP 시스템 연계
2. **UI 기반 관리**: 코드 수정 없이 UI에서 매핑 관리
3. **테이블 정의서 기반 매핑**: CSV/Excel 형식의 테이블 정의서 가져오기
4. **실시간 검증**: 매핑 구성 시 실시간 유효성 검사
5. **Dashboard/KPI 레이어**: 경영진단용 분석 레이어 제공

### 1.3 현재 구현 현황

| 항목 | 수량 | 설명 |
|------|------|------|
| ERP 소스 | 1 | YH (유한 DB) |
| 소스 테이블 | 90 | YH ERP 테이블 정의 |
| 소스 필드 | 1,533 | 소스 테이블 필드 정의 |
| 타겟 모델 | 124 | 15개 앱 라벨 |
| 타겟 필드 | 1,913 | 타겟 모델 필드 정의 |
| 테이블 매핑 | 162 | 소스→타겟 매핑 |
| 필드 매핑 | 1,618 | 소스 필드→타겟 필드 |

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  (React 18 + TypeScript + Vite)                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ERP 소스 관리    │  테이블 매핑    │  필드 매핑 에디터    ││
│  │  CSV 가져오기/내보내기 │  매핑 검증   │  동기화 모니터링    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                           │
│  (Django 5.0 + DRF)                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ERP Source API  │  Mapping API  │  Validation API  │ Sync ││
│  │  /api/erp-sync/sources/  │  /table-mappings/  │ /field-... ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer (PostgreSQL)                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ERPSource           │  ERPTableDefinition                 ││
│  │  - source_code       │  - source_table_name                ││
│  │  - source_type       │  - module_code                      ││
│  │                      │  - ERPFieldDefinition               ││
│  │  ERPTargetModel      │  ERPTableMapping                    ││
│  │  - model_name        │  - sync_priority                    ││
│  │  - app_label         │  - ERPFieldMapping                  ││
│  │  - ERPTargetField    │                                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ERP Systems                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │  YH ERP     │  │  FOM ERP     │  │  Future ERP Systems     ││
│  │  PostgreSQL │  │  MS SQL      │  │  (SAP, Oracle, etc)     ││
│  └─────────────┘  └──────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
1. ERP 소스 등록 → 2. 테이블 정의 가져오기 → 3. 필드 정의 자동 생성
                                    ↓
8. 데이터 동기화 ← 7. 매핑 검증 ← 6. 필드 매핑 생성
                                    ↓
                            5. 테이블 매핑 생성
                                    ↓
                            4. 타겟 모델 선택/생성
```

---

## 3. 데이터 모델 상세

### 3.1 ERP 소스 모델

#### ERPSource
ERP 시스템 연결 정보를 관리합니다.

```python
class ERPSource(models.Model):
    source_code = models.CharField('소스 코드', max_length=20, unique=True)
    source_name = models.CharField('소스명', max_length=100)
    source_type = models.CharField('소스 타입', max_length=20,
        choices=[
            ('postgresql', 'PostgreSQL'),
            ('mssql', 'MS SQL Server'),
            ('mysql', 'MySQL'),
            ('oracle', 'Oracle'),
            ('api', 'REST API'),
            ('sqlite', 'SQLite'),
        ])
    host = models.CharField('호스트', max_length=255, blank=True)
    port = models.IntegerField('포트', null=True, blank=True)
    database = models.CharField('데이터베이스', max_length=100, blank=True)
    username = models.CharField('사용자명', max_length=100, blank=True)
    password = models.CharField('비밀번호', max_length=255, blank=True)
    is_default = models.BooleanField('기본 소스', default=False)
    is_active = models.BooleanField('활성화', default=True)
```

#### ERPTableDefinition
소스 테이블의 메타데이터를 관리합니다.

```python
class ERPTableDefinition(models.Model):
    erp_source = models.ForeignKey('ERPSource', on_delete=models.CASCADE)
    source_table_name = models.CharField('소스 테이블명', max_length=100)
    table_description = models.CharField('테이블 설명', max_length=255, blank=True)
    module_code = models.CharField('모듈 코드', max_length=50,
        choices=[
            ('SD', '영업'),
            ('PP', '생산'),
            ('QM', '품질'),
            ('MM', '구매'),
            ('FI', '회계'),
            ('HR', '인사'),
            ('CO', '공통'),
        ])
    record_count = models.IntegerField('레코드 수', null=True, blank=True)
```

#### ERPFieldDefinition
소스 테이블의 필드 메타데이터를 관리합니다.

```python
class ERPFieldDefinition(models.Model):
    table_definition = models.ForeignKey('ERPTableDefinition', on_delete=models.CASCADE)
    source_field_name = models.CharField('소스 필드명', max_length=100)
    source_field_type = models.CharField('소스 필드 타입', max_length=50)
    field_description = models.CharField('필드 설명', max_length=255, blank=True)
    is_primary_key = models.BooleanField('기본 키 여부', default=False)
    is_nullable = models.BooleanField('NULL 허용', default=True)
    field_position = models.IntegerField('필드 순서', default=0)
```

### 3.2 타겟 모델

#### ERPTargetModel
MIS 시스템의 타겟 데이터 모델을 정의합니다.

```python
class ERPTargetModel(models.Model):
    model_name = models.CharField('모델명', max_length=100, unique=True)
    model_label = models.CharField('모델 라벨', max_length=100)
    app_label = models.CharField('앱 라벨', max_length=50)
    model_type = models.CharField('모델 타입', max_length=20,
        choices=[
            ('fact', '팩트'),
            ('dimension', '차원'),
            ('snapshot', '스냅샷'),
            ('aggregate', '집계'),
        ])
    db_table_name = models.CharField('DB 테이블명', max_length=100)
    description = models.TextField('설명', blank=True)
```

#### ERPTargetField
타겟 모델의 필드 정의입니다.

```python
class ERPTargetField(models.Model):
    target_model = models.ForeignKey('ERPTargetModel', on_delete=models.CASCADE)
    field_name = models.CharField('필드명', max_length=100)
    field_type = models.CharField('필드 타입', max_length=50,
        choices=[
            ('CharField', '문자열'),
            ('IntegerField', '정수'),
            ('DecimalField', '소수'),
            ('DateField', '날짜'),
            ('DateTimeField', '날짜시간'),
            ('BooleanField', '참/거짓'),
            ('TextField', '긴 텍스트'),
        ])
    field_label = models.CharField('필드 라벨', max_length=100, blank=True)
    is_required = models.BooleanField('필수 여부', default=False)
    is_unique = models.BooleanField('유니크 여부', default=False)
```

### 3.3 매핑 모델

#### ERPTableMapping
소스 테이블과 타겟 모델 간의 매핑을 정의합니다.

```python
class ERPTableMapping(models.Model):
    source_table = models.ForeignKey('ERPTableDefinition', on_delete=models.CASCADE)
    target_model = models.ForeignKey('ERPTargetModel', on_delete=models.CASCADE)
    mapping_code = models.CharField('매핑 코드', max_length=100, unique=True)
    mapping_name = models.CharField('매핑명', max_length=200)
    description = models.TextField('설명', blank=True)
    sync_priority = models.IntegerField('동기화 우선순위',
        choices=[
            (1, '필수'),
            (2, '중요'),
            (3, '일반'),
            (4, '확장'),
        ], default=3)
    sync_type = models.CharField('동기화 타입', max_length=20,
        choices=[
            ('full', '전체'),
            ('incremental', '증분'),
            ('cdc', 'CDC'),
        ], default='full')
    is_active = models.BooleanField('활성화', default=True)
```

#### ERPFieldMapping
소스 필드와 타겟 필드 간의 매핑을 정의합니다.

```python
class ERPFieldMapping(models.Model):
    table_mapping = models.ForeignKey('ERPTableMapping', on_delete=models.CASCADE)
    source_field = models.ForeignKey('ERPFieldDefinition', on_delete=models.CASCADE)
    target_field = models.ForeignKey('ERPTargetField', on_delete=models.CASCADE)
    is_key_field = models.BooleanField('키 필드 여부', default=False)
    is_required = models.BooleanField('필수 매핑 여부', default=False)
    transform_rule = models.CharField('변환 규칙', max_length=20,
        choices=[
            ('none', '변환없음'),
            ('upper', '대문자'),
            ('lower', '소문자'),
            ('trim', '공백제거'),
            ('date_format', '날짜형식'),
            ('decimal_cast', '소수변환'),
            ('concat', '연결'),
            ('lookup', '조회'),
            ('custom', '사용자정의'),
        ], default='none')
    default_value = models.CharField('기본값', max_length=255, blank=True)
    field_order = models.IntegerField('필드 순서', default=0)
```

---

## 4. 타겟 모델 구조

### 4.1 앱 라벨별 분류

| 앱 라벨 | 모델 수 | 주요 목적 |
|---------|---------|-----------|
| etc | 34 | 고객, 협력사, 프로젝트 등 기본 마스터 |
| production | 20 | 생산실적, BOM, MRP, 공정, 설비 |
| quality | 13 | 검사, 불량, SPC, 품질 관리 |
| sales | 10 | 수주, 출하, 매출, 영업 계획 |
| financial | 10 | 전표, 원장, 예산, 재무제표 |
| purchase | 9 | 발주, 입고, 자재, 공급업체 |
| dashboard | 8 | 경영진단 대시보드 레이어 |
| kpi | 9 | KPI 분석 레이어 |
| logistics | 2 | 재고, 창고 관리 |
| productivity | 2 | 시간별 생산, 라인 가동률 |
| common | 3 | 공통 코드 |
| hr | 1 | 사원 정보 |
| development | 1 | R&D 프로젝트 |
| esg | 1 | 환경 영향 |
| traceability | 1 | LOT 추적 |

### 4.2 Dashboard 레이어

경영진단용 종합 대시보드를 위한 **8개** 모델:

| 모델명 | 설명 | 데이터 원본 |
|--------|------|-----------|
| dashboard.ExecutiveSummary | 경영진단 요약 | SDY100, PPB120, QMM140, LEB950, MMA200 |
| dashboard.SalesDashboard | 영업 관리 | SDY100, SDA500, SDA510 |
| dashboard.ProductionDashboard | 생산 관리 | PPB120, PPB125, MESTagValue |
| dashboard.QualityDashboard | 품질 관리 | QMM140, QMM200, QMM210 |
| dashboard.InventoryDashboard | 재고 관리 | LEB950, LEB980 |
| dashboard.ProcurementDashboard | 구매 관리 | MMA100, MMA200, MMA300 |
| dashboard.FinancialDashboard | 재무 관리 | CAM200, CAM300, CAM900 |
| dashboard.HRDashboard | 인사 관리 | DCB100 |

### 4.3 KPI 레이어

핵심 성과 지표 분석을 위한 **9개** 모델:

| 모델명 | 설명 | 데이터 원본 |
|--------|------|-----------|
| kpi.SalesPerformance | 영업 실적 | SDY100, SDA500, SDA510 |
| kpi.SalesTrend | 영업 추이 | SDY100 |
| kpi.ProductionPerformance | 생산 실적 | PPB120, PPB125 |
| kpi.EquipmentEfficiency | 설비 효율 | MESTagValue |
| kpi.QualityPerformance | 품질 실적 | QMM140, QMM200 |
| kpi.DefectAnalysis | 불량 분석 | QMM200, QMM210 |
| kpi.InventoryStatus | 재고 현황 | LEB950, LEB980 |
| kpi.SupplierEvaluation | 공급업체 평가 | MMA200, MMA300 |
| kpi.FinancialSummary | 재무 요약 | CAM200, CAM300 |

### 4.4 추가 확장 모델

새로 추가된 **14개** 확장 모델:

| 모델명 | 설명 | 데이터 원본 |
|--------|------|-----------|
| sales.CustomerComplaint | 고객 불만 처리 | SDA500, SDA510 |
| sales.SalesPipeline | 영업 파이프라인 | SDY100 |
| production.WorkOrderSchedule | 작업 지시 관리 | PPB120, PPB125 |
| production.CycleTimeAnalysis | 사이클 타임 분석 | PPB120, MESTagValue |
| quality.CustomerClaim | 고객 클레임 | QMM200, QMM210 |
| purchase.PurchaseOrderTracking | 발주 추적 | MMA100, MMA200 |
| purchase.InventoryTurnover | 재고 회전율 | LEB950, LEB980 |
| financial.BudgetVsActual | 예산 대 실적 | CAM200, CAM300 |
| financial.DepartmentProfitability | 부문별 수익성 | CAM200, CAM300 |
| esg.EnvironmentalImpact | 환경 영향 | MESTagValue |
| productivity.HourlyProduction | 시간별 생산 | PPB120, MESTagValue |
| productivity.LineUtilization | 라인 가동률 | PPB120, MESTagValue |
| development.RDProject | R&D 프로젝트 | SDY100 |
| traceability.LotTracking | LOT 추적 | PPB120, QMM140, LEB950 |

---

## 5. YH ERP 소스 테이블

### 5.1 모듈별 테이블 분류 (90개)

| 모듈 | 코드 | 테이블 수 | 대표 테이블 |
|------|------|-----------|------------|
| 공통 | CO | 22 | COS100, COS200, COS220, BAA100 |
| 생산 | PP | 23 | PPB120, PPB125, PPC120, PPC130 |
| 품질 | QM | 11 | QMM140, QMM200, QMM210, QPM110 |
| 영업 | SD | 9 | SDY100, SDA500, SDA510, SDB150 |
| 구매 | MM | 8 | MMA100, MMA200, MMY100, GAJ200 |
| 회계 | FI | 7 | CAM200, CAM300, CAM900, COS700 |
| 인사 | HR | 1 | DCB100 |
| MES | ME | 1 | MESTagValue |
| 기타 | ET | 8 | DAA100, PPB130, PPC200, QMM140 |

### 5.2 주요 테이블 상세

#### 영업 (SD)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| SDY100_YH | 영업연월별계획 | plan_mon, cust_nm, itm_nm, plan_qty, plan_amt |
| SDA500_YH | 수주상세 | plan_no, dlv_dt, cust_nm, itm_cd, out_qty |
| SDA510_YH | 출하상세 | dlv_dt, cust_nm, itm_nm, out_qty |
| SDB150_YH | 배차계획 | ship_date, car_no, driver |
| SDP300_YH | 판매관리 | sale_date, cust_nm, item_nm, sale_qty |

#### 생산 (PP)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| PPB120_YH | 생산실적 | out_dt, fac_cd, wc_cd, itm_nm, plan_qty, prd_qty |
| PPB125_YH | 생산입고 | out_dt, itm_cd, in_qty |
| PPB121_YH | 생산계획 | plan_dt, itm_cd, plan_qty |
| PPC120_YH | 작업지시 | work_no, work_dt, item_cd |
| PPC130_YH | 공정능력 | prc_cd, capc_qty |
| PPC140_YH | 작업장정보 | wc_cd, wc_nm |
| MESTagValue_YH | MES 태그 값 | tag_date, tag_name, tag_value |

#### 품질 (QM)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| QMM140_YH | 검사결과 | iqc_dt, itm_cd, qc_qty, pass_qty, fail_qty |
| QMM200_YH | 불량정보 | req_dt, itm_nm, prc_nm, fail_qty |
| QMM210_YH | 불량상세 | fail_cd, fail_nm, fail_qty |
| QPM110_YH | 품질측정 | chk_dt, chk_item, chk_val |

#### 구매 (MM)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| MMA100_YH | 구매현황 | ord_dt, sply_nm, itm_nm, ord_qty, ord_amt |
| MMA200_YH | 구매마스타 | sply_cd, sply_nm, sply_type |
| MMA300_YH | 구매입고 | gr_dt, itm_cd, gr_qty |
| MMY100_YH | 자재마스터 | itm_cd, itm_nm, itm_type |

#### 물류 (LE)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| LEB950_YH | 재고현황 | stk_dt, itm_nm, stk_qty, wh_loc |
| LEB980_YH | 창고별재고 | wh_cd, wh_nm, stk_qty |

#### 회계 (FI)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| CAM200_YH | 회계전표 | slip_dt, acct_nm, dr_amt, cr_amt |
| CAM300_YH | 원장정보 | acct_cd, acct_nm, bal_amt |
| CAM900_YH | 재무제표 | fs_dt, fs_item, fs_amt |

#### 인사 (HR)

| 테이블명 | 설명 | 주요 필드 |
|---------|------|-----------|
| DCB100_YH | 사원정보 | emp_no, emp_nm, dept_cd, hire_dt |

---

## 6. CSV 가져오기/내보내기

### 6.1 CSV 포맷 (테이블 정의)

```csv
테이블명,테이블 설명,모듈구분,컬렴명,컬렴설명,데이터타입,PK여부,NULL허용
SDY100_YH,영업연월별계획,SD,plan_mon,계획월,VARCHAR(6),N,N
SDY100_YH,영업연월별계획,SD,cust_nm,거래처명,VARCHAR(100),Y,Y
SDY100_YH,영업연월별계획,SD,itm_nm,품목명,VARCHAR(100),Y,Y
...
```

**필드 설명:**
- 테이블명: 소스 테이블명 (예: SDY100_YH)
- 테이블 설명: 테이블에 대한 설명
- 모듈구분: 모듈 코드 (SD, PP, QM, MM, FI, HR, CO)
- 컬렴명: 소스 컬럼명 (CSV 파일은 "컬렴명"으로 표기됨)
- 컬렴설명: 컬럼에 대한 설명
- 데이터타입: PostgreSQL 데이터 타입
- PK여부: 기본 키 여부 (Y/N)
- NULL허용: NULL 허용 여부 (Y/N)

### 6.2 CSV 포맷 (매핑 정의)

```csv
소스테이블,소스필드,타겟모델,타겟필드,변환규칙,필수여부
SDY100_YH,plan_mon,sales.Sdy100,period_value,none,Y
SDY100_YH,cust_nm,sales.Sdy100,customer_name,none,N
SDY100_YH,itm_nm,sales.Sdy100,item_name,none,N
...
```

---

## 7. API 명세

### 7.1 기본 URL

```
http://localhost:8000/api/erp-sync/
```

### 7.2 엔드포인트 목록

#### ERP 소스 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /sources/ | ERP 소스 목록 조회 |
| POST | /sources/ | ERP 소스 생성 |
| GET | /sources/{id}/ | ERP 소스 상세 조회 |
| PUT | /sources/{id}/ | ERP 소스 수정 |
| DELETE | /sources/{id}/ | ERP 소스 삭제 |
| POST | /sources/{id}/test_connection/ | DB 연결 테스트 |
| POST | /sources/{id}/import_tables/ | 테이블 정의 가져오기 |

#### 테이블 정의 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /table-definitions/ | 테이블 정의 목록 조회 |
| GET | /table-definitions/{id}/ | 테이블 정의 상세 조회 |
| GET | /table-definitions/{id}/fields/ | 테이블 필드 목록 조회 |

#### 타겟 모델 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /target-models/ | 타겟 모델 목록 조회 |
| POST | /target-models/ | 타겟 모델 생성 |
| GET | /target-models/{id}/ | 타겟 모델 상세 조회 |
| PUT | /target-models/{id}/ | 타겟 모델 수정 |
| DELETE | /target-models/{id}/ | 타겟 모델 삭제 |
| GET | /target-models/{id}/fields/ | 타겟 필드 목록 조회 |

#### 매핑 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /table-mappings/ | 테이블 매핑 목록 조회 |
| POST | /table-mappings/ | 테이블 매핑 생성 |
| GET | /table-mappings/{id}/ | 테이블 매핑 상세 조회 |
| PUT | /table-mappings/{id}/ | 테이블 매핑 수정 |
| DELETE | /table-mappings/{id}/ | 테이블 매핑 삭제 |
| GET | /field-mappings/ | 필드 매핑 목록 조회 |
| POST | /field-mappings/ | 필드 매핑 생성 |
| GET | /field-mappings/{id}/ | 필드 매핑 상세 조회 |
| PUT | /field-mappings/{id}/ | 필드 매핑 수정 |
| DELETE | /field-mappings/{id}/ | 필드 매핑 삭제 |

#### 가져오기/내보내기

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /import-export/import_from_csv/ | CSV 매핑 가져오기 |
| GET | /import-export/export_to_csv/ | CSV 매핑 내보내기 |

### 7.3 요청/응답 예시

#### ERP 소스 생성 (POST /sources/)

**요청:**
```json
{
  "source_code": "YH",
  "source_name": "유한 DB",
  "source_type": "postgresql",
  "host": "133.186.214.219",
  "port": 27455,
  "database": "emax_yuhan",
  "username": "postgres",
  "password": "password",
  "is_default": true,
  "is_active": true
}
```

**응답:**
```json
{
  "id": 1,
  "source_code": "YH",
  "source_name": "유한 DB",
  "source_type": "postgresql",
  "is_default": true,
  "is_active": true,
  "created_at": "2026-03-03T10:00:00Z"
}
```

#### 테이블 매핑 목록 조회 (GET /table-mappings/)

**응답:**
```json
{
  "count": 162,
  "results": [
    {
      "id": 1,
      "mapping_code": "SDY100_YH_SALES_TO_SDY100",
      "mapping_name": "SDY100_YH → sales.Sdy100",
      "source_table": {
        "id": 1,
        "source_table_name": "SDY100_YH",
        "table_description": "영업연월별계획"
      },
      "target_model": {
        "id": 1,
        "model_name": "sales.Sdy100",
        "model_label": "영업연월별계획"
      },
      "sync_priority": 1,
      "sync_type": "full",
      "is_active": true
    }
  ]
}
```

---

## 8. Frontend 구현

### 8.1 컴포넌트 구조

```
src/
├── components/
│   ├── erp/
│   │   ├── MappingManagement.tsx      # 매핑 관리 메인
│   │   ├── ERPSourceManagement.tsx    # ERP 소스 관리
│   │   ├── TableMappingEditor.tsx     # 테이블 매핑 에디터
│   │   ├── FieldMappingEditor.tsx     # 필드 매핑 에디터
│   │   ├── ImportExportMappings.tsx   # 가져오기/내보내기
│   │   └── SyncMonitoring.tsx         # 동기화 모니터링
│   └── YHDatabaseConnection.tsx       # YH DB 뷰어
├── services/
│   └── erpMappingService.ts           # ERP 매핑 API 서비스
└── App.tsx                            # 메인 앱
```

### 8.2 주요 컴포넌트 설명

#### MappingManagement.tsx
전체 매핑 현황을 표시하고 모듈별 매핑 통계를 보여줍니다.

**주요 기능:**
- 모듈별 테이블 매핑 현황
- 필드 매핑 현황
- 모듈별 상세 보기

#### ERPSourceManagement.tsx
ERP 소스를 관리합니다.

**주요 기능:**
- ERP 소스 목록 조회
- ERP 소스 생성/수정/삭제
- DB 연결 테스트
- 테이블 정의 가져오기

#### TableMappingEditor.tsx
테이블 매핑을 관리합니다.

**주요 기능:**
- 소스 테이블 선택
- 타겟 모델 선택
- 매핑 생성/수정/삭제
- 동기화 설정

#### FieldMappingEditor.tsx
필드 매핑을 관리합니다.

**주요 기능:**
- 소스 필드 목록 표시
- 타겟 필드 목록 표시
- 필드 매핑 생성/수정/삭제
- 변환 규칙 설정

### 8.3 API 서비스

```typescript
// erpMappingService.ts
const API_BASE = 'http://localhost:8000/api/erp-sync';

export const erpMappingService = {
  // ERP Sources
  getSources: () => fetch(`${API_BASE}/sources/`),
  createSource: (data) => fetch(`${API_BASE}/sources/`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  testConnection: (id) => fetch(`${API_BASE}/sources/${id}/test_connection/`, {
    method: 'POST'
  }),

  // Table Mappings
  getTableMappings: () => fetch(`${API_BASE}/table-mappings/`),
  createTableMapping: (data) => fetch(`${API_BASE}/table-mappings/`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Field Mappings
  getFieldMappings: () => fetch(`${API_BASE}/field-mappings/`),
  createFieldMapping: (data) => fetch(`${API_BASE}/field-mappings/`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};
```

---

## 9. 데이터 동기화

### 9.1 동기화 타입

| 타입 | 설명 | 사용 대상 | 동기화 주기 |
|------|------|-----------|------------|
| full | 전체 데이터 동기화 | 마스터 데이터 | 초기 로드, 주간 |
| incremental | 증분 동기화 (날짜 기반) | 일일 실적 데이터 | 일일 |
| cdc | Change Data Capture | 실시간 데이터 | 실시간 (예정) |

### 9.2 동기화 우선순위

| 우선순위 | 설명 | 동기화 주기 | 예시 |
|----------|------|------------|------|
| 1 (필수) | 핵심 업무 데이터 | 실시간 ~ 1시간 | 생산실적, 출하, 회계전표 |
| 2 (중요) | 중요 운영 데이터 | 일일 | 검사결과, 재고현황 |
| 3 (일반) | 일반 참조 데이터 | 주간 | 협력사, 자재마스타 |
| 4 (확장) | 확장 분석 데이터 | 월간 | MES 태그, 이력 데이터 |

### 9.3 동기화 절차

```
1. 동기화 대상 선정
   └─> sync_priority = 1, is_active = True

2. 소스 데이터 추출
   └─> ERPSource 연결 → 쿼리 실행

3. 데이터 변환
   └─> 필드 매핑 적용 → 변환 규칙 적용

4. 타겟 데이터 적재
   └─> ERPTargetModel 테이블에 INSERT/UPDATE

5. 검증 및 로깅
   └─> ERPMappingValidation 생성 → ERPSyncLog 생성
```

---

## 10. 검증 및 품질 관리

### 10.1 매핑 검증 규칙

#### 구조 검증

| 항목 | 검증 내용 |
|------|-----------|
| 소스 테이블 존재 | ERP 테이블 정의에 존재하는지 |
| 타겟 모델 존재 | 타겟 모델에 존재하는지 |
| 소스 필드 존재 | 소스 테이블에 필드가 존재하는지 |
| 타겟 필드 존재 | 타겟 모델에 필드가 존재하는지 |
| 필수 필드 | 필수 매핑이 모두 있는지 |
| 데이터 타입 | 소스와 타겟 타입이 호환되는지 |

#### 데이터 검증

| 항목 | 검증 내용 |
|------|-----------|
| NULL 값 | 필수 필드의 NULL 값 |
| 중복 데이터 | 유니크 필드의 중복 |
| 참조 무결성 | 외래키 참조 유효성 |
| 데이터 길이 | 최대 길이 초과 여부 |
| 데이터 형식 | 날짜, 숫자 형식 유효성 |

### 10.2 오류 처리

| 오류 유형 | 처리 방법 |
|-----------|-----------|
| skip | 오류 레코드 건너뛰기 |
| log | 오류 로그에 기록 후 계속 |
| abort | 동기화 중단 |

---

## 11. 변경 이력

### 버전 2.0.0 (2026-03-03)

**데이터 추가:**
- 124개 타겟 모델 생성
- 162개 테이블 매핑 생성
- 1,618개 필드 매핑 생성
- 90개 YH ERP 소스 테이블 정의
- 1,533개 소스 필드 정의

**기능 추가:**
- Dashboard 레이어 (8개 모델)
- KPI 레이어 (9개 모델)
- 14개 확장 모델 추가
- 15개 앱 라벨 분류

**문서 업데이트:**
- 기술문서 v2.0
- 데이터베이스 스키마 v2.0
- ERP 매핑 시스템 v2.0

### 버전 1.0.0 (2026-02-28)

**초기 릴리스:**
- ERP 매핑 관리 시스템 기본架构
- 모델 구조 정의
- API 엔드포인트 정의
- CSV 가져오기/내보내기 기능

---

## 12. 향후 개발 계획

- [ ] 다중 ERP 동시 연동 지원
- [ ] 실시간 데이터 동기화 (CDC)
- [ ] 매핑 버전 관리
- [ ] AI 기반 필드 매핑 추천
- [ ] 데이터 품질 대시보드
- [ ] GraphQL API 지원
- [ ] WebSocket 기반 실시간 알림
- [ ] 매핑 시뮬레이션 기능

---

## 13. 참고 자료

- Django 문서: https://docs.djangoproject.com/
- DRF 문서: https://www.django-rest-framework.org/
- React 문서: https://react.dev/
- PostgreSQL 문서: https://www.postgresql.org/docs/

---

**문서 버전**: 2.0.0
**최종 수정일**: 2026-03-03
**유지보수 담당**: Claude AI
