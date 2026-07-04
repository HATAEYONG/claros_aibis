# ERP 매핑 관리 시스템 설계문서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | ERP 매핑 관리 시스템 설계문서 |
| 버전 | 1.0.0 |
| 작성일 | 2026-03-03 |
| 작성자 | Claude AI |

---

## 1. 시스템 개요

### 1.1 배경

기존 ERP 연계 시스템은 하드코딩된 매핑 딕셔너리를 사용하여 새로운 ERP 시스템 연계 시 코드 수정이 필요했습니다. 이를 해결하기 위해 데이터베이스 기반의 동적 매핑 관리 시스템을 도입합니다.

### 1.2 목표

1. **다중 ERP 지원**: YH, FOM, SAP 등 다양한 ERP 시스템 연계
2. **UI 기반 관리**: 코드 수정 없이 UI에서 매핑 관리
3. **테이블 정의서 기반 매핑**: CSV/Excel 형식의 테이블 정의서 가져오기
4. **실시간 검증**: 매핑 구성 시 실시간 유효성 검사

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ERP Source Management  │  Table Mapping  │  Field Mapping ││
│  │  Import/Export          │  Validation     │  Sync Monitor  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ERP Source API  │  Mapping API  │  Validation API  │ Sync ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │  ERPSource  │  │ ERPTable     │  │ ERPTableMapping         ││
│  │             │──│ Definition   │──│ ERPFieldMapping         ││
│  │             │  │ ERPField     │  │ ERPTargetModel          ││
│  │             │  │ Definition   │  │ ERPTargetField          ││
│  └─────────────┘  └──────────────┘  └─────────────────────────┘│
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
CSV Import → Table Definition → Field Definition → Table Mapping → Field Mapping → Sync Execution
```

---

## 3. 데이터베이스 스키마

### 3.1 ERD

```
┌──────────────────┐
│   ERPSource      │
├──────────────────┤
│ erp_source_id PK │
│ source_code      │──┐
│ source_name      │  │
│ source_type      │  │     1
│ host             │  │     │
│ port             │  │     │
│ is_default       │  │     │
└──────────────────┘  │     │
                       │     │
                       │     ├──────────────────┐
                       │     │                  │
                       │     ▼                  │
                       │  ┌──────────────────┐  │
                       │  │ ERPTableDefinition│  │
                       │  ├──────────────────┤  │
                       │  │ table_id PK       │  │
                       │  │ erp_source_id FK │──┘
                       │  │ source_table_name │
                       │  │ module_code       │
                       │  └──────────────────┘
                       │           │
                       │           │ 1
                       │           │
                       │           ├──────────────────────┐
                       │           │                      │
                       │           ▼                      │
                       │  ┌──────────────────┐           │
                       │  │ ERPFieldDefinition│           │
                       │  ├──────────────────┤           │
                       │  │ field_id PK       │           │
                       │  │ table_id FK       │           │
                       │  │ source_field_name │           │
                       │  │ source_field_type │           │
                       │  └──────────────────┘           │
                       │                                  │
                       │     ┌──────────────────┐         │
                       └─────│ ERPTableMapping  │         │
                             ├──────────────────┤         │
                             │ mapping_id PK     │         │
                             │ source_table FK   │─────────┘
                             │ target_model FK   │
                             │ sync_priority     │
                             │ is_active         │
                             └──────────────────┘
                                        │ 1
                                        │
                                        ├──────────────────────┐
                                        │                      │
                                        ▼                      │
                             ┌──────────────────┐             │
                             │ ERPFieldMapping  │             │
                             ├──────────────────┤             │
                             │ field_mapping_id │             │
                             │ table_mapping FK │─────────────┘
                             │ source_field FK  │
                             │ target_field FK  │
                             │ transform_rule   │
                             └──────────────────┘
                                        │
                                        │ 1
                                        │
                                        ▼
                             ┌──────────────────┐
                             │ ERPTargetModel   │
                             ├──────────────────┤
                             │ target_model_id  │
                             │ model_name       │
                             │ app_label        │
                             └──────────────────┘
                                        │
                                        │ 1
                                        │
                                        ▼
                             ┌──────────────────┐
                             │ ERPTargetField   │
                             ├──────────────────┤
                             │ target_field_id  │
                             │ target_model FK  │
                             │ field_name       │
                             │ field_type       │
                             └──────────────────┘
```

### 3.2 모델 상세

#### ERPSource
ERP 시스템 소스 정의

| 필드명 | 타입 | 설명 |
|--------|------|------|
| erp_source_id | AutoField | 기본키 |
| source_code | CharField(20) | 소스 코드 (YH, FOM, SAP 등) |
| source_name | CharField(100) | 소스명 |
| source_type | CharField(20) | 소스 타입 (postgresql, mssql, mysql, oracle) |
| host | CharField(255) | 호스트 주소 |
| port | IntegerField | 포트 |
| database_name | CharField(100) | 데이터베이스명 |
| is_default | BooleanField | 기본 소스 여부 |
| is_active | BooleanField | 활성화 여부 |

#### ERPTableDefinition
소스 테이블 메타데이터

| 필드명 | 타입 | 설명 |
|--------|------|------|
| table_id | AutoField | 기본키 |
| erp_source | ForeignKey | ERP 소스 |
| source_table_name | CharField(100) | 소스 테이블명 |
| source_table_comment | CharField(255) | 테이블 설명 |
| module_code | CharField(50) | 모듈 코드 |
| module_name | CharField(100) | 모듈명 |

#### ERPFieldDefinition
소스 필드 메타데이터

| 필드명 | 타입 | 설명 |
|--------|------|------|
| field_id | AutoField | 기본키 |
| table_definition | ForeignKey | 테이블 정의 |
| source_field_name | CharField(100) | 소스 필드명 |
| source_field_type | CharField(50) | 소스 필드 타입 |
| source_field_comment | CharField(255) | 필드 설명 |
| is_primary_key | BooleanField | 기본키 여부 |
| is_nullable | BooleanField | NULL 허용 여부 |

#### ERPTargetModel
MIS 타겟 모델 정의

| 필드명 | 타입 | 설명 |
|--------|------|------|
| target_model_id | AutoField | 기본키 |
| model_name | CharField(100) | Django 모델명 |
| model_label | CharField(100) | 모델 라벨 |
| app_label | CharField(50) | 앱 라벨 |
| model_type | CharField(20) | 모델 타입 (fact, dimension) |

#### ERPTargetField
MIS 타겟 필드 정의

| 필드명 | 타입 | 설명 |
|--------|------|------|
| target_field_id | AutoField | 기본키 |
| target_model | ForeignKey | 타겟 모델 |
| field_name | CharField(100) | 필드명 |
| field_type | CharField(50) | 필드 타입 |
| field_label | CharField(100) | 필드 라벨 |
| is_required | BooleanField | 필수 여부 |

#### ERPTableMapping
테이블 매핑 (소스 → 타겟)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| mapping_id | AutoField | 기본키 |
| mapping_code | CharField(50) | 매핑 코드 |
| source_table | ForeignKey | 소스 테이블 정의 |
| target_model | ForeignKey | 타겟 모델 |
| sync_priority | IntegerField | 동기화 우선순위 (1-4) |
| sync_type | CharField(20) | 동기화 타입 (full, incremental) |
| is_active | BooleanField | 활성화 여부 |
| date_column | CharField(100) | 증분 동기화 날짜 컬럼 |

#### ERPFieldMapping
필드 매핑 (소스 → 타겟)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| field_mapping_id | AutoField | 기본키 |
| table_mapping | ForeignKey | 테이블 매핑 |
| source_field | ForeignKey | 소스 필드 정의 |
| target_field | ForeignKey | 타겟 필드 |
| is_key_field | BooleanField | 키 필드 여부 |
| transform_rule | CharField(20) | 변환 규칙 |
| transform_expression | TextField | 변환 표현식 |
| default_value | CharField(255) | 기본값 |

---

## 4. API 설계

### 4.1 ERP 소스 관리

#### GET /api/erp/sources/
ERP 소스 목록 조회

```json
{
  "count": 2,
  "results": [
    {
      "erp_source_id": 1,
      "source_code": "YH",
      "source_name": "유한 DB",
      "source_type": "postgresql",
      "host": "133.186.214.219",
      "port": 27455,
      "database_name": "sap",
      "is_default": true,
      "is_active": true,
      "table_count": 1184
    }
  ]
}
```

#### POST /api/erp/sources/
ERP 소스 생성

```json
{
  "source_code": "SAP",
  "source_name": "SAP ERP",
  "source_type": "oracle",
  "host": "sap.example.com",
  "port": 1521,
  "database_name": "SAP_PROD",
  "is_default": false,
  "is_active": true
}
```

#### POST /api/erp/sources/{id}/test_connection/
연결 테스트

```json
{
  "status": "success",
  "message": "연결 성공",
  "latency_ms": 45,
  "database_version": "PostgreSQL 15.2"
}
```

#### POST /api/erp/sources/{id}/import_tables/
테이블 정의 가져오기

```json
{
  "status": "success",
  "imported_count": 1184,
  "skipped_count": 0,
  "error_count": 0
}
```

### 4.2 테이블 매핑 관리

#### GET /api/erp/table-mappings/
테이블 매핑 목록 조회

```json
{
  "count": 15,
  "results": [
    {
      "mapping_id": 1,
      "mapping_code": "SDY100_YH_TO_MONTHLY_SALES",
      "source_table": {
        "table_id": 1,
        "source_table_name": "SDY100_YH",
        "erp_source": {
          "source_code": "YH",
          "source_name": "유한 DB"
        }
      },
      "target_model": {
        "model_name": "MonthlySales",
        "app_label": "sales"
      },
      "sync_priority": 2,
      "sync_type": "incremental",
      "is_active": true,
      "field_mappings_count": 12
    }
  ]
}
```

#### POST /api/erp/table-mappings/
테이블 매핑 생성

```json
{
  "mapping_code": "SDY100_YH_TO_MONTHLY_SALES",
  "source_table": 1,
  "target_model": 5,
  "sync_priority": 2,
  "sync_type": "incremental",
  "date_column": "plan_date",
  "is_active": true
}
```

### 4.3 필드 매핑 관리

#### GET /api/erp/field-mappings/?table_mapping=1
필드 매핑 목록 조회

```json
{
  "count": 12,
  "results": [
    {
      "field_mapping_id": 1,
      "source_field": {
        "source_field_name": "cust_cd",
        "source_field_type": "varchar(20)"
      },
      "target_field": {
        "field_name": "customer_code",
        "field_type": "CharField"
      },
      "is_key_field": true,
      "transform_rule": "none"
    }
  ]
}
```

#### POST /api/erp/field-mappings/bulk_create/
필드 매핑 일괄 생성

```json
{
  "table_mapping": 1,
  "mappings": [
    {
      "source_field": 1,
      "target_field": 1,
      "is_key_field": true,
      "transform_rule": "none"
    }
  ]
}
```

### 4.4 가져오기/내보내기

#### POST /api/erp/import-export/import_from_csv/
CSV 매핑 가져오기

```json
{
  "status": "success",
  "imported_tables": 50,
  "imported_fields": 450,
  "errors": []
}
```

#### GET /api/erp/import-export/export_to_csv/?source_code=YH
CSV 매핑 내보내기

CSV 파일 다운로드

---

## 5. UI 컴포넌트

### 5.1 페이지 구조

```
ERP 메뉴
├── ERP 소스 관리 (ERPSourceManagement)
│   ├── 소스 목록
│   ├── 소스 추가/편집
│   ├── 연결 테스트
│   └── 테이블 가져오기
│
├── 테이블 매핑 (TableMappingEditor)
│   ├── 매핑 목록
│   ├── 매핑 추가/편집
│   ├── 필드 매핑 연결
│   └── 매핑 검증
│
├── 필드 매핑 (FieldMappingEditor)
│   ├── 드래그앤드롭 매핑
│   ├── 변환 규칙 설정
│   └── 일괄 작업
│
├── 가져오기/내보내기 (ImportExportMappings)
│   ├── CSV 업로드
│   ├── 미리보기
│   ├── 내보내기
│   └── 템플릿 다운로드
│
└── 동기화 모니터링 (SyncMonitoring)
    ├── 동기화 현황
    ├── 로그 조회
    └── 수동 동기화
```

### 5.2 컴포넌트 명세

#### ERPSourceManagement.tsx

```typescript
interface ERPSourceManagementProps {
  // Props 정의
}

interface ERPSource {
  erp_source_id: number;
  source_code: string;
  source_name: string;
  source_type: 'postgresql' | 'mssql' | 'mysql' | 'oracle';
  host?: string;
  port?: number;
  database_name?: string;
  is_default: boolean;
  is_active: boolean;
  table_count?: number;
}

// 주요 기능
// - ERP 소스 CRUD
// - 연결 테스트
// - 테이블 정의 가져오기
// - 기본 소스 설정
```

#### TableMappingEditor.tsx

```typescript
interface TableMapping {
  mapping_id: number;
  mapping_code: string;
  source_table: {
    table_id: number;
    source_table_name: string;
    erp_source: ERPSource;
  };
  target_model: {
    target_model_id: number;
    model_name: string;
    app_label: string;
  };
  sync_priority: 1 | 2 | 3 | 4;
  sync_type: 'full' | 'incremental' | 'cdc';
  is_active: boolean;
  date_column?: string;
}

// 주요 기능
// - 테이블 매핑 CRUD
// - 소스 테이블 선택 (ERP 소스 필터링)
// - 타겟 모델 선택 (모듈별 그룹화)
// - 동기화 설정
// - 필드 매핑 페이지 이동
```

#### FieldMappingEditor.tsx

```typescript
interface FieldMapping {
  field_mapping_id: number;
  source_field: {
    field_id: number;
    source_field_name: string;
    source_field_type: string;
    is_primary_key: boolean;
  };
  target_field: {
    field_id: number;
    field_name: string;
    field_type: string;
    is_required: boolean;
  };
  is_key_field: boolean;
  transform_rule: 'none' | 'upper' | 'lower' | 'trim' | 'date_format' | 'decimal_cast';
  default_value?: string;
}

// 주요 기능
// - 드래그앤드롭 필드 매핑
// - 자동 타입 호환성 체크
// - 변환 규칙 설정
// - 일괄 매핑 (이름 일치 기반)
```

#### ImportExportMappings.tsx

```typescript
interface ImportResult {
  status: 'success' | 'partial' | 'error';
  imported_tables: number;
  imported_fields: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// 주요 기능
// - CSV 파일 업로드
// - 파싱 및 검증
// - 미리보기
// - 가져오기 실행
// - 내보내기 (CSV/JSON)
// - 템플릿 다운로드
```

---

## 6. CSV 형식

### 6.1 테이블 정의서 형식

```csv
테이블명,테이블 설명,모듈구분,시스템 테이블,컬럼명,컬럼설명,데이터 타입,NOT NULL,PK 여부,FK 여부,참조 테이블,참조 컬럼
SDY100_YH,월별 판매 계획,영업,Y,cust_cd,고객코드,varchar(20),Y,Y,N,,
SDY100_YH,월별 판매 계획,영업,Y,plan_date,계획일,date,Y,N,N,,
SDY100_YH,월별 판매 계획,영업,Y,plan_qty,계획수량,decimal(10,2),Y,N,N,,
```

### 6.2 매핑 설정 형식

```csv
매핑코드,소스테이블,소스필드,타겟모델,타겟필드,변환규칙,키필드,필수여부,기본값
SDY100_YH_TO_MONTHLY_SALES,SDY100_YH,cust_cd,MonthlySales,customer_code,none,Y,Y,
SDY100_YH_TO_MONTHLY_SALES,SDY100_YH,plan_date,MonthlySales,plan_date,date_format,N,Y,
```

---

## 7. 검증 규칙

### 7.1 연결 검증

- [ ] 호스트 연결 가능
- [ ] 포트 접속 가능
- [ ] 데이터베이스 인증 성공
- [ ] 테이블 조회 권한 확인

### 7.2 매핑 검증

- [ ] 소스 테이블 존재
- [ ] 타겟 모델 존재
- [ ] 필수 키 필드 매핑 완료
- [ ] 타입 호환성 확인
- [ ] 증분 동기화 시 날짜 컬럼 존재

### 7.3 데이터 검증

- [ ] NULL 허용 필드에 매핑
- [ ] 외래키 참조 무결성
- [ ] 데이터 길이 제한 확인

---

## 8. 변경 이력

### 버전 1.0.0 (2026-03-03)

- 초기 설계
- ERP 소스, 테이블/필드 정의 모델
- 테이블/필드 매핑 모델
- API 엔드포인트 설계
- UI 컴포넌트 명세
