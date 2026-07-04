# Claros MIS-AI Dashboard 기술문서 v2.0

## 1. 시스템 개요

### 1.1 프로젝트 정보
- **프로젝트명**: Claros MIS-AI Dashboard
- **대상 기업**: 유한산업 (YH ERP)
- **목적**: 이기종 ERP 연계 매핑 관리 시스템을 통한 경영정보 시각화 및 AI 기반 분석 제공
- **아키텍처**: Django 5.0 Backend + React 18/TypeScript Frontend
- **데이터베이스**: PostgreSQL (운영)

### 1.2 기술 스택
| 구분 | 기술 | 버전 |
|------|------|------|
| Backend | Django, Django REST Framework | 5.0 |
| Database | PostgreSQL | 15.x |
| Frontend | React, TypeScript, Vite | 18, 5.x |
| UI | TailwindCSS, shadcn/ui | latest |
| Charts | Recharts | latest |
| API | RESTful API | - |

### 1.3 핵심 기능
- **이기종 ERP 연계**: YH, FOM, SAP 등 다중 ERP 소스 지원
- **동적 매핑 관리**: UI 기반 테이블/필드 매핑 관리
- **대시보드 레이어**: 경영진단용 종합 대시보드
- **KPI 분석 레이어**: 핵심 성과 지표 분석 모델
- **CSV 가져오기/내보내기**: 대량 매핑 데이터 관리

---

## 2. ERP 매핑 관리 시스템

### 2.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + TS)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ ERP 소스 관리 │ │ 테이블 매핑   │ │ 필드 매핑 에디터         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ CSV 가져오기  │ │ CSV 내보내기  │ │ 동기화 모니터링          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API (DRF)                             │
│  /api/erp-sync/sources/     /api/erp-sync/table-mappings/      │
│  /api/erp-sync/field-mappings/  /api/erp-sync/import-export/   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL DB                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐  │
│  │ ERP 소스        │ │ 타겟 모델       │ │ 매핑 정보        │  │
│  │ - ERPSource     │ │ - ERPTargetModel│ │ - Table Mapping  │  │
│  │ - Table Def     │ │ - ERPTargetField│ │ - Field Mapping  │  │
│  │ - Field Def     │ │                 │ │                  │  │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 모델 구조

#### 2.2.1 ERP 소스 모델 (`erp_sync/models/erp_source.py`)

**ERPSource**: ERP 시스템 소스 정의
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| source_code | CharField(20) | 소스 코드 (YH, FOM, SAP) |
| source_name | CharField(100) | 소스명 |
| source_type | CharField(20) | DB 유형 (postgresql, mssql, mysql, oracle) |
| host | CharField(100) | DB 호스트 |
| port | Integer | DB 포트 |
| database | CharField(100) | 데이터베이스명 |
| username | CharField(100) | 사용자명 |
| password | CharField(100) | 비밀번호 (암호화) |
| is_default | BooleanField | 기본 소스 여부 |
| is_active | BooleanField | 활성화 여부 |

**ERPTableDefinition**: 소스 테이블 메타데이터
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| erp_source | ForeignKey | ERP 소스 |
| source_table_name | CharField(50) | 소스 테이블명 |
| table_description | TextField | 테이블 설명 |
| module_code | CharField(20) | 모듈 코드 (SD, PP, QM, MM, FI) |
| record_count | Integer | 레코드 수 |
| last_sync_at | DateTime | 마지막 동기화 시간 |

**ERPFieldDefinition**: 소스 필드 메타데이터
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| table_definition | ForeignKey | 테이블 정의 |
| source_field_name | CharField(100) | 소스 필드명 |
| source_field_type | CharField(50) | 필드 타입 |
| field_description | CharField(200) | 필드 설명 |
| is_primary_key | BooleanField | 기본 키 여부 |
| is_nullable | BooleanField | NULL 허용 여부 |

#### 2.2.2 MIS 타겟 모델 (`erp_sync/models/mis_target.py`)

**ERPTargetModel**: MIS 타겟 모델 정의
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| model_name | CharField(100) | 모델명 (app.ModelName) |
| model_label | CharField(100) | 모델 라벨 |
| app_label | CharField(50) | 앱 라벨 (sales, production) |
| model_type | CharField(20) | 타입 (fact/dimension) |
| db_table_name | CharField(100) | DB 테이블명 |
| description | TextField | 설명 |

**ERPTargetField**: MIS 타겟 필드 정의
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| target_model | ForeignKey | 타겟 모델 |
| field_name | CharField(100) | 필드명 |
| field_type | CharField(50) | 필드 타입 |
| field_label | CharField(100) | 필드 라벨 |
| is_required | BooleanField | 필수 여부 |
| is_unique | BooleanField | 유니크 여부 |

#### 2.2.3 매핑 모델 (`erp_sync/models/mapping.py`)

**ERPTableMapping**: 테이블 매핑
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| source_table | ForeignKey | 소스 테이블 |
| target_model | ForeignKey | 타겟 모델 |
| mapping_code | CharField(100) | 매핑 코드 |
| mapping_name | CharField(200) | 매핑명 |
| description | TextField | 설명 |
| sync_priority | Integer | 동기화 우선순위 (1:필수, 2:중요, 3:일반, 4:확장) |
| sync_type | CharField(20) | 동기화 타입 (full/incremental) |
| sync_schedule | CharField(50) | 동기화 스케줄 |
| is_active | BooleanField | 활성화 여부 |

**ERPFieldMapping**: 필드 매핑
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| table_mapping | ForeignKey | 테이블 매핑 |
| source_field | ForeignKey | 소스 필드 |
| target_field | ForeignKey | 타겟 필드 |
| is_key_field | BooleanField | 키 필드 여부 |
| is_required | BooleanField | 필수 여부 |
| transform_rule | CharField(50) | 변환 규칙 |
| default_value | CharField(100) | 기본값 |
| field_order | Integer | 필드 순서 |

**ERPMappingValidation**: 매핑 검증
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | PK |
| table_mapping | ForeignKey | 테이블 매핑 |
| validation_type | CharField(50) | 검증 타입 |
| validation_rule | TextField | 검증 규칙 |
| error_message | TextField | 오류 메시지 |
| is_valid | BooleanField | 유효 여부 |

---

## 3. 타겟 모델 구조

### 3.1 모델 분류 현황

전체 **124개** 타겟 모델이 **15개** 앱 라벨로 구성됩니다.

| 앱 라벨 | 모델 수 | 설명 |
|---------|---------|------|
| etc | 34 | 기타 공통 모듈 (고객, 협력사, 프로젝트 등) |
| production | 20 | 생산 관리 (생산실적, BOM, MRP, 작업지시 등) |
| quality | 13 | 품질 관리 (검사, 불량, SPC 등) |
| sales | 10 | 영업 관리 (수주, 출하, 매출 등) |
| financial | 10 | 재무/회계 (전표, 원장, 예산 등) |
| purchase | 9 | 구매 관리 (발주, 자재, 공급업체 등) |
| dashboard | 8 | 대시보드 레이어 (경영진단 요약 등) |
| kpi | 9 | KPI 분석 레이어 (실적, 추이, 효율 등) |
| logistics | 2 | 물류/재고 관리 |
| productivity | 2 | 생산성 분석 (시간별 생산, 라인 가동률) |
| common | 3 | 공통 코드 |
| hr | 1 | 인사 관리 |
| development | 1 | R&D 관리 |
| esg | 1 | ESG 경영 |
| traceability | 1 | LOT 추적 |

### 3.2 Dashboard 레이어 모델

경영진단용 종합 대시보드를 위한 **8개** 모델:

| 모델명 | 설명 | 주요 필드 |
|--------|------|-----------|
| dashboard.ExecutiveSummary | 경영진단 요약 | 매출, 이익, 생산달성률, 품질합격률, 재고회전율 |
| dashboard.SalesDashboard | 영업 관리 대시보드 | 일매출, 주문건수, 출하건수, TOP 거래처 |
| dashboard.ProductionDashboard | 생산 관리 대시보드 | 계획수량, 생산수량, 양품수량, 불량수량, OEE |
| dashboard.QualityDashboard | 품질 관리 대시보드 | 검사건수, 합격건수, 불량건수, 클레임건수 |
| dashboard.InventoryDashboard | 재고 관리 대시보드 | 총재고수량, 재고금액, 과대재고, 품절품목 |
| dashboard.ProcurementDashboard | 구매 관리 대시보드 | 발주건수, 입고건수, 납기준수률 |
| dashboard.FinancialDashboard | 재무 관리 대시보드 | 매출액, 매출원가, 영업이익, 당기순이익 |
| dashboard.HRDashboard | 인사 관리 대시보드 | 총직원수, 신규입사, 퇴사자, 퇴사율 |

### 3.3 KPI 분석 레이어 모델

핵심 성과 지표 분석을 위한 **9개** 모델:

| 모델명 | 설명 | 주요 필드 |
|--------|------|-----------|
| kpi.SalesPerformance | 영업 실적 분석 | 기간, 거래처, 품목별 실적 |
| kpi.SalesTrend | 영업 추이 분석 | 월별/분기별 추이 |
| kpi.ProductionPerformance | 생산 실적 분석 | 공장, 라인별 생산실적 |
| kpi.EquipmentEfficiency | 설비 효율 분석 | OEE, 가동률, 비가동 시간 |
| kpi.QualityPerformance | 품질 실적 분석 | 합격률, 불량률, 재작업율 |
| kpi.DefectAnalysis | 불량 유형 분석 | 불량유형별 원인 분석 |
| kpi.InventoryStatus | 재고 현황 분석 | 창고별, 품목별 재고 |
| kpi.SupplierEvaluation | 공급업체 평가 | 납기준수율, 품질, 가격 |
| kpi.FinancialSummary | 재무제표 요약 | 손익계산서, 대차대조표 요약 |

### 3.4 추가 확장 모델

새로 추가된 **14개** 확장 모델:

| 모델명 | 설명 |
|--------|------|
| sales.CustomerComplaint | 고객 불만 처리 |
| sales.SalesPipeline | 영업 파이프라인 추적 |
| production.WorkOrderSchedule | 작업 지시 관리 |
| production.CycleTimeAnalysis | 사이클 타임 분석 |
| quality.CustomerClaim | 고객 클레임 관리 |
| purchase.PurchaseOrderTracking | 발주 추적 관리 |
| purchase.InventoryTurnover | 재고 회전율 분석 |
| financial.BudgetVsActual | 예산 대 실적 비교 |
| financial.DepartmentProfitability | 부문별 수익성 분석 |
| esg.EnvironmentalImpact | 환경 영향 분석 |
| productivity.HourlyProduction | 시간별 생산 현황 |
| productivity.LineUtilization | 라인 가동률 분석 |
| development.RDProject | R&D 프로젝트 관리 |
| traceability.LotTracking | LOT 추적 정보 |

---

## 4. ERP 테이블 매핑 구조

### 4.1 YH ERP 소스 테이블

**90개** YH ERP 소스 테이블이 정의되어 있습니다.

#### 4.1.1 모듈별 테이블 분류

| 모듈 | 코드 | 테이블 수 | 주요 테이블 |
|------|------|-----------|------------|
| 영업 | SD | 9 | SDY100_YH, SDA500_YH, SDA510_YH, SDB150_YH, SDP300_YH |
| 생산 | PP | 23 | PPB120_YH, PPB125_YH, PPB121_YH, PPC120~PPC150 |
| 품질 | QM | 11 | QMM140_YH, QMM200_YH, QMM210_YH, QPM110_YH |
| 구매 | MM | 8 | MMA100_YH, MMA200_YH, MMY100_YH, GAJ200_YH |
| 물류 | LE | 2 | LEB950_YH, LEB980_YH |
| 회계 | FI | 7 | CAM200_YH, CAM300_YH, CAM900_YH, COS700_YH |
| 인사 | HR | 1 | DCB100_YH |
| 공통 | CO | 22 | BAA100_YH, BAA110_YH, COS100~COS900_YH |
| MES | ME | 1 | MESTagValue_YH |
| 기타 | ET | 6 | DAA100_YH, PPA130_YH, PPA131_YH, PPC200_YH |

### 4.2 테이블 매핑 통계

전체 **162개** 테이블 매핑이 생성되었습니다.

| 타겟 모델 그룹 | 테이블 매핑 수 |
|----------------|----------------|
| etc 모델 | 34 |
| production 모델 | 22 |
| dashboard 모델 | 26 |
| kpi 모델 | 17 |
| quality 모델 | 14 |
| financial 모델 | 12 |
| purchase 모델 | 11 |
| sales 모델 | 11 |
| productivity 모델 | 4 |
| traceability 모델 | 3 |
| logistics 모델 | 2 |
| 그 외 | 6 |

### 4.3 필드 매핑 통계

전체 **1,618개** 필드 매핑이 생성되었습니다.

| 타겟 모델 그룹 | 필드 매핑 수 |
|----------------|--------------|
| etc 모델 | 650 |
| production 모델 | 315 |
| quality 모델 | 293 |
| sales 모델 | 109 |
| financial 모델 | 77 |
| purchase 모델 | 59 |
| logistics 모델 | 31 |
| common 모델 | 31 |
| kpi 모델 | 18 |
| productivity 모델 | 4 |
| dashboard 모델 | 12 |
| hr 모델 | 16 |
| development 모델 | 2 |
| traceability 모델 | 1 |
| esg 모델 | 0 |

---

## 5. API 명세

### 5.1 API 엔드포인트

기본 URL: `http://localhost:8000/api/erp-sync/`

#### 5.1.1 ERP 소스 관리
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /sources/ | GET | ERP 소스 목록 조회 |
| /sources/ | POST | ERP 소스 생성 |
| /sources/{id}/ | GET | ERP 소스 상세 조회 |
| /sources/{id}/ | PUT | ERP 소스 수정 |
| /sources/{id}/ | DELETE | ERP 소스 삭제 |
| /sources/{id}/test_connection/ | POST | DB 연결 테스트 |
| /sources/{id}/import_tables/ | POST | 테이블 정의 가져오기 |

#### 5.1.2 테이블 정의 관리
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /table-definitions/ | GET | 테이블 정의 목록 조회 |
| /table-definitions/{id}/ | GET | 테이블 정의 상세 조회 |
| /table-definitions/{id}/fields/ | GET | 테이블 필드 목록 조회 |

#### 5.1.3 타겟 모델 관리
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /target-models/ | GET | 타겟 모델 목록 조회 |
| /target-models/ | POST | 타겟 모델 생성 |
| /target-models/{id}/ | GET | 타겟 모델 상세 조회 |
| /target-models/{id}/fields/ | GET | 타겟 모델 필드 목록 조회 |

#### 5.1.4 매핑 관리
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /table-mappings/ | GET | 테이블 매핑 목록 조회 |
| /table-mappings/ | POST | 테이블 매핑 생성 |
| /table-mappings/{id}/ | GET | 테이블 매핑 상세 조회 |
| /table-mappings/{id}/ | PUT | 테이블 매핑 수정 |
| /table-mappings/{id}/ | DELETE | 테이블 매핑 삭제 |
| /field-mappings/ | GET | 필드 매핑 목록 조회 |
| /field-mappings/ | POST | 필드 매핑 생성 |
| /field-mappings/{id}/ | GET | 필드 매핑 상세 조회 |
| /field-mappings/{id}/ | PUT | 필드 매핑 수정 |
| /field-mappings/{id}/ | DELETE | 필드 매핑 삭제 |

#### 5.1.5 가져오기/내보내기
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /import-export/import_from_csv/ | POST | CSV 매핑 가져오기 |
| /import-export/export_to_csv/ | GET | CSV 매핑 내보내기 |

### 5.2 API 응답 예시

#### ERP 소스 목록 조회
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "source_code": "YH",
      "source_name": "유한 DB",
      "source_type": "postgresql",
      "host": "localhost",
      "port": 5432,
      "database": "sap_yuhan",
      "is_default": true,
      "is_active": true
    }
  ]
}
```

#### 테이블 매핑 목록 조회
```json
{
  "count": 162,
  "results": [
    {
      "id": 1,
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
      "mapping_code": "SDY100_YH_SALES_TO_SDY100",
      "sync_priority": 1,
      "sync_type": "full"
    }
  ]
}
```

---

## 6. Frontend 구조

### 6.1 컴포넌트 구조

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
│   ├── YHDatabaseConnection.tsx       # YH DB 뷰어
│   └── ...
├── services/
│   └── erpMappingService.ts           # ERP 매핑 API 서비스
├── App.tsx                            # 메인 앱 (라우팅)
└── main.tsx                           # 엔트리 포인트
```

### 6.2 UI 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 매핑 관리 | /mappings | 전체 매핑 현황 |
| ERP 소스 관리 | /erp-sources | ERP 소스 CRUD |
| 테이블 매핑 | /table-mappings | 테이블 매핑 관리 |
| 필드 매핑 | /field-mappings | 필드 매핑 관리 |
| 가져오기/내보내기 | /import-export | CSV 가져오기/내보내기 |
| YH DB 뷰어 | /yh-database | 유한 DB 데이터 조회 |

---

## 7. 데이터 동기화 프로세스

### 7.1 동기화 유형

| 유형 | 설명 | 사용 예시 |
|------|------|-----------|
| Full | 전체 데이터 동기화 | 초기 설정, 마스터 데이터 |
| Incremental | 변경 데이터만 동기화 | 일별 실적 데이터 |

### 7.2 동기화 우선순위

| 우선순위 | 설명 | 예시 |
|----------|------|------|
| 1 (필수) | 핵심 업무 데이터 | 생산실적, 출하, 회계전표 |
| 2 (중요) | 중요 운영 데이터 | 검사결과, 재고현황 |
| 3 (일반) | 일반 참조 데이터 | 협력사, 자재마스타 |
| 4 (확장) | 확장 분석 데이터 | MES 태그, 이력 데이터 |

### 7.3 동기화 절차

```
1. ERP 소스 연결
   ↓
2. 테이블 정의 가져오기
   ↓
3. 필드 정의 가져오기
   ↓
4. 타겟 모델 선택
   ↓
5. 테이블 매핑 생성
   ↓
6. 필드 매핑 생성
   ↓
7. 매핑 검증
   ↓
8. 데이터 동기화 실행
   ↓
9. 동기화 결과 확인
```

---

## 8. CSV 가져오기/내보내기 포맷

### 8.1 CSV 포맷 (테이블 정의)

```csv
테이블명,테이블 설명,모듈구분,컬렴명,컬렴설명,데이터타입,PK여부,NULL허용
SDY100_YH,영업연월별계획,SD,plan_mon,계획월,VARCHAR(6),N,N
SDY100_YH,영업연월별계획,SD,cust_cd,거래처코드,VARCHAR(10),Y,N
...
```

### 8.2 CSV 포맷 (매핑 정의)

```csv
소스테이블,소스필드,타겟모델,타겟필드,변환규칙,필수여부
SDY100_YH,plan_mon,sales.Sdy100,period_value,none,Y
SDY100_YH,cust_cd,sales.Sdy100,customer_code,none,N
...
```

---

## 9. 배포 가이드

### 9.1 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis (선택, 캐시용)

### 9.2 Backend 배포

```bash
# 1. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows

# 2. 의존성 설치
cd claros-mis-backend
pip install -r requirements.txt

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (DB 설정 등)

# 4. 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 5. 초기 데이터 로드
python manage.py loaddata initial_data

# 6. 슈퍼유저 생성
python manage.py createsuperuser

# 7. 서버 시작
python manage.py runserver 0.0.0.0:8000
```

### 9.3 Frontend 배포

```bash
# 1. 의존성 설치
cd claros-mis-frontend
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (API URL 등)

# 3. 개발 서버 시작
npm run dev

# 4. 프로덕션 빌드
npm run build

# 5. 빌드 결과 배포 (nginx 등)
# 빌드 결과물: dist/ 디렉토리
```

### 9.4 Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/claros-mis-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 10. 문제 해결

### 10.1 일반적인 문제

| 문제 | 원인 | 해결방법 |
|------|------|----------|
| DB 연결 실패 | 잘못된 연결 정보 | ERP 소스 설정 확인 |
| 테이블 못 찾음 | 테이블명 오타 | CSV 파일의 테이블명 확인 |
| 필드 매핑 실패 | 필드명 오타 | 소스/타겟 필드명 확인 |
| 동기화 지연 | 데이터量大 | 우선순위 조정, 배치 처리 |

### 10.2 로그 확인

```bash
# Backend 로그
tail -f claros-mis-backend/logs/django.log

# PostgreSQL 로그
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 11. 향후 개선 사항

- [ ] 다중 ERP 동시 연동 지원
- [ ] 실시간 데이터 동기화 (Change Data Capture)
- [ ] 매핑 버전 관리
- [ ] 데이터 품질 모니터링 대시보드
- [ ] AI 기반 필드 매핑 추천
- [ ] GraphQL API 지원
- [ ] WebSocket 기반 실시간 알림

---

## 12. 참고 자료

- Django 문서: https://docs.djangoproject.com/
- DRF 문서: https://www.django-rest-framework.org/
- React 문서: https://react.dev/
- PostgreSQL 문서: https://www.postgresql.org/docs/

---

**문서 버전**: v2.0
**최종 수정일**: 2026-03-03
**유지보수 담당**: Claude AI
