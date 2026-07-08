# DB설계서

**작성일**: 2026-07-08 | **버전**: 1.0
**DBMS**: SQLite(로컬 개발) / PostgreSQL(운영, `pgvector/pgvector:pg15`)

> 전체 테이블의 컬럼 단위 상세 정의는 프로젝트 루트 `DATABASE_SCHEMA.md`를 참조한다. 본 문서는 도메인별 핵심 테이블과 ERD 관계를 요약한다.

---

## 1. 도메인별 핵심 테이블

### 1.1 생산 (production)
| 테이블 | 주요 컬럼 | 관계 |
|---|---|---|
| `production_lines` | code(unique), name, location, capacity, is_active | `daily_productions`의 FK 대상 |
| `daily_productions` | production_line(FK), production_date, target_quantity, actual_quantity, defect_quantity, operating_hours, downtime_hours, efficiency | unique_together(production_line, production_date) |
| `work_orders` | order_number(unique), production_line(FK), product_code, target_quantity, status | |

### 1.2 품질 (quality)
| 테이블 | 주요 컬럼 |
|---|---|
| `quality_inspections` | inspection_number(unique), inspection_type(수입/공정/최종/출하), product_code, lot_number, inspection_date, inspector, sample_size, defect_count, result(pass/fail/conditional) |

### 1.3 영업 (sales)
| 테이블 | 주요 컬럼 |
|---|---|
| `sales_monthly` | fiscal_year, fiscal_month, target_amount, actual_amount, achievement_rate — unique_together(fiscal_year, fiscal_month) |
| `sales_top_customer` | fiscal_year, fiscal_month, customer_code, customer_name, revenue, growth_rate, status |
| `sales_product`, `sales_customer_tier`, `sales_pipeline`, `sales_team_performance` | 제품별/등급별/파이프라인/팀 실적 |

### 1.4 구매/재고 (purchase)
| 테이블 | 주요 컬럼 |
|---|---|
| `purchase_inventory` | item_code, item_name, category(A/B/C), current_stock, safety_stock, stock_value, turnover_rate, status(적정/부족/과다/긴급) |
| `purchase_monthly`, `purchase_material_price`, `purchase_inventory_turnover` | 월별 구매/자재단가/회전율 |

### 1.5 재무/원가/관리회계
| 앱 | 주요 테이블 |
|---|---|
| `financial` | `financial_statements`, `financial_ratios` |
| `cost` | `cost_monthly`, `cost_product`, `cost_driver`, `cost_break_even`, `cost_structure` |
| `accounting` | `accounting_budget_actual`, `accounting_department_profitability`, `accounting_kpi_performance`, `accounting_financial_ratio` |

### 1.6 경영보고 (reports)
| 테이블 | 주요 컬럼 |
|---|---|
| `reports_executive_summary` | fiscal_year, fiscal_month, revenue(억원), revenue_growth, operating_profit, operating_margin, net_profit, net_margin, production_volume, quality_rate, employee_count — unique_together(fiscal_year, fiscal_month) |
| `reports_department_comparison`, `reports_key_metric_summary`, `reports_monthly` | 부문비교/핵심지표/월간보고 |

### 1.7 제조/생산성/ESG/개발
| 앱 | 주요 테이블 |
|---|---|
| `manufacturing` | `manufacturing_cycle_time`, `manufacturing_oee_metric` |
| `productivity` | `productivity_hourly_production`, `line_utilization`, `worker`, `oee_component`, `efficiency`, `daily_summary` |
| `esg` | `esg_score`, `esg_carbon_emission`, `esg_energy_consumption`, `esg_4m2e_metric` |
| `development` | `development_innovation_metric` 등 R&D 관련 |

### 1.8 데이터허브/KPI (data_hub)
- `ERPTargetModel`/`ERPTargetField`: 8개 카테고리 80개 KPI를 포함한 분석 대상 모델/필드 메타데이터.
- KPI 팩트/정의 테이블: `analytics/definitions`, `analytics/facts` (연/분기/월 단위 실적, 목표, 달성률, 상태).

### 1.9 ERP 연동 (erp_sync) — 매핑 메타데이터
| 테이블 | 설명 |
|---|---|
| `ERPSource` | 외부 ERP 소스 정의(YH 등) |
| `ERPConnectionConfigModel` | 소스별 연결정보 + `is_enabled`/`use_fallback`/`fallback_source`(자기참조 FK) — **실질적 on/off 스위치** |
| `ERPTableDefinition` / `ERPFieldDefinition` | 소스 테이블/컬럼 카탈로그(실측 MSSQL introspection으로 채움) |
| `ERPTargetModel` / `ERPTargetField` | 타겟 Django 모델/필드 카탈로그(실측 Django introspection으로 채움) |
| `ERPTableMapping` / `ERPFieldMapping` | 소스↔타겟 매핑, `sync_priority`/`sync_type`/`transform_rule` 포함 |
| `ERPMappingValidation` | 매핑 검증 이력 |

## 2. ERD 관계 요약

```
ERPSource 1──* ERPTableDefinition 1──* ERPFieldDefinition
                     │                        │
                     │ 1                      │ 1
                     ▼ *                      ▼ *
              ERPTableMapping ────────* ERPFieldMapping
                     │ *                       │
                     ▼ 1                       ▼ 1
              ERPTargetModel 1──────* ERPTargetField

ERPConnectionConfigModel (self FK: fallback_source)

production_lines 1──* daily_productions
```

## 3. 명명 규칙

- 테이블명: snake_case, 앱 접두어 유지(`sales_monthly`, `production_lines` 등)
- 기간 컬럼: `fiscal_year`/`fiscal_month`(월별) 또는 단일 date 필드(일별) — `utils/timeseries_augmentation.py`가 이 규칙으로 대상 테이블을 자동 판별한다.
- 금액: 원 단위가 기본이나 `reports_executive_summary.revenue`처럼 "억원" 단위로 명시적으로 정의된 필드도 존재 — 필드 라벨(`verbose_name`)에 단위를 표기한다.
