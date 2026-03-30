# 데이터베이스 스키마 정의서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 데이터베이스 스키마 정의서 |
| 버전 | 1.0.0 |
| 작성일 | 2026-03-03 |
| 작성자 | Claude AI |

---

## 1. 개요

### 1.1 데이터베이스 구성

| 데이터베이스 | 용도 | 비고 |
|-------------|------|------|
| SQLite | 개발/테스트 | Django 기본 DB |
| PostgreSQL | 운영 (YH ERP) | 133.186.214.219:27455 |
| MS SQL | FOM ERP | 133.186.214.219:27455 |

### 1.2 erp_sync 모듈 스키마

ERP 연계 매핑 관리를 위한 스키마 정의

---

## 2. 테이블 정의

### 2.1 erp_source

ERP 시스템 소스 정의

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| erp_source_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| source_code | VARCHAR(20) | N | - | - | 소스 코드 (YH, FOM, SAP 등) |
| source_name | VARCHAR(100) | N | - | - | 소스명 |
| source_type | VARCHAR(20) | N | - | - | 소스 타입 (postgresql, mssql, mysql, oracle, api, sqlite) |
| description | TEXT | Y | - | - | 설명 |
| host | VARCHAR(255) | Y | - | - | 호스트 주소 |
| port | INTEGER | Y | - | - | 포트 번호 |
| database_name | VARCHAR(100) | Y | - | - | 데이터베이스명 |
| schema_name | VARCHAR(100) | Y | - | - | 스키마명 |
| api_base_url | VARCHAR(500) | Y | - | - | API Base URL (REST API 소스용) |
| api_key | VARCHAR(255) | Y | - | - | API Key |
| is_default | BOOLEAN | N | - | - | 기본 소스 여부 |
| is_active | BOOLEAN | N | - | - | 활성화 여부 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |
| updated_at | TIMESTAMP | N | - | - | 수정일시 |

**인덱스:**
- `idx_source_code`: source_code (UNIQUE)
- `idx_is_default_active`: is_default, is_active

---

### 2.2 erp_table_definition

ERP 테이블 정의 (소스별 테이블 메타데이터)

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| table_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| erp_source_id | INTEGER | N | - | erp_source.erp_source_id | ERP 소스 ID |
| source_table_name | VARCHAR(100) | N | - | - | 소스 테이블명 |
| source_table_comment | VARCHAR(255) | Y | - | - | 테이블 설명 |
| module_code | VARCHAR(50) | N | - | - | 모듈 코드 |
| module_name | VARCHAR(100) | Y | - | - | 모듈명 |
| record_count | INTEGER | Y | - | - | 레코드 수 |
| last_synced_at | TIMESTAMP | Y | - | - | 마지막 동기화 시간 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |
| updated_at | TIMESTAMP | N | - | - | 수정일시 |

**인덱스:**
- `idx_erp_source_table`: erp_source_id, source_table_name (UNIQUE)
- `idx_module_code`: module_code

---

### 2.3 erp_field_definition

ERP 필드 정의 (테이블별 컬럼 메타데이터)

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| field_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| table_id | INTEGER | N | - | erp_table_definition.table_id | 테이블 정의 ID |
| source_field_name | VARCHAR(100) | N | - | - | 소스 필드명 |
| source_field_type | VARCHAR(50) | N | - | - | 소스 필드 타입 |
| source_field_comment | VARCHAR(255) | Y | - | - | 필드 설명 |
| is_primary_key | BOOLEAN | N | - | - | 기본키 여부 |
| is_nullable | BOOLEAN | N | - | - | NULL 허용 여부 |
| is_foreign_key | BOOLEAN | N | - | - | 외래키 여부 |
| referenced_table | VARCHAR(100) | Y | - | - | 참조 테이블 |
| referenced_field | VARCHAR(100) | Y | - | - | 참조 필드 |
| field_position | INTEGER | N | - | - | 필드 순서 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |

**인덱스:**
- `idx_table_field`: table_id, source_field_name (UNIQUE)
- `idx_field_position`: table_id, field_position

---

### 2.4 erp_target_model

MIS 타겟 모델 정의

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| target_model_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| model_name | VARCHAR(100) | N | - | - | Django 모델명 |
| model_label | VARCHAR(100) | N | - | - | 모델 라벨 |
| app_label | VARCHAR(50) | N | - | - | 앱 라벨 (sales, production 등) |
| model_type | VARCHAR(20) | N | - | - | 모델 타입 (fact, dimension, snapshot, aggregate) |
| db_table_name | VARCHAR(100) | N | - | - | DB 테이블명 |
| description | TEXT | Y | - | - | 설명 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |
| updated_at | TIMESTAMP | N | - | - | 수정일시 |

**인덱스:**
- `idx_model_name`: model_name (UNIQUE)
- `idx_app_label`: app_label

---

### 2.5 erp_target_field

MIS 타겟 필드 정의

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| target_field_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| target_model_id | INTEGER | N | - | erp_target_model.target_model_id | 타겟 모델 ID |
| field_name | VARCHAR(100) | N | - | - | 필드명 |
| field_type | VARCHAR(50) | N | - | - | 필드 타입 (CharField, IntegerField 등) |
| field_label | VARCHAR(100) | Y | - | - | 필드 라벨 |
| is_required | BOOLEAN | N | - | - | 필수 여부 |
| is_unique | BOOLEAN | N | - | - | 유니크 여부 |
| max_length | INTEGER | Y | - | - | 최대 길이 |
| decimal_places | INTEGER | Y | - | - | 소수점 자리 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |

**인덱스:**
- `idx_model_field`: target_model_id, field_name (UNIQUE)

---

### 2.6 erp_table_mapping

ERP 테이블 매핑 (소스 테이블 → 타겟 모델)

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| mapping_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| mapping_code | VARCHAR(50) | N | - | - | 매핑 코드 |
| source_table_id | INTEGER | N | - | erp_table_definition.table_id | 소스 테이블 ID |
| target_model_id | INTEGER | N | - | erp_target_model.target_model_id | 타겟 모델 ID |
| mapping_name | VARCHAR(200) | N | - | - | 매핑명 |
| description | TEXT | Y | - | - | 설명 |
| sync_priority | INTEGER | N | - | - | 동기화 우선순위 (1:필수, 2:중요, 3:일반, 4:확장) |
| sync_type | VARCHAR(20) | N | - | - | 동기화 타입 (full, incremental, cdc) |
| is_active | BOOLEAN | N | - | - | 활성화 여부 |
| date_column | VARCHAR(100) | Y | - | - | 날짜 컬럼 (증분 동기화용) |
| custom_query | TEXT | Y | - | - | 사용자 정의 쿼리 |
| last_sync_at | TIMESTAMP | Y | - | - | 마지막 동기화 시간 |
| last_sync_status | VARCHAR(20) | Y | - | - | 마지막 동기화 상태 |
| total_sync_count | INTEGER | N | - | - | 총 동기화 수 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |
| updated_at | TIMESTAMP | N | - | - | 수정일시 |
| created_by | VARCHAR(100) | Y | - | - | 생성자 |

**인덱스:**
- `idx_mapping_code`: mapping_code (UNIQUE)
- `idx_source_target`: source_table_id, target_model_id (UNIQUE)
- `idx_sync_priority`: sync_priority, is_active

---

### 2.7 erp_field_mapping

ERP 필드 매핑 (소스 필드 → 타겟 필드)

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| field_mapping_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| table_mapping_id | INTEGER | N | - | erp_table_mapping.mapping_id | 테이블 매핑 ID |
| source_field_id | INTEGER | N | - | erp_field_definition.field_id | 소스 필드 ID |
| target_field_id | INTEGER | N | - | erp_target_field.target_field_id | 타겟 필드 ID |
| is_key_field | BOOLEAN | N | - | - | 키 필드 여부 |
| is_required | BOOLEAN | N | - | - | 필수 매핑 여부 |
| transform_rule | VARCHAR(20) | N | - | - | 변환 규칙 (none, upper, lower, trim, date_format, decimal_cast, concat, lookup, custom) |
| transform_expression | TEXT | Y | - | - | 변환 표현식 (JSON) |
| default_value | VARCHAR(255) | Y | - | - | 기본값 |
| validation_rule | TEXT | Y | - | - | 검증 규칙 |
| error_handling | VARCHAR(50) | N | - | - | 오류 처리 (skip, log, abort) |
| field_order | INTEGER | N | - | - | 필드 순서 |
| created_at | TIMESTAMP | N | - | - | 생성일시 |

**인덱스:**
- `idx_table_source`: table_mapping_id, source_field_id (UNIQUE)
- `idx_field_order`: table_mapping_id, field_order

---

### 2.8 erp_mapping_validation

매핑 검증 기록

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| validation_id | INTEGER | N | Y | - | 기본키 (Auto Increment) |
| table_mapping_id | INTEGER | N | - | erp_table_mapping.mapping_id | 테이블 매핑 ID |
| validation_type | VARCHAR(50) | N | - | - | 검증 타입 (structure, data, connection) |
| status | VARCHAR(20) | N | - | - | 상태 (passed, failed, warning) |
| validation_details | JSON | N | - | - | 검증 상세 |
| error_message | TEXT | Y | - | - | 오류 메시지 |
| validated_at | TIMESTAMP | N | - | - | 검증일시 |

**인덱스:**
- `idx_mapping_validated`: table_mapping_id, validated_at

---

### 2.9 기존 erp_sync 테이블

#### erp_sync_config

ERP 동기화 설정

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| id | INTEGER | N | Y | - | 기본키 |
| table_name | VARCHAR(100) | N | - | - | 테이블명 |
| is_active | BOOLEAN | N | - | - | 활성화 여부 |
| sync_priority | INTEGER | N | - | - | 동기화 우선순위 |
| last_sync | TIMESTAMP | Y | - | - | 마지막 동기화 |
| sync_interval | INTEGER | N | - | - | 동기화 간격 (분) |

#### erp_sync_log

ERP 동기화 로그

| 컬럼명 | 타입 | NULL | PK | FK | 설명 |
|--------|------|------|----|----|------|
| id | INTEGER | N | Y | - | 기본키 |
| table_name | VARCHAR(100) | N | - | - | 테이블명 |
| start_time | TIMESTAMP | N | - | - | 시작 시간 |
| end_time | TIMESTAMP | Y | - | - | 종료 시간 |
| status | VARCHAR(20) | N | - | - | 상태 (success, error) |
| records_processed | INTEGER | N | - | - | 처리 레코드 수 |
| error_message | TEXT | Y | - | - | 오류 메시지 |

---

## 3. 관계도

```
erp_source (1) ──< (N) erp_table_definition (1) ──< (N) erp_field_definition
                      │
                      │
                      └──< (N) erp_table_mapping (1) ──> (1) erp_target_model
                                                            │
                                                            └──< (N) erp_target_field

erp_table_mapping (1) ──< (N) erp_field_mapping
                               │
                               ├──> erp_field_definition (1)
                               └──> erp_target_field (1)
```

---

## 4. 모듈별 테이블 목록

### 4.1 영업 (Sales)

| 테이블명 | 설명 | 소스 |
|---------|------|------|
| SDY100_YH | 월별 판매 계획 | YH ERP |
| SDA500_YH | 수주 상세 | YH ERP |
| SDA510_YH | 출하 상세 | YH ERP |

### 4.2 생산 (Production)

| 테이블명 | 설명 | 소스 |
|---------|------|------|
| DMB110_yuhan | 생산 실적 | YH ERP |
| ppc100_counter | 생산 카운터 | YH ERP |
| MESTagValue_YH | MES 태그 값 | YH ERP |

### 4.3 품질 (Quality)

| 테이블명 | 설명 | 소스 |
|---------|------|------|
| QDA100_yuhan | 검사 데이터 | YH ERP |
| QMO100 | 품질 지표 | YH ERP |
| QMO110 | 품질 상세 | YH ERP |
| QPM100_YH | 품질 관리 | YH ERP |

### 4.4 구매 (Purchase)

| 테이블명 | 설명 | 소스 |
|---------|------|------|
| BAR200 | 구매 요청 | YH ERP |
| MMY100_YH | 자재 마스터 | YH ERP |
| LCB100 | 구매 입고 | YH ERP |
| LCA100 | 구매 검수 | YH ERP |
| QMM600 | 공급업체 | YH ERP |

### 4.5 재무 (Financial)

| 테이블명 | 설명 | 소스 |
|---------|------|------|
| CAM900_YH | 회계 전표 | YH ERP |
| CAM200_YH | 원가 데이터 | YH ERP |
| CAM300_YH | 예산 데이터 | YH ERP |

---

## 5. 마이그레이션 순서

1. erp_source 생성
2. erp_table_definition 생성
3. erp_field_definition 생성
4. erp_target_model 생성
5. erp_target_field 생성
6. erp_table_mapping 생성
7. erp_field_mapping 생성
8. erp_mapping_validation 생성

---

## 6. 변경 이력

### 버전 1.0.0 (2026-03-03)

- 초기 스키마 정의
- ERP 연계 매핑 관리 테이블 추가
