# API 설계

## 개요

claros_aibis 시스템의 REST API 엔드포인트를 정의한다.

## 문서 개정 이력

| 버전 | 일자 | 작성자 | 수정 내용 |
|------|------|--------|----------|
| 1.0 | 2026-07-01 | AI Agent | 초기 작성 |

---

## 1. API 개요

### 1.1 기본 사양

| 항목 | 사양 |
|------|------|
| 프로토콜 | HTTPS |
| 포맷 | JSON |
| 인증 | JWT Bearer Token |
| 문자셋 | UTF-8 |
| 날짜 형식 | ISO 8601 (YYYY-MM-DD) |
| 시간대 | Asia/Seoul (UTC+9) |

### 1.2 기본 URL

```
개발: http://localhost:8000/api/
운영: https://api.claros-aibis.com/
```

### 1.3 공통 헤더

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

### 1.4 공통 응답 구조

```json
{
    "success": true,
    "data": {},
    "message": "",
    "errors": null
}
```

---

## 2. 인증 API

### 2.1 로그인

**Endpoint**: `POST /api/auth/login/`

**Request Body**:
```json
{
    "username": "string",
    "password": "string"
}
```

**Response**:
```json
{
    "access": "string",
    "refresh": "string",
    "user": {
        "id": 1,
        "username": "string",
        "email": "string",
        "role": "string"
    }
}
```

### 2.2 토큰 갱신

**Endpoint**: `POST /api/auth/refresh/`

**Request Body**:
```json
{
    "refresh": "string"
}
```

**Response**:
```json
{
    "access": "string"
}
```

---

## 3. 마스터 데이터 API

### 3.1 계정과목 (Accounts)

**Base URL**: `/api/data-hub/master/accounts/`

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/accounts/` | 목록 조회 |
| POST | `/accounts/` | 생성 |
| GET | `/accounts/{id}/` | 상세 조회 |
| PUT/PATCH | `/accounts/{id}/` | 수정 |
| DELETE | `/accounts/{id}/` | 삭제 |
| GET | `/accounts/account_types/` | 계정 유형 목록 |
| POST | `/accounts/export/` | 내보내기 (CSV/Excel/JSON) |
| POST | `/accounts/import/` | 가져오기 |
| POST | `/accounts/batch_create/` | 일괄 생성 |
| POST | `/accounts/batch_update/` | 일괄 수정 |
| POST | `/accounts/batch_delete/` | 일괄 삭제 |

**Query Parameters**:
- `page`: 페이지 번호 (기본: 1)
- `page_size`: 페이지 크기 (기본: 20)
- `search`: 검색어 (코드, 명칭)
- `account_type`: 계정 유형 필터
- `category_l1`: 대분류 필터
- `category_l2`: 중분류 필터
- `is_active`: 활성화 여부
- `ordering`: 정렬 (created_at, account_code, account_name)

**Response Example**:
```json
{
    "count": 100,
    "next": null,
    "previous": null,
    "results": [
        {
            "account_id": 1,
            "account_code": "110100",
            "account_name": "현금",
            "account_name_en": "Cash",
            "account_type": "asset",
            "category_l1": "유동자산",
            "category_l2": "당좌자산",
            "control_account_name": null,
            "is_consolidated": false,
            "is_tax_related": true,
            "is_active": true,
            "created_at": "2026-07-01T00:00:00+09:00",
            "updated_at": "2026-07-01T00:00:00+09:00"
        }
    ]
}
```

---

### 3.2 창고 (Warehouses)

**Base URL**: `/api/data-hub/master/warehouses/`

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/warehouses/` | 목록 조회 |
| POST | `/warehouses/` | 생성 |
| GET | `/warehouses/{id}/` | 상세 조회 |
| PUT/PATCH | `/warehouses/{id}/` | 수정 |
| DELETE | `/warehouses/{id}/` | 삭제 |
| GET | `/warehouses/warehouse_types/` | 창고 유형 목록 |
| POST | `/warehouses/export/` | 내보내기 |
| POST | `/warehouses/import/` | 가져오기 |
| POST | `/warehouses/batch_create/` | 일괄 생성 |
| POST | `/warehouses/batch_update/` | 일괄 수정 |
| POST | `/warehouses/batch_delete/` | 일괄 삭제 |

**Query Parameters**:
- `page`, `page_size`
- `search`: 검색어
- `warehouse_type`: 창고 유형 필터
- `plant`: 공장 필터
- `is_active`: 활성화 여부
- `ordering`

---

### 3.3 공정 (Processes)

**Base URL**: `/api/data-hub/master/processes/`

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/processes/` | 목록 조회 |
| POST | `/processes/` | 생성 |
| GET | `/processes/{id}/` | 상세 조회 |
| PUT/PATCH | `/processes/{id}/` | 수정 |
| DELETE | `/processes/{id}/` | 삭제 |
| GET | `/processes/process_types/` | 공정 유형 목록 |
| POST | `/processes/export/` | 내보내기 |
| POST | `/processes/import/` | 가져오기 |
| POST | `/processes/batch_create/` | 일괄 생성 |
| POST | `/processes/batch_update/` | 일괄 수정 |
| POST | `/processes/batch_delete/` | 일괄 삭제 |

**Query Parameters**:
- `page`, `page_size`
- `search`: 검색어
- `process_type`: 공정 유형 필터
- `plant`: 공장 필터
- `line`: 라인 필터
- `is_active`: 활성화 여부
- `ordering`

---

### 3.4 은행 (Banks)

**Base URL**: `/api/data-hub/master/banks/`

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/banks/` | 목록 조회 |
| POST | `/banks/` | 생성 |
| GET | `/banks/{id}/` | 상세 조회 |
| PUT/PATCH | `/banks/{id}/` | 수정 |
| DELETE | `/banks/{id}/` | 삭제 |
| GET | `/banks/bank_types/` | 은행 유형 목록 |
| POST | `/banks/export/` | 내보내기 |
| POST | `/banks/import/` | 가져오기 |
| POST | `/banks/batch_create/` | 일괄 생성 |
| POST | `/banks/batch_update/` | 일괄 수정 |
| POST | `/banks/batch_delete/` | 일괄 삭제 |

**Query Parameters**:
- `page`, `page_size`
- `search`: 검색어
- `bank_type`: 은행 유형 필터
- `is_active`: 활성화 여부
- `ordering`

---

### 3.5 기타 마스터 데이터

동일한 패턴으로 다음 마스터 데이터도 제공:
- `/api/data-hub/master/products/` - 제품
- `/api/data-hub/master/vendors/` - 공급처
- `/api/data-hub/master/customers/` - 고객사
- `/api/data-hub/master/departments/` - 부서
- `/api/data-hub/master/employees/` - 직원
- `/api/data-hub/master/equipment/` - 설비

---

## 4. KPI API

### 4.1 KPI 정의 (Definitions)

**Base URL**: `/api/data-hub/analytics/definitions/`

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/definitions/` | 목록 조회 |
| POST | `/definitions/` | 생성 |
| GET | `/definitions/{id}/` | 상세 조회 |
| PUT/PATCH | `/definitions/{id}/` | 수정 |
| DELETE | `/definitions/{id}/` | 삭제 |
| GET | `/definitions/categories/` | 카테고리 목록 |
| POST | `/definitions/sync_registry/` | 레지스트리 동기화 |
| POST | `/definitions/bulk_calculate/` | 대량 계산 |

**Query Parameters**:
- `page`, `page_size`
- `search`: 검색어
- `category`: 카테고리 필터
- `kpi_type`: KPI 유형 필터
- `is_active`: 활성화 여부
- `ordering`

---

### 4.2 KPI 실적 (Facts)

**Base URL**: `/api/data-hub/analytics/facts/`

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/facts/` | 목록 조회 |
| GET | `/facts/latest/` | 최신 실적 조회 |
| GET | `/facts/summary/` | 요약 통계 |
| GET | `/facts/status_distribution/` | 상태 분포 |

**Query Parameters**:
- `page`, `page_size`
- `kpi_id`: KPI 필터
- `report_date`: 보고 날짜
- `year`: 연도
- `quarter`: 분기
- `month`: 월
- `plant`: 공장
- `department`: 부서
- `status`: 상태
- `ordering`

---

### 4.3 대량 계산 (Bulk Calculation)

**Endpoint**: `POST /api/data-hub/analytics/definitions/bulk_calculate/`

**Request Body**:
```json
{
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "kpi_codes": ["FIN001", "FIN002"],
    "plant": "P1",
    "department": "영업팀"
}
```

**Response**:
```json
{
    "task_id": "string",
    "status": "started",
    "message": "KPI 대량 계산이 시작되었습니다."
}
```

---

## 5. HTTP 상태 코드

| 코드 | 설명 | 사용 예시 |
|------|------|----------|
| 200 | OK | GET 요청 성공 |
| 201 | Created | POST 생성 성공 |
| 204 | No Content | DELETE 성공 |
| 400 | Bad Request | 잘못된 파라미터 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 데이터 |
| 422 | Unprocessable Entity | 검증 실패 |
| 429 | Too Many Requests | Rate Limit 초과 |
| 500 | Internal Server Error | 서버 에러 |

---

## 6. 에러 응답 형식

```json
{
    "success": false,
    "data": null,
    "message": "에러 메시지",
    "errors": {
        "field_name": ["에러 내용"]
    }
}
```

**일반 에러 코드**:
- `AUTH_001`: 인증 토큰 없음
- `AUTH_002`: 인증 토큰 만료
- `PERM_001`: 권한 없음
- `VAL_001`: 필수 필드 누락
- `VAL_002`: 중복 데이터
- `VAL_003`: 잘못된 형식
- `NOT_001`: 리소스 없음

---

## 7. Rate Limiting

| 등급 | 제한 |
|------|------|
| 무료 | 1000 requests/hour |
| 표준 | 10000 requests/hour |
| 프리미엄 | 무제한 |

---

## 8. API 버전 관리

- 현재 버전: v1
- URL 경로: `/api/v1/` (생략 가능)
- 헤더: `API-Version: 1`

---

## 9. 참고 문서

- [요구사항 정의](../01_요구사항/README.md)
- [아키텍처 설계](./아키텍처.md)
- [데이터베이스 설계](./데이터베이스설계.md)
- [Swagger UI](http://localhost:8000/swagger/)
