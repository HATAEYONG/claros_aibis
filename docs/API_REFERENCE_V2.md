# API 레퍼런스 문서 v2.0

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | ERP 매핑 관리 시스템 API 레퍼런스 |
| 버전 | 2.0.0 |
| 작성일 | 2026-03-03 |
| 작성자 | Claude AI |
| Base URL | `/api/erp-sync/` |

---

## 1. 개요

### 1.1 인증

현재 개발 환경에서는 인증이 구현되어 있지 않습니다. 추후 JWT 기반 인증이 추가될 예정입니다.

```
Authorization: Bearer {token}  // 추후 지원 예정
```

### 1.2 응답 포맷

#### 성공 응답 (200 OK)

```json
{
  "id": 1,
  "field_name": "value",
  ...
}
```

#### 목록 응답 (200 OK)

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/erp-sync/table-mappings/?page=2",
  "previous": null,
  "results": [...]
}
```

#### 에러 응답 (400 Bad Request)

```json
{
  "field_name": ["에러 메시지"]
}
```

#### 에러 응답 (404 Not Found)

```json
{
  "detail": "찾을 수 없습니다."
}
```

---

## 2. ERP 소스 관리

### 2.1 ERP 소스 목록 조회

```http
GET /api/erp-sync/sources/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | integer | N | 페이지 번호 (default: 1) |
| page_size | integer | N | 페이지 크기 (default: 20) |
| is_active | boolean | N | 활성화 여부 필터 |
| source_type | string | N | 소스 타입 필터 (postgresql, mssql, mysql, oracle) |

**Response (200 OK):**

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "source_code": "YH",
      "source_name": "유한 DB",
      "source_type": "postgresql",
      "description": "유한킴벌리 ERP 시스템",
      "host": "133.186.214.219",
      "port": 27455,
      "database": "emax_yuhan",
      "schema_name": "public",
      "username": "postgres",
      "is_default": true,
      "is_active": true,
      "created_at": "2026-03-03T10:00:00Z",
      "updated_at": "2026-03-03T10:00:00Z"
    }
  ]
}
```

---

### 2.2 ERP 소스 생성

```http
POST /api/erp-sync/sources/
```

**Request Body:**

```json
{
  "source_code": "FOM",
  "source_name": "FOM ERP",
  "source_type": "mssql",
  "description": "FOM ERP 시스템",
  "host": "133.186.214.219",
  "port": 27455,
  "database": "fom_db",
  "schema_name": "dbo",
  "username": "sa",
  "password": "password",
  "is_default": false,
  "is_active": true
}
```

**Response (201 Created):**

```json
{
  "id": 2,
  "source_code": "FOM",
  "source_name": "FOM ERP",
  "source_type": "mssql",
  "description": "FOM ERP 시스템",
  "host": "133.186.214.219",
  "port": 27455,
  "database": "fom_db",
  "schema_name": "dbo",
  "is_default": false,
  "is_active": true,
  "created_at": "2026-03-03T11:00:00Z",
  "updated_at": "2026-03-03T11:00:00Z"
}
```

---

### 2.3 ERP 소스 상세 조회

```http
GET /api/erp-sync/sources/{id}/
```

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | integer | Y | ERP 소스 ID |

**Response (200 OK):**

```json
{
  "id": 1,
  "source_code": "YH",
  "source_name": "유한 DB",
  "source_type": "postgresql",
  "description": "유한킴벌리 ERP 시스템",
  "host": "133.186.214.219",
  "port": 27455,
  "database": "emax_yuhan",
  "is_default": true,
  "is_active": true,
  "table_count": 90,
  "created_at": "2026-03-03T10:00:00Z",
  "updated_at": "2026-03-03T10:00:00Z"
}
```

---

### 2.4 ERP 소스 수정

```http
PUT /api/erp-sync/sources/{id}/
```

**Request Body:**

```json
{
  "source_code": "YH",
  "source_name": "유한 DB (수정)",
  "source_type": "postgresql",
  "host": "133.186.214.219",
  "port": 27455,
  "database": "emax_yuhan",
  "is_default": true,
  "is_active": true
}
```

---

### 2.5 ERP 소스 삭제

```http
DELETE /api/erp-sync/sources/{id}/
```

**Response (204 No Content):**

```json
(null)
```

---

### 2.6 DB 연결 테스트

```http
POST /api/erp-sync/sources/{id}/test_connection/
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "연결 성공",
  "database_version": "PostgreSQL 15.x"
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "연결 실패",
  "error": "연결 시간 초과"
}
```

---

### 2.7 테이블 정의 가져오기

```http
POST /api/erp-sync/sources/{id}/import_tables/
```

**Request Body:**

```json
{
  "table_name_pattern": "%_YH",
  "import_fields": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "90개 테이블, 1,533개 필드를 가져왔습니다",
  "tables_imported": 90,
  "fields_imported": 1533
}
```

---

## 3. 테이블 정의 관리

### 3.1 테이블 정의 목록 조회

```http
GET /api/erp-sync/table-definitions/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| erp_source | integer | N | ERP 소스 ID 필터 |
| module_code | string | N | 모듈 코드 필터 (SD, PP, QM, MM, FI, HR, CO) |
| search | string | N | 테이블명 검색 |
| page | integer | N | 페이지 번호 |
| page_size | integer | N | 페이지 크기 |

**Response (200 OK):**

```json
{
  "count": 90,
  "results": [
    {
      "id": 1,
      "erp_source": 1,
      "source_table_name": "SDY100_YH",
      "table_description": "영업연월별계획",
      "module_code": "SD",
      "module_name": "영업",
      "record_count": 1250,
      "field_count": 16,
      "last_synced_at": "2026-03-03T10:00:00Z"
    }
  ]
}
```

---

### 3.2 테이블 정의 상세 조회

```http
GET /api/erp-sync/table-definitions/{id}/
```

**Response (200 OK):**

```json
{
  "id": 1,
  "erp_source": {
    "id": 1,
    "source_code": "YH",
    "source_name": "유한 DB"
  },
  "source_table_name": "SDY100_YH",
  "table_description": "영업연월별계획",
  "module_code": "SD",
  "module_name": "영업",
  "record_count": 1250,
  "field_count": 16,
  "last_synced_at": "2026-03-03T10:00:00Z"
}
```

---

### 3.3 테이블 필드 목록 조회

```http
GET /api/erp-sync/table-definitions/{id}/fields/
```

**Response (200 OK):**

```json
{
  "count": 16,
  "results": [
    {
      "id": 1,
      "source_field_name": "plan_mon",
      "source_field_type": "VARCHAR(6)",
      "field_description": "계획월",
      "is_primary_key": true,
      "is_nullable": false,
      "is_foreign_key": false,
      "field_position": 1
    },
    {
      "id": 2,
      "source_field_name": "cust_nm",
      "source_field_type": "VARCHAR(100)",
      "field_description": "거래처명",
      "is_primary_key": false,
      "is_nullable": true,
      "field_position": 2
    }
  ]
}
```

---

## 4. 타겟 모델 관리

### 4.1 타겟 모델 목록 조회

```http
GET /api/erp-sync/target-models/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| app_label | string | N | 앱 라벨 필터 (sales, production, quality, etc) |
| model_type | string | N | 모델 타입 필터 (fact, dimension, snapshot, aggregate) |
| search | string | N | 모델명 검색 |
| page | integer | N | 페이지 번호 |

**Response (200 OK):**

```json
{
  "count": 124,
  "results": [
    {
      "id": 1,
      "model_name": "sales.Sdy100",
      "model_label": "영업연월별계획",
      "app_label": "sales",
      "model_type": "fact",
      "db_table_name": "sales_sdy100",
      "description": "월별 영업 계획 정보",
      "field_count": 16
    },
    {
      "id": 2,
      "model_name": "dashboard.ExecutiveSummary",
      "model_label": "경영진단 요약",
      "app_label": "dashboard",
      "model_type": "aggregate",
      "db_table_name": "dash_executive_summary",
      "description": "경영진단을 위한 핵심 경영 지표 요약",
      "field_count": 11
    }
  ]
}
```

---

### 4.2 타겟 모델 생성

```http
POST /api/erp-sync/target-models/
```

**Request Body:**

```json
{
  "model_name": "sales.NewModel",
  "model_label": "새로운 모델",
  "app_label": "sales",
  "model_type": "fact",
  "db_table_name": "sales_new_model",
  "description": "새로운 모델 설명"
}
```

**Response (201 Created):**

```json
{
  "id": 125,
  "model_name": "sales.NewModel",
  "model_label": "새로운 모델",
  "app_label": "sales",
  "model_type": "fact",
  "db_table_name": "sales_new_model",
  "description": "새로운 모델 설명",
  "created_at": "2026-03-03T12:00:00Z"
}
```

---

### 4.3 타겟 모델 상세 조회

```http
GET /api/erp-sync/target-models/{id}/
```

**Response (200 OK):**

```json
{
  "id": 1,
  "model_name": "sales.Sdy100",
  "model_label": "영업연월별계획",
  "app_label": "sales",
  "model_type": "fact",
  "db_table_name": "sales_sdy100",
  "description": "월별 영업 계획 정보",
  "created_at": "2026-03-03T10:00:00Z",
  "updated_at": "2026-03-03T10:00:00Z"
}
```

---

### 4.4 타겟 모델 필드 목록 조회

```http
GET /api/erp-sync/target-models/{id}/fields/
```

**Response (200 OK):**

```json
{
  "count": 16,
  "results": [
    {
      "id": 1,
      "field_name": "period_value",
      "field_type": "CharField",
      "field_label": "기간값",
      "is_required": true,
      "is_unique": false,
      "max_length": 50
    },
    {
      "id": 2,
      "field_name": "customer_name",
      "field_type": "CharField",
      "field_label": "거래처명",
      "is_required": false,
      "is_unique": false,
      "max_length": 100
    }
  ]
}
```

---

## 5. 테이블 매핑 관리

### 5.1 테이블 매핑 목록 조회

```http
GET /api/erp-sync/table-mappings/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| source_table | integer | N | 소스 테이블 ID 필터 |
| target_model | integer | N | 타겟 모델 ID 필터 |
| sync_priority | integer | N | 동기화 우선순위 필터 (1-4) |
| is_active | boolean | N | 활성화 여부 필터 |
| page | integer | N | 페이지 번호 |

**Response (200 OK):**

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
      "sync_schedule": "0 2 * * *",
      "is_active": true,
      "last_sync_at": "2026-03-03T10:00:00Z",
      "last_sync_status": "success",
      "total_sync_count": 120
    }
  ]
}
```

---

### 5.2 테이블 매핑 생성

```http
POST /api/erp-sync/table-mappings/
```

**Request Body:**

```json
{
  "source_table_id": 1,
  "target_model_id": 1,
  "mapping_code": "SDY100_YH_TO_SALES_SDY100",
  "mapping_name": "SDY100_YH → sales.Sdy100",
  "description": "영업연월별계획 매핑",
  "sync_priority": 1,
  "sync_type": "full",
  "sync_schedule": "0 2 * * *",
  "is_active": true
}
```

**Response (201 Created):**

```json
{
  "id": 163,
  "mapping_code": "SDY100_YH_TO_SALES_SDY100",
  "mapping_name": "SDY100_YH → sales.Sdy100",
  "source_table": 1,
  "target_model": 1,
  "sync_priority": 1,
  "sync_type": "full",
  "is_active": true,
  "created_at": "2026-03-03T12:00:00Z"
}
```

---

### 5.3 테이블 매핑 상세 조회

```http
GET /api/erp-sync/table-mappings/{id}/
```

**Response (200 OK):**

```json
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
  "sync_schedule": "0 2 * * *",
  "is_active": true,
  "date_column": "plan_mon",
  "custom_query": null,
  "last_sync_at": "2026-03-03T10:00:00Z",
  "last_sync_status": "success",
  "total_sync_count": 120
}
```

---

### 5.4 테이블 매핑 수정

```http
PUT /api/erp-sync/table-mappings/{id}/
```

**Request Body:**

```json
{
  "mapping_name": "SDY100_YH → sales.Sdy100 (수정)",
  "sync_priority": 2,
  "is_active": true
}
```

---

### 5.5 테이블 매핑 삭제

```http
DELETE /api/erp-sync/table-mappings/{id}/
```

**Response (204 No Content):**

```json
(null)
```

---

## 6. 필드 매핑 관리

### 6.1 필드 매핑 목록 조회

```http
GET /api/erp-sync/field-mappings/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| table_mapping | integer | N | 테이블 매핑 ID 필터 |
| source_field | integer | N | 소스 필드 ID 필터 |
| target_field | integer | N | 타겟 필드 ID 필터 |
| is_key_field | boolean | N | 키 필드 여부 필터 |
| page | integer | N | 페이지 번호 |

**Response (200 OK):**

```json
{
  "count": 1618,
  "results": [
    {
      "id": 1,
      "table_mapping": 1,
      "source_field": {
        "id": 1,
        "source_field_name": "plan_mon",
        "source_field_type": "VARCHAR(6)"
      },
      "target_field": {
        "id": 1,
        "field_name": "period_value",
        "field_type": "CharField"
      },
      "is_key_field": true,
      "is_required": true,
      "transform_rule": "none",
      "default_value": null,
      "field_order": 0
    }
  ]
}
```

---

### 6.2 필드 매핑 생성

```http
POST /api/erp-sync/field-mappings/
```

**Request Body:**

```json
{
  "table_mapping_id": 1,
  "source_field_id": 1,
  "target_field_id": 1,
  "is_key_field": true,
  "is_required": true,
  "transform_rule": "none",
  "default_value": null,
  "field_order": 0
}
```

**Response (201 Created):**

```json
{
  "id": 1619,
  "table_mapping": 1,
  "source_field": 1,
  "target_field": 1,
  "is_key_field": true,
  "is_required": true,
  "transform_rule": "none",
  "field_order": 0,
  "created_at": "2026-03-03T12:00:00Z"
}
```

---

### 6.3 필드 매핑 상세 조회

```http
GET /api/erp-sync/field-mappings/{id}/
```

**Response (200 OK):**

```json
{
  "id": 1,
  "table_mapping": 1,
  "source_field": {
    "id": 1,
    "source_field_name": "plan_mon",
    "source_field_type": "VARCHAR(6)",
    "field_description": "계획월"
  },
  "target_field": {
    "id": 1,
    "field_name": "period_value",
    "field_type": "CharField",
    "field_label": "기간값"
  },
  "is_key_field": true,
  "is_required": true,
  "transform_rule": "none",
  "transform_expression": null,
  "default_value": null,
  "validation_rule": null,
  "error_handling": "skip",
  "field_order": 0
}
```

---

### 6.4 필드 매핑 수정

```http
PUT /api/erp-sync/field-mappings/{id}/
```

**Request Body:**

```json
{
  "is_key_field": true,
  "is_required": true,
  "transform_rule": "upper",
  "field_order": 0
}
```

---

### 6.5 필드 매핑 삭제

```http
DELETE /api/erp-sync/field-mappings/{id}/
```

**Response (204 No Content):**

```json
(null)
```

---

## 7. 가져오기/내보내기

### 7.1 CSV 매핑 가져오기

```http
POST /api/erp-sync/import-export/import_from_csv/
```

**Request (multipart/form-data):**

```
csv_file: [CSV 파일]
mode: tables|fields|mappings
erp_source_id: 1
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "90개 테이블, 1,533개 필드를 가져왔습니다",
  "summary": {
    "tables_imported": 90,
    "fields_imported": 1533,
    "mappings_created": 0,
    "errors": []
  }
}
```

**CSV 포맷 (테이블 정의):**

```csv
테이블명,테이블 설명,모듈구분,컬렴명,컬렴설명,데이터타입,PK여부,NULL허용
SDY100_YH,영업연월별계획,SD,plan_mon,계획월,VARCHAR(6),N,N
SDY100_YH,영업연월별계획,SD,cust_nm,거래처명,VARCHAR(100),Y,Y
...
```

---

### 7.2 CSV 매핑 내보내기

```http
GET /api/erp-sync/import-export/export_to_csv/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| erp_source_id | integer | N | ERP 소스 ID (전체: 생략) |
| mode | string | N | 내보내기 모드 (tables|fields|mappings) |

**Response (200 OK):**

```csv
테이블명,테이블 설명,모듈구분,컬렴명,컬렴설명,데이터타입,PK여부,NULL허용
SDY100_YH,영업연월별계획,SD,plan_mon,계획월,VARCHAR(6),N,N
...
```

---

## 8. 동기화 관리

### 8.1 동기화 실행

```http
POST /api/erp-sync/sync/run/
```

**Request Body:**

```json
{
  "table_mapping_ids": [1, 2, 3],
  "sync_type": "full",
  "force": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "3개 매핑 동기화를 시작했습니다",
  "sync_job_id": "sync_20260303_120000",
  "estimated_time": "5분"
}
```

---

### 8.2 동기화 상태 조회

```http
GET /api/erp-sync/sync/status/{sync_job_id}/
```

**Response (200 OK):**

```json
{
  "sync_job_id": "sync_20260303_120000",
  "status": "running",
  "progress": 33,
  "completed_mappings": 1,
  "total_mappings": 3,
  "started_at": "2026-03-03T12:00:00Z",
  "estimated_completion": "2026-03-03T12:05:00Z",
  "details": [
    {
      "mapping_code": "SDY100_YH_SALES_TO_SDY100",
      "status": "completed",
      "records_processed": 1250,
      "error_count": 0
    }
  ]
}
```

---

### 8.3 동기화 로그 목록 조회

```http
GET /api/erp-sync/sync/logs/
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| table_mapping | integer | N | 테이블 매핑 ID 필터 |
| status | string | N | 상태 필터 (success, error, running) |
| start_date | string | N | 시작일 필터 (YYYY-MM-DD) |
| end_date | string | N | 종료일 필터 (YYYY-MM-DD) |

**Response (200 OK):**

```json
{
  "count": 100,
  "results": [
    {
      "id": 1,
      "table_mapping": {
        "id": 1,
        "mapping_code": "SDY100_YH_SALES_TO_SDY100"
      },
      "start_time": "2026-03-03T10:00:00Z",
      "end_time": "2026-03-03T10:01:30Z",
      "status": "success",
      "records_processed": 1250,
      "records_succeeded": 1250,
      "records_failed": 0,
      "error_message": null,
      "duration_seconds": 90
    }
  ]
}
```

---

## 9. 통계 및 분석

### 9.1 매핑 통계 조회

```http
GET /api/erp-sync/statistics/mappings/
```

**Response (200 OK):**

```json
{
  "summary": {
    "total_erp_sources": 1,
    "total_source_tables": 90,
    "total_source_fields": 1533,
    "total_target_models": 124,
    "total_target_fields": 1913,
    "total_table_mappings": 162,
    "total_field_mappings": 1618
  },
  "by_module": [
    {
      "app_label": "sales",
      "model_count": 10,
      "table_mappings": 11,
      "field_mappings": 109
    },
    {
      "app_label": "production",
      "model_count": 20,
      "table_mappings": 22,
      "field_mappings": 315
    }
  ]
}
```

---

### 9.2 모듈별 통계 조회

```http
GET /api/erp-sync/statistics/by-module/
```

**Response (200 OK):**

```json
{
  "results": [
    {
      "app_label": "etc",
      "model_count": 34,
      "table_mappings": 34,
      "field_mappings": 650
    },
    {
      "app_label": "production",
      "model_count": 20,
      "table_mappings": 22,
      "field_mappings": 315
    },
    {
      "app_label": "quality",
      "model_count": 13,
      "table_mappings": 14,
      "field_mappings": 293
    }
  ]
}
```

---

## 10. 에러 코드

| 코드 | 설명 | 해결 방법 |
|------|------|-----------|
| 400 | Bad Request | 요청 파라미터 확인 |
| 401 | Unauthorized | 인증 토큰 확인 |
| 403 | Forbidden | 권한 확인 |
| 404 | Not Found | 리소스 존재 확인 |
| 409 | Conflict | 중복 데이터 확인 |
| 500 | Internal Server Error | 서버 로그 확인 |

---

## 11. 변경 이력

### 버전 2.0.0 (2026-03-03)

**추가:**
- 타겟 모델 관리 API
- Dashboard/KPI 레이어 API
- 필드 매핑 관리 API
- 통계 및 분석 API
- CSV 가져오기/내보내기 API
- 동기화 관리 API

**데이터:**
- 124개 타겟 모델
- 162개 테이블 매핑
- 1,618개 필드 매핑

### 버전 1.0.0 (2026-02-28)

**초기 릴리스:**
- ERP 소스 관리 API
- 테이블 정의 관리 API
- 기본 매핑 API

---

## 12. 참고 자료

- Django REST Framework: https://www.django-rest-framework.org/
- REST API 설계 가이드: https://restfulapi.net/

---

**문서 버전**: 2.0.0
**최종 수정일**: 2026-03-03
**유지보수 담당**: Claude AI
