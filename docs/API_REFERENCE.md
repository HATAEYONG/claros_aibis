# API 레퍼런스 문서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | ERP 매핑 관리 시스템 API 레퍼런스 |
| 버전 | 1.0.0 |
| 작성일 | 2026-03-03 |
| 작성자 | Claude AI |
| Base URL | `/api/erp` |

---

## 1. 개요

### 1.1 인증

모든 API 요청은 인증이 필요합니다.

```
Authorization: Bearer {token}
```

### 1.2 응답 포맷

#### 성공 응답

```json
{
  "success": true,
  "data": { ... }
}
```

#### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": { ... }
  }
}
```

---

## 2. ERP 소스 관리

### 2.1 ERP 소스 목록 조회

```http
GET /api/erp/sources/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | integer | N | 페이지 번호 (default: 1) |
| page_size | integer | N | 페이지 크기 (default: 20) |
| is_active | boolean | N | 활성화 여부 필터 |
| source_type | string | N | 소스 타입 필터 |

**Response:**

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "erp_source_id": 1,
      "source_code": "YH",
      "source_name": "유한 DB",
      "source_type": "postgresql",
      "description": "유한킴벌리 ERP 시스템",
      "host": "133.186.214.219",
      "port": 27455,
      "database_name": "emax",
      "schema_name": "public",
      "is_default": true,
      "is_active": true,
      "table_count": 1184,
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-03T10:00:00Z"
    }
  ]
}
```

---

### 2.2 ERP 소스 상세 조회

```http
GET /api/erp/sources/{id}/
```

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| id | integer | ERP 소스 ID |

**Response:**

```json
{
  "erp_source_id": 1,
  "source_code": "YH",
  "source_name": "유한 DB",
  "source_type": "postgresql",
  "description": "유한킴벌리 ERP 시스템",
  "host": "133.186.214.219",
  "port": 27455,
  "database_name": "emax",
  "schema_name": "public",
  "is_default": true,
  "is_active": true,
  "table_count": 1184,
  "tables": [
    {
      "table_id": 1,
      "source_table_name": "SDY100_YH",
      "module_code": "SALES"
    }
  ],
  "created_at": "2026-03-01T00:00:00Z",
  "updated_at": "2026-03-03T10:00:00Z"
}
```

---

### 2.3 ERP 소스 생성

```http
POST /api/erp/sources/
```

**Request Body:**

```json
{
  "source_code": "SAP",
  "source_name": "SAP ERP",
  "source_type": "oracle",
  "description": "SAP ERP 시스템",
  "host": "sap.example.com",
  "port": 1521,
  "database_name": "SAP_PROD",
  "schema_name": "SAPSR3",
  "is_default": false,
  "is_active": true
}
```

**Validation Rules:**

- `source_code`: 필수, 20자 이내, 영문대문자/숫자만, 중복 불가
- `source_name`: 필수, 100자 이내
- `source_type`: 필수, [postgresql, mssql, mysql, oracle, api, sqlite] 중 하나
- `host`: api 타입이 아닌 경우 필수
- `port`: 1-65535 사이 정수
- `is_default`: true인 경우 기존 default 소스의 is_default가 false로 변경됨

**Response:** 201 Created

```json
{
  "erp_source_id": 2,
  "source_code": "SAP",
  "source_name": "SAP ERP",
  "source_type": "oracle",
  ...
}
```

---

### 2.4 ERP 소스 수정

```http
PUT /api/erp/sources/{id}/
PATCH /api/erp/sources/{id}/
```

**Request Body:** (생성과 동일)

**Response:** 200 OK

---

### 2.5 ERP 소스 삭제

```http
DELETE /api/erp/sources/{id}/
```

**Response:** 204 No Content

**주의:** 연결된 테이블 정의나 매핑이 있는 경우 삭제 불가

---

### 2.6 연결 테스트

```http
POST /api/erp/sources/{id}/test_connection/
```

**Response:**

```json
{
  "status": "success",
  "message": "연결 성공",
  "latency_ms": 45,
  "database_info": {
    "version": "PostgreSQL 15.2",
    "timezone": "Asia/Seoul",
    "encoding": "UTF8"
  },
  "tables_accessible": true
}
```

**Error Response:**

```json
{
  "status": "error",
  "message": "연결 실패",
  "error_code": "CONNECTION_FAILED",
  "error_details": {
    "host": "sap.example.com",
    "port": 1521,
    "reason": "Connection refused"
  }
}
```

---

### 2.7 테이블 정의 가져오기

```http
POST /api/erp/sources/{id}/import_tables/
```

**Request Body:**

```json
{
  "module_filter": ["SALES", "PRODUCTION"],
  "table_name_pattern": "%_YH",
  "import_fields": true
}
```

**Response:**

```json
{
  "status": "success",
  "imported_tables": 156,
  "imported_fields": 1845,
  "skipped_tables": 0,
  "errors": [],
  "duration_ms": 2340
}
```

---

## 3. 테이블 정의 관리

### 3.1 테이블 정의 목록 조회

```http
GET /api/erp/table-definitions/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| erp_source | integer | N | ERP 소스 ID 필터 |
| module_code | string | N | 모듈 코드 필터 |
| search | string | N | 테이블명 검색 |
| page | integer | N | 페이지 번호 |
| page_size | integer | N | 페이지 크기 |

**Response:**

```json
{
  "count": 1184,
  "results": [
    {
      "table_id": 1,
      "erp_source": {
        "erp_source_id": 1,
        "source_code": "YH",
        "source_name": "유한 DB"
      },
      "source_table_name": "SDY100_YH",
      "source_table_comment": "월별 판매 계획",
      "module_code": "SALES",
      "module_name": "영업",
      "record_count": 15420,
      "field_count": 12,
      "last_synced_at": "2026-03-03T05:00:00Z"
    }
  ]
}
```

---

### 3.2 테이블 정의 상세 조회

```http
GET /api/erp/table-definitions/{id}/
```

**Response:**

```json
{
  "table_id": 1,
  "erp_source": { ... },
  "source_table_name": "SDY100_YH",
  "source_table_comment": "월별 판매 계획",
  "module_code": "SALES",
  "module_name": "영업",
  "record_count": 15420,
  "fields": [
    {
      "field_id": 1,
      "source_field_name": "cust_cd",
      "source_field_type": "varchar(20)",
      "source_field_comment": "고객코드",
      "is_primary_key": true,
      "is_nullable": false,
      "is_foreign_key": false,
      "field_position": 1
    },
    {
      "field_id": 2,
      "source_field_name": "plan_date",
      "source_field_type": "date",
      "source_field_comment": "계획일",
      "is_primary_key": false,
      "is_nullable": false,
      "is_foreign_key": false,
      "field_position": 2
    }
  ],
  "mappings": [
    {
      "mapping_id": 1,
      "mapping_code": "SDY100_YH_TO_MONTHLY_SALES",
      "target_model": "MonthlySales"
    }
  ]
}
```

---

### 3.3 필드 정의 가져오기

```http
POST /api/erp/table-definitions/{id}/import_fields/
```

**Response:**

```json
{
  "status": "success",
  "imported_fields": 12,
  "errors": []
}
```

---

## 4. 타겟 모델 관리

### 4.1 타겟 모델 목록 조회

```http
GET /api/erp/target-models/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| app_label | string | N | 앱 라벨 필터 |
| model_type | string | N | 모델 타입 필터 (fact, dimension, snapshot, aggregate) |

**Response:**

```json
{
  "count": 45,
  "results": [
    {
      "target_model_id": 1,
      "model_name": "MonthlySales",
      "model_label": "월별 판매",
      "app_label": "sales",
      "model_type": "fact",
      "db_table_name": "sales_monthlysales",
      "description": "월별 판매 실적 데이터",
      "field_count": 12
    }
  ]
}
```

---

### 4.2 타겟 모델 상세 조회

```http
GET /api/erp/target-models/{id}/
```

**Response:**

```json
{
  "target_model_id": 1,
  "model_name": "MonthlySales",
  "model_label": "월별 판매",
  "app_label": "sales",
  "model_type": "fact",
  "db_table_name": "sales_monthlysales",
  "description": "월별 판매 실적 데이터",
  "fields": [
    {
      "target_field_id": 1,
      "field_name": "customer_code",
      "field_type": "CharField",
      "field_label": "고객코드",
      "is_required": true,
      "is_unique": false,
      "max_length": 20
    }
  ]
}
```

---

## 5. 테이블 매핑 관리

### 5.1 테이블 매핑 목록 조회

```http
GET /api/erp/table-mappings/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| source_table | integer | N | 소스 테이블 ID 필터 |
| target_model | integer | N | 타겟 모델 ID 필터 |
| is_active | boolean | N | 활성화 여부 필터 |
| sync_priority | integer | N | 동기화 우선순위 필터 |

**Response:**

```json
{
  "count": 15,
  "results": [
    {
      "mapping_id": 1,
      "mapping_code": "SDY100_YH_TO_MONTHLY_SALES",
      "mapping_name": "SDY100_YH → MonthlySales",
      "source_table": {
        "table_id": 1,
        "source_table_name": "SDY100_YH",
        "erp_source": {
          "source_code": "YH"
        }
      },
      "target_model": {
        "model_name": "MonthlySales",
        "app_label": "sales"
      },
      "sync_priority": 2,
      "sync_type": "incremental",
      "is_active": true,
      "date_column": "plan_date",
      "last_sync_at": "2026-03-03T05:00:00Z",
      "last_sync_status": "success",
      "total_sync_count": 1542,
      "field_mappings_count": 12
    }
  ]
}
```

---

### 5.2 테이블 매핑 생성

```http
POST /api/erp/table-mappings/
```

**Request Body:**

```json
{
  "mapping_code": "SDY100_YH_TO_MONTHLY_SALES",
  "source_table_id": 1,
  "target_model_id": 5,
  "mapping_name": "SDY100_YH → MonthlySales",
  "description": "월별 판매 계획 테이블 매핑",
  "sync_priority": 2,
  "sync_type": "incremental",
  "date_column": "plan_date",
  "is_active": true
}
```

**Validation Rules:**

- `mapping_code`: 필수, 50자 이내, 중복 불가
- `source_table_id`: 필수, 존재하는 테이블 정의 ID
- `target_model_id`: 필수, 존재하는 타겟 모델 ID
- `sync_priority`: 1-4 사이 정수 (1:필수, 2:중요, 3:일반, 4:확장)
- `sync_type`: [full, incremental, cdc] 중 하나
- `date_column`: sync_type이 incremental인 경우 필수

**Response:** 201 Created

---

### 5.3 테이블 매핑 수정

```http
PUT /api/erp/table-mappings/{id}/
PATCH /api/erp/table-mappings/{id}/
```

---

### 5.4 테이블 매핑 삭제

```http
DELETE /api/erp/table-mappings/{id}/
```

**주의:** 연결된 필드 매핑이 함께 삭제됨

---

### 5.5 매핑 검증

```http
POST /api/erp/table-mappings/{id}/validate/
```

**Response:**

```json
{
  "validation_id": 123,
  "status": "passed",
  "results": {
    "structure": {
      "status": "passed",
      "checks": [
        {
          "check": "source_table_exists",
          "status": "passed"
        },
        {
          "check": "target_model_exists",
          "status": "passed"
        },
        {
          "check": "key_fields_mapped",
          "status": "passed"
        },
        {
          "check": "date_column_exists",
          "status": "passed"
        }
      ]
    },
    "fields": {
      "status": "warning",
      "warnings": [
        {
          "source_field": "description",
          "target_field": "remarks",
          "warning": "Type mismatch: text vs varchar(255)"
        }
      ]
    }
  }
}
```

---

### 5.6 동기화 실행

```http
POST /api/erp/table-mappings/{id}/sync/
```

**Request Body:**

```json
{
  "sync_type": "incremental",
  "batch_size": 1000,
  "force_full_sync": false
}
```

**Response:**

```json
{
  "sync_log_id": 456,
  "status": "started",
  "message": "동기화가 시작되었습니다",
  "estimated_records": 5000
}
```

---

## 6. 필드 매핑 관리

### 6.1 필드 매핑 목록 조회

```http
GET /api/erp/field-mappings/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| table_mapping | integer | N | 테이블 매핑 ID 필터 (필수) |
| is_key_field | boolean | N | 키 필드 여부 필터 |

**Response:**

```json
{
  "count": 12,
  "results": [
    {
      "field_mapping_id": 1,
      "table_mapping": {
        "mapping_id": 1,
        "mapping_code": "SDY100_YH_TO_MONTHLY_SALES"
      },
      "source_field": {
        "field_id": 1,
        "source_field_name": "cust_cd",
        "source_field_type": "varchar(20)",
        "is_primary_key": true
      },
      "target_field": {
        "field_id": 15,
        "field_name": "customer_code",
        "field_type": "CharField",
        "is_required": true
      },
      "is_key_field": true,
      "is_required": true,
      "transform_rule": "none",
      "transform_expression": null,
      "default_value": null,
      "field_order": 1
    }
  ]
}
```

---

### 6.2 필드 매핑 생성

```http
POST /api/erp/field-mappings/
```

**Request Body:**

```json
{
  "table_mapping_id": 1,
  "source_field_id": 1,
  "target_field_id": 15,
  "is_key_field": true,
  "is_required": true,
  "transform_rule": "none",
  "default_value": null
}
```

**Transform Rules:**

| 규칙 | 설명 |
|------|------|
| none | 변환 없음 |
| upper | 대문자 변환 |
| lower | 소문자 변환 |
| trim | 앞뒤 공백 제거 |
| date_format | 날짜 형식 변환 |
| decimal_cast | 소수형 변환 |
| concat | 문자열 결합 |
| lookup | 룩업 테이블 참조 |
| custom | 사용자 정의 함수 |

---

### 6.3 필드 매핑 일괄 생성

```http
POST /api/erp/field-mappings/bulk_create/
```

**Request Body:**

```json
{
  "table_mapping_id": 1,
  "auto_match": true,
  "mappings": [
    {
      "source_field_id": 1,
      "target_field_id": 15,
      "is_key_field": true,
      "transform_rule": "none"
    }
  ]
}
```

**auto_match가 true인 경우:** 소스/타겟 필드명이 유사한 필드 자동 매칭

**Response:**

```json
{
  "created_count": 10,
  "skipped_count": 2,
  "errors": []
}
```

---

### 6.4 필드 매핑 일괄 삭제

```http
POST /api/erp/field-mappings/bulk_delete/
```

**Request Body:**

```json
{
  "field_mapping_ids": [1, 2, 3, 4, 5]
}
```

---

## 7. 가져오기/내보내기

### 7.1 CSV 매핑 가져오기

```http
POST /api/erp/import-export/import_from_csv/
```

**Request:** multipart/form-data

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | Y | CSV 파일 |
| erp_source_id | integer | Y | ERP 소스 ID |
| import_type | string | N | [tables, mappings, both] (default: both) |
| overwrite | boolean | N | 기존 데이터 덮어쓰기 (default: false) |

**CSV 형식:**

```csv
테이블명,테이블 설명,모듈구분,컬럼명,컬럼설명,데이터 타입,NOT NULL,PK 여부,FK 여부
SDY100_YH,월별 판매 계획,영업,cust_cd,고객코드,varchar(20),Y,Y,N
SDY100_YH,월별 판매 계획,영업,plan_date,계획일,date,Y,N,N
```

**Response:**

```json
{
  "status": "success",
  "import_summary": {
    "tables_imported": 50,
    "tables_updated": 5,
    "tables_skipped": 0,
    "fields_imported": 450,
    "fields_updated": 20,
    "errors": []
  }
}
```

---

### 7.2 CSV 매핑 내보내기

```http
GET /api/erp/import-export/export_to_csv/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| erp_source_id | integer | Y | ERP 소스 ID |
| include_mappings | boolean | N | 매핑 정보 포함 (default: false) |
| format | string | N | [tables, fields, mappings] (default: tables) |

**Response:** CSV 파일 다운로드

---

### 7.3 JSON 매핑 내보내기

```http
GET /api/erp/import-export/export_to_json/
```

**Query Parameters:** CSV 내보내기와 동일

**Response:** JSON 파일 다운로드

```json
{
  "erp_source": {
    "source_code": "YH",
    "source_name": "유한 DB"
  },
  "tables": [
    {
      "source_table_name": "SDY100_YH",
      "module_code": "SALES",
      "fields": [...]
    }
  ],
  "mappings": [...]
}
```

---

### 7.4 JSON 매핑 가져오기

```http
POST /api/erp/import-export/import_from_json/
```

**Request:** JSON 파일 (내보내기 형식과 동일)

---

## 8. 동기화 관리

### 8.1 전체 동기화

```http
POST /api/erp/sync-all/
```

**Request Body:**

```json
{
  "sync_priority": "high",
  "force_full_sync": false
}
```

**Response:**

```json
{
  "status": "started",
  "tables_to_sync": 15,
  "estimated_records": 50000,
  "batch_job_id": "sync-20260303-001"
}
```

---

### 8.2 동기화 로그 조회

```http
GET /api/erp/sync-logs/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| table_name | string | N | 테이블명 필터 |
| status | string | N | 상태 필터 (success, error, running) |
| start_date | string | N | 시작일 필터 |
| end_date | string | N | 종료일 필터 |

**Response:**

```json
{
  "count": 1542,
  "results": [
    {
      "log_id": 456,
      "table_name": "SDY100_YH",
      "start_time": "2026-03-03T05:00:00Z",
      "end_time": "2026-03-03T05:01:30Z",
      "status": "success",
      "records_processed": 5000,
      "records_succeeded": 5000,
      "records_failed": 0,
      "duration_ms": 90000,
      "error_message": null
    }
  ]
}
```

---

## 9. 에러 코드

| 코드 | 설명 |
|------|------|
| INVALID_REQUEST | 요청 파라미터 오류 |
| UNAUTHORIZED | 인증 실패 |
| FORBIDDEN | 권한 없음 |
| NOT_FOUND | 리소스 없음 |
| DUPLICATE_CODE | 코드 중복 |
| VALIDATION_ERROR | 검증 실패 |
| CONNECTION_FAILED | 연결 실패 |
| SYNC_FAILED | 동기화 실패 |
| IMPORT_ERROR | 가져오기 오류 |

---

## 10. 변경 이력

### 버전 1.0.0 (2026-03-03)

- 초기 API 레퍼런스
- ERP 소스, 테이블/필드 매핑 API
- 가져오기/내보내기 API
- 동기화 관리 API
