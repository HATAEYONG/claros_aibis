# API설계서

**작성일**: 2026-07-08 | **버전**: 1.0
**공통 규격**: REST + JSON, Django REST Framework ViewSet/APIView 기반, 페이지네이션은 `StandardPageNumberPagination`(page_size=50)

> 전체 앱별 상세 엔드포인트는 프로젝트 루트 `API.md`를 참조한다. 본 문서는 이번 세션에서 구축·검증한 핵심 API를 중심으로 기술한다.

---

## 1. 인증 API

| Method | URL | 설명 |
|---|---|---|
| POST | `/auth/login/` | JWT 로그인(`access_token`, `refresh` 발급) |
| POST | `/auth/logout/` | 로그아웃 |
| GET | `/auth/me/` | 현재 사용자 정보 |
| POST | `/auth/refresh/` | 토큰 갱신 |

인증 헤더: `Authorization: Bearer {access_token}` — 대부분의 API는 `AllowAny`(데모/조회 편의)이나, `erp-sync/table-mappings/` 등 관리성 API는 인증을 요구한다.

## 2. 대시보드 API (`/api/erp-sync/dashboard/`)

| Method | URL | 파라미터 | 응답 요약 |
|---|---|---|---|
| GET | `executive-summary/` | `period_type`, `period_value(YYYY-MM)` | `total_sales, total_profit, profit_margin, total_orders, production_rate, quality_rate, inventory_turnover, employee_count, safety_incidents` |
| GET | `sales/` | `date(YYYY-MM-DD)` | `daily_sales, monthly_sales, order_count, delivery_count, pending_orders, top_customers[], top_products[], vs_last_year, vs_target` |
| GET | `production/` | `date`, `factory_code` | `plan_qty, production_qty, good_qty, defect_qty, yield_rate, achievement_rate, oee_rate, downtime_minutes, manpower_count, lines[]` |
| GET | `quality/` | `date` | `inspect_count, pass_count, fail_count, pass_rate, defect_rate, top_defects[], inspector_performance[], yield_by_process[]` |
| GET | `inventory/` | `asof_date` | `total_items, total_stock_qty, total_stock_value, overstock_items, stockout_items, avg_stock_days, warehouses[], slow_moving_details[]` |

**설계 원칙**: 요청된 날짜/기간에 정확히 일치하는 데이터가 없으면(`_closest_fy_fm_queryset`/`_closest_date_queryset`) 가장 가까운 시점의 데이터로 자연스럽게 대체한다. 모든 응답에 `data_source: 'local_augmented'`를 포함해 출처를 명시한다. YH 원격 DB에는 어떤 경우에도 직접 연결을 시도하지 않는다.

## 3. ERP 연동/매핑 API (`/api/erp-sync/`)

| Method | URL | 설명 |
|---|---|---|
| GET/POST/PUT/DELETE | `connection-config/` | ERP 연결 설정 CRUD |
| POST | `connection-config/test-connection/` | 실제 연결 테스트(source_code 지정) |
| POST | `connection-config/toggle-connection/` | 연결 on/off 토글 |
| POST | `connection-config/reset-connection/` | 실패 카운트/상태 초기화 |
| GET/POST/PUT/DELETE | `table-mappings/` | 테이블 매핑 CRUD, `?table_mapping={id}`로 필드매핑 필터 |
| GET | `table-mappings/{id}/field-mappings/` | 특정 테이블 매핑의 필드매핑 목록 |
| GET/POST/PUT/DELETE | `field-mappings/` | 필드 매핑 CRUD |
| GET | `validations/` | 매핑 검증 이력(읽기 전용) |

## 4. KPI/데이터허브 API (`/api/data-hub/analytics/`)

| Method | URL | 설명 |
|---|---|---|
| GET/POST/PUT/DELETE | `definitions/` | KPI 정의 CRUD (`?domain=`으로 카테고리 필터) |
| GET | `definitions/categories/` | 카테고리 목록 |
| GET | `definitions/registry/` | KPI 레지스트리 조회 |
| POST | `definitions/sync_registry/` | 레지스트리 동기화 |
| POST | `definitions/bulk_calculate/` | 기간/필터 기반 일괄 재계산 |
| GET/POST/PUT/DELETE | `facts/` | KPI 실적(팩트) CRUD |
| GET | `facts/latest/` | 최신 실적(`plant`, `limit`) |
| GET | `facts/summary/` | 연/분기/월 단위 요약(`status_distribution`, `kpi_summary`, `total_facts`) |

## 5. 프로세스 통합(Integration Layer) API (`/api/data-hub/integration/`)

| Method | URL | 설명 |
|---|---|---|
| CRUD | `materials/`, `sales-orders/`, `production-orders/`, `quality-records/` | 마스터데이터 FK로 연결된 통합 O2C/P2P 엔티티 |
| GET | `process-chain/{product_code}/` | 품목코드 기준 수주→생산→품질→재고 4단계 체인 조회 |

## 6. 공통 응답 규격

```json
{
  "status": "success",
  "count": 10,
  "results": [ ... ]
}
```
단건 조회/생성/수정은 `"result": {...}` 키를 사용한다. 오류 응답은 `{"status": "error", "message": "...", "errors": {...}}` 형태를 따른다(개별 뷰마다 세부 편차 있음 — API.md 참조).

## 7. 프론트엔드 API 클라이언트 계약

`frontend/src/services/api.ts`의 `ApiService.get<T>(endpoint, {params})`는 **`T`를 직접 반환**한다(axios의 `{data: T}` 래핑을 사용하지 않음). 신규 서비스 파일 작성 시 `response.data` 형태로 접근하지 말고 반환값을 그대로 사용해야 한다 — 이 계약을 어긴 서비스 파일(`kpiService.ts`)에서 실제 런타임 크래시가 발생해 수정한 이력이 있다(04_테스트/테스트결과보고서.md TC-KPI-05 참조).
