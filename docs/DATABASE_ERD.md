# Claros MIS-AI Database ERD Technical Documentation

## Version Information
- **Document Version**: 1.0.0
- **Last Updated**: 2026-02-28
- **Database**: SQLite (Development), PostgreSQL (Production Recommended)

---

## Table of Contents
1. [Database Overview](#database-overview)
2. [Table List by Module](#table-list-by-module)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Table Definitions](#table-definitions)
5. [Relationships](#relationships)
6. [Indexes](#indexes)

---

## 1. Database Overview

### Database Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claros MIS Database                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Fact       │  │  Dimension  │  │  Application            │  │
│  │  Tables     │  │  Tables     │  │  Tables                 │  │
│  │  (팩트)     │  │  (마스터)   │  │  (업무)                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Module Structure

| Module | Tables | Purpose |
|--------|--------|---------|
| Financial (재무) | 3 | 재무제표, 재무비율, ERP 동기화 팩트 |
| Production (생산) | 8 | 생산실적, 설비관리, BOM 마스터 |
| Quality (품질) | 5 | 검사데이터, 불량기록, 공정능력 |
| Sales (영업) | 6 | 월별매출, 고객별, 영업팀 성과 |
| Purchase (구매) | 7 | 구매, 재고, 공급업체 관리 |
| Manufacturing (제조) | 6 | 작업장, 사이클타임, OEE, 다운타임 |
| Cost (원가) | 6 | 원가분석, 손익분기점, BOM |
| ESG (ESG경영) | 6 | 탄소배출, 에너지, 4M2E 지표 |
| Accounting (관리회계) | 6 | 예산vs실적, KPI성과, ROI분석 |
| Productivity (생산성) | 6 | 시간당생산, 라인가동률, OEE구성 |
| Development (개발) | 6 | R&D프로젝트, 특허, 기술로드맵 |
| Reports (리포트) | 6 | 경영진요약, 리스크/기회, 월간보고서 |
| Ontology (온톨로지) | 6 | 6M/4M2E 카테고리, 관계, ERP 맵핑 |
| **Total** | **79 tables** | |

---

## 2. Table List by Module

### 2.1 Financial Module (재무)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `financial_statements` | 재무제표 | App | 손익계산서, 재무상태표, 현금흐름표, 자본변동표 |
| `financial_ratios` | 재무비율 | App | ROE, ROA, 부채비율, 유동비율 등 |
| `fact_finance` | 재무팩트 | Fact | ERP 동기화 재무 데이터 (FIN300/400) |

### 2.2 Production Module (생산)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `production_lines` | 생산라인 | Dim | 라인별 마스터 정보 |
| `work_orders` | 작업지시서 | App | 작업지시 관리 |
| `daily_productions` | 일일생산실적 | App | 일일 생산 실적 데이터 |
| `equipment` | 설비 | App | 설비 마스터 |
| `fact_production` | 생산팩트 | Fact | ERP 동기화 생산 데이터 (PPC100) |
| `fact_equipment` | 설비가동팩트 | Fact | ERP 동기화 설비 데이터 (FAC300) |
| `dim_product` | 제품마스터 | Dim | 제품 기준 정보 (MAT100) |
| `dim_equipment` | 설비마스터 | Dim | 설비 기준 정보 (FAC200) |
| `dim_bom` | BOM | Dim | 자재 소요량 (MAT200) |

### 2.3 Quality Module (품질)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `quality_inspections` | 품질검사 | App | 입고/공정/최종 검사 데이터 |
| `defect_types` | 불량유형 | App | 불량 유형 분류 |
| `defect_records` | 불량기록 | App | 검사별 불량 상세 기록 |
| `customer_complaints` | 고객클레임 | App | 고객 클레임 관리 |
| `process_capabilities` | 공정능력 | App | CPK/PPK 지표 |
| `fact_quality` | 품질팩트 | Fact | ERP 동기화 품질 데이터 (QUA100) |

### 2.4 Sales Module (영업)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `sales_monthly` | 월별매출 | App | 월별 매출 요약 |
| `sales_product` | 제품별매출 | App | 제품별 매출 현황 |
| `sales_customer_tier` | 고객등급별매출 | App | 고객 등급별 매출 |
| `sales_pipeline` | 영업파이프라인 | App | 영업 기회 관리 |
| `sales_team_performance` | 영업팀성과 | App | 영업사원별 성과 |
| `sales_top_customer` | 주요거래처 | App | 상위 고객사 현황 |

### 2.5 Purchase Module (구매/자재)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `purchase_monthly` | 월별구매 | App | 월별 구매액 |
| `purchase_inventory` | 재고 | App | 현재 재고 현황 |
| `purchase_order` | 발주 | App | 발주 현황 |
| `purchase_supplier` | 공급업체 | App | 공급업체 평가 |
| `purchase_material_price` | 원자재가격 | App | 원자재 가격 동향 |
| `purchase_inventory_turnover` | 재고회전율 | App | 재고 회전율 분석 |
| `fact_inventory` | 재고팩트 | Fact | ERP 동기화 재고 데이터 (INV100) |

### 2.6 Manufacturing Module (제조)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `manufacturing_workshop_status` | 작업장현황 | App | 실시간 작업장 상태 |
| `manufacturing_cycle_time` | 사이클타임 | App | 공정별 사이클 타임 |
| `manufacturing_oee_metric` | OEE지표 | App | 설비종합효율 |
| `manufacturing_manpower_allocation` | 인력배치 | App | 조별 인력 배치 |
| `manufacturing_work_standard` | 작업표준 | App | 표준 작업 지시서 |
| `manufacturing_equipment_downtime` | 설비다운타임 | App | 설비 비가동 기록 |

### 2.7 Cost Module (원가)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `cost_monthly` | 월별원가 | App | 월별 원가 요약 |
| `cost_product` | 제품별원가 | App | 제품별 원가 분석 |
| `cost_reduction_project` | 원가절감프로젝트 | App | 원가 절감 활동 |
| `cost_driver` | 원가동인 | App | 원가 영향 요소 |
| `cost_break_even` | 손익분기점분석 | App | BEP 분석 |
| `cost_structure` | 원가구조 | App | 원가 구성 비율 |
| `fact_cost` | 원가팩트 | Fact | ERP 동기화 원가 데이터 (ACC200) |

### 2.8 ESG Module (ESG경영)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `esg_score` | ESG점수 | App | ESG 종합 점수 |
| `esg_carbon_emission` | 탄소배출량 | App | 온실가스 배출 현황 |
| `esg_energy_consumption` | 에너지소비 | App | 에너지원별 소비량 |
| `esg_4m2e_metric` | 4M2E지표 | App | 4M2E 지표 관리 |
| `esg_environmental_project` | 환경개선프로젝트 | App | ESG 개선 프로젝트 |
| `esg_social_responsibility` | 사회적책임활동 | App | 사회 공헌 활동 |
| `esg_governance_metric` | 지배구조지표 | App | 지배구조 평가 지표 |

### 2.9 Accounting Module (관리회계)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `accounting_budget_actual` | 예산vs실적 | App | 예산 대비 실적 |
| `accounting_department_profitability` | 부서별수익성 | App | 부서별 수익 분석 |
| `accounting_kpi_performance` | KPI성과 | App | KPI 달성 현황 |
| `accounting_financial_ratio` | 재무비율분석 | App | 재무비율 상세 분석 |
| `accounting_budget_allocation` | 예산배분 | App | 부서별 예산 배정 |
| `accounting_investment_roi` | 투자ROI | App | 투자 수익률 분석 |

### 2.10 Productivity Module (생산성)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `productivity_hourly_production` | 시간당생산량 | App | 시간별 생산 실적 |
| `productivity_line_utilization` | 라인가동률 | App | 라인별 가동률 |
| `productivity_worker` | 작업자생산성 | App | 작업자별 생산성 |
| `productivity_oee_component` | OEE구성요소 | App | OEE 세부 지표 |
| `productivity_efficiency` | 생산효율 | App | 효율 지표 |
| `productivity_daily_summary` | 일일생산요약 | App | 일일 생산 요약 |

### 2.11 Development Module (개발)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `development_rd_project` | R&D프로젝트 | App | R&D 프로젝트 관리 |
| `development_innovation_metric` | 혁신지표 | App | 혁신 활동 지표 |
| `development_patent` | 특허/지식재산권 | App | 특허 관리 |
| `development_rd_personnel` | R&D인력 | App | 연구 인력 현황 |
| `development_technology_roadmap` | 기술로드맵 | App | 기술 개발 로드맵 |
| `development_rd_budget` | R&D예산 | App | R&D 예산 관리 |

### 2.12 Reports Module (리포트)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `reports_executive_summary` | 경영진요약 | App | 경영진 보고서 요약 |
| `reports_department_comparison` | 부서별비교 | App | 부서별 성과 비교 |
| `reports_key_metric_summary` | 주요지표요약 | App | KPI 요약 리포트 |
| `reports_risk_opportunity` | 리스크/기회 | App | 리스크 및 기회 관리 |
| `reports_recommendation` | 권고사항 | App | 개선 권고 사항 |
| `reports_monthly` | 월간리포트 | App | 월간 경영 보고서 |

### 2.13 Ontology Module (온톨로지)

| Table Name | Korean Name | Type | Description |
|------------|-------------|------|-------------|
| `ontology_category` | 온톨로지카테고리 | App | 6M, 4M2E 카테고리 |
| `ontology_element` | 온톨로지요소 | App | Man, Machine 등 요소 |
| `ontology_erp_mapping` | ERP테이블맵핑 | App | ERP 테이블 연결 정보 |
| `ontology_relation` | 온톨로지관계 | App | 요소 간 관계 정의 |
| `ontology_data_flow_metrics` | 데이터흐름지표 | App | 데이터 흐름 모니터링 |
| `ontology_analysis_log` | 온톨로지분석로그 | App | 분석 실행 이력 |

---

## 3. Entity Relationship Diagram

### 3.1 Core ERD (Key Tables)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE ENTITY RELATIONSHIPS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐        ┌──────────────────┐                          │
│  │  dim_product     │        │ dim_equipment    │                          │
│  │  ─────────────   │        │ ──────────────   │                          │
│  │  product_id (PK) │        │ equipment_id(PK) │                          │
│  │  product_name    │        │ equipment_name   │                          │
│  │  standard_cost   │        │ plant            │                          │
│  │  selling_price   │        │ line             │                          │
│  └────────┬─────────┘        └────────┬─────────┘                          │
│           │                           │                                    │
│           │ product_id                │ equipment_id                        │
│           ▼                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐              │
│  │                    fact_production                        │              │
│  │                   ────────────────                        │              │
│  │  work_date (FK)       plant        line                    │              │
│  │  product_id (FK)      qty_plan     qty_actual              │              │
│  │                      qty_bad      efficiency              │              │
│  └──────────────────────────────────────────────────────────┘              │
│           │                           │                                    │
│           │                           │                                    │
│           ▼                           ▼                                    │
│  ┌──────────────────┐        ┌──────────────────┐                          │
│  │  fact_quality    │        │ fact_equipment   │                          │
│  │  ─────────────   │        │ ──────────────   │                          │
│  │  inspection_date │        │ operation_date   │                          │
│  │  product_id      │        │ equipment_id     │                          │
│  │  qty_inspected   │        │ availability     │                          │
│  │  defect_rate     │        │ performance      │                          │
│  └──────────────────┘        │ oee              │                          │
│                             └──────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Dimensional Model (Star Schema)

```
                    ┌─────────────────────────────────────┐
                    │         FACT_PRODUCTION              │
                    │        ────────────────               │
                    │  work_date (FK) │ plant (FK)        │
                    │  product_id (FK) │ line (FK)         │
                    │  qty_plan │ qty_actual │ efficiency   │
                    └─────┬─────────────┬─────────────┬─────┘
                          │             │             │
                ┌──────────┴─────┐ ┌─────┴─────┐ ┌───────┴───────┐
                │   date_dim     │ │ plant_dim │ │ line_dim     │
                │ ────────────   │ │ ───────   │ │ ──────────   │
                │ date           │ │ plant_id  │ │ line_id      │
                │ year           │ │ name      │ │ name         │
                │ month          │ │ location  │ │ capacity     │
                └───────────────┘ └───────────┘ └──────────────┘
                          │
                ┌─────────┴─────┐
                │ dim_product    │
                │ ────────────   │
                │ product_id     │
                │ product_name   │
                │ category       │
                │ standard_cost  │
                └───────────────┘
```

### 3.3 Sales Module ERD

```
┌─────────────────────────────────────────────────────────────────┐
│                       SALES MODULE ERD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   sales_monthly      │    │  sales_product       │          │
│  │   ──────────────     │    │  ───────────────     │          │
│  │   fiscal_year (FK)───┼────┼──fiscal_year (FK)    │          │
│  │   fiscal_month (FK)──┼────┼──fiscal_month (FK)   │          │
│  │   target_amount      │    │  product_code        │          │
│  │   actual_amount      │    │  sales_amount        │          │
│  │   achievement_rate   │    │  share_rate          │          │
│  └──────────────────────┘    └──────────────────────┘          │
│            │                           │                         │
│            │ fiscal_year, month         │                         │
│            ▼                           ▼                         │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │ sales_customer_tier  │    │ sales_pipeline       │          │
│  │ ────────────────     │    │ ───────────────      │          │
│  │ fiscal_year (FK)─────┼────┼─fiscal_year (FK)     │          │
│  │ fiscal_month (FK)─────┼────┼─fiscal_month (FK)    │          │
│  │ tier                  │    │ stage                │          │
│  │ customer_count        │    │ opportunity_count    │          │
│  └──────────────────────┘    └──────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Quality Module ERD

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUALITY MODULE ERD                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              quality_inspections                       │      │
│  │              ─────────────────────                    │      │
│  │  inspection_number (PK)                                │      │
│  │  inspection_date │ product_code │ lot_number           │      │
│  │  inspection_type │ sample_size │ defect_count         │      │
│  │  result         │ inspector                          │      │
│  └───────────────────────┬────────────────────────────────┘      │
│                          │                                        │
│                          │ inspection_id (FK)                     │
│                          ▼                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                defect_records                         │      │
│  │                ────────────────                        │      │
│  │  defect_type_id (FK) │ quantity │ location             │      │
│  └───────────────────────┬────────────────────────────────┘      │
│                          │                                        │
│                          │ defect_type_id (FK)                    │
│                          ▼                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                defect_types                           │      │
│  │                ─────────────                            │      │
│  │  code (PK) │ name │ severity │ description             │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │  customer_complaints  │    │ process_capabilities  │          │
│  │  ────────────────     │    │ ────────────────     │          │
│  │  complaint_number(PK) │    │ product_name          │          │
│  │  product_name         │    │ process_name          │          │
│  │  complaint_date       │    │ cpk │ ppk             │          │
│  └──────────────────────┘    └──────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Ontology Module ERD

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONTOLOGY MODULE ERD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐                                       │
│  │ ontology_category   │                                       │
│  │ ─────────────────    │                                       │
│  │ code (PK)            │◄──────────────┐                       │
│  │ name │ level        │               │                       │
│  │ parent_id (FK)      │               │                       │
│  └──────────┬──────────┘               │                       │
│             │ category_id (FK)          │                       │
│             ▼                          │                       │
│  ┌─────────────────────┐               │                       │
│  │  ontology_element   │               │                       │
│  │  ────────────────    │               │                       │
│  │  category_id (FK)───┼───────────────┘                       │
│  │  code │ name_ko      │                                       │
│  │  name_en │ color     │                                       │
│  └──────────┬──────────┘                                       │
│             │ element_id (FK)                                   │
│             ▼                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │ ontology_erp_mapping│    │ ontology_relation   │             │
│  │ ────────────────     │    │ ────────────────     │             │
│  │ element_id (FK)      │    │ source_element (FK)──┼─────────────┤
│  │ table_name           │    │ target_element (FK)──┼─────────────┤
│  │ key_columns           │    │ relation_type        │             │
│  └──────────────────────┘    └──────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Table Definitions

### 4.1 Dimension Tables (마스터 테이블)

#### `dim_product` (제품 마스터)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| product_id | Char(50) | N | PK | 제품코드 |
| product_name | VarChar(200) | N | | 제품명 |
| product_name_en | VarChar(200) | Y | | 제품명(영문) |
| category | Char(50) | Y | | 제품군 |
| product_type | Char(20) | Y | | 제품유형 |
| product_group | Char(50) | Y | | 제품그룹 |
| specification | VarChar(200) | Y | | 규격 |
| unit | Char(10) | N | | 단위 |
| weight | Decimal(10,3) | Y | | 중량 |
| standard_cost | Decimal(15,2) | Y | | 표준원가 |
| selling_price | Decimal(15,2) | Y | | 판매가 |
| is_active | Boolean | N | | 사용여부 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `dim_equipment` (설비 마스터)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| equipment_id | Char(50) | N | PK | 설비코드 |
| equipment_name | VarChar(200) | N | | 설비명 |
| plant | Char(10) | N | | 공장 |
| line | Char(20) | Y | | 라인 |
| location | VarChar(100) | Y | | 설치위치 |
| manufacturer | VarChar(100) | Y | | 제조사 |
| model | VarChar(100) | Y | | 모델명 |
| capacity | Decimal(10,2) | Y | | 생산능력 |
| install_date | Date | Y | | 설치일자 |
| acquisition_cost | Decimal(18,2) | Y | | 취득원가 |
| depreciation_cost | Decimal(18,2) | Y | | 감가상각비 |
| status | Char(20) | N | | 상태 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `dim_bom` (BOM 마스터)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| parent_product | Char(50) | N | IDX | 부모제품코드 |
| child_product | Char(50) | N | IDX | 자재제품코드 |
| quantity | Decimal(10,4) | N | | 소요량 |
| unit | Char(10) | N | | 단위 |
| level | Integer | N | | 레벨 |
| sequence | Integer | N | | 순서 |
| is_substitute | Boolean | N | | 대체품여부 |
| substitute_for | Char(50) | Y | | 대체대상 |
| valid_from | Date | N | | 유효시작일 |
| valid_to | Date | Y | | 유효종료일 |
| is_active | Boolean | N | | 사용여부 |
| source_id | Char(100) | N | UK | 원천ID |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

### 4.2 Fact Tables (팩트 테이블)

#### `fact_production` (생산 팩트)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| work_date | Date | N | IDX | 작업일 |
| plant | Char(10) | N | IDX | 공장 |
| line | Char(20) | N | | 라인 |
| product_id | Char(50) | N | IDX | 제품코드 |
| product_name | VarChar(200) | N | | 제품명 |
| qty_plan | Integer | N | | 계획수량 |
| qty_actual | Integer | N | | 실적수량 |
| qty_bad | Integer | N | | 불량수량 |
| qty_good | Integer | N | | 양품수량 |
| work_hours | Decimal(10,2) | Y | | 작업시간 |
| setup_time | Decimal(10,2) | Y | | 준비시간 |
| downtime | Decimal(10,2) | Y | | 비가동시간 |
| efficiency | Decimal(5,2) | Y | | 효율(%) |
| uph | Decimal(10,2) | Y | | 시간당생산량 |
| source_id | Char(100) | N | UK | 원천ID |
| synced_at | DateTime | N | | 동기화시각 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `fact_quality` (품질 팩트)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| inspection_date | Date | N | IDX | 검사일자 |
| inspection_type | VarChar(20) | N | | 검사구분 |
| product_id | Char(50) | N | IDX | 제품코드 |
| product_name | VarChar(200) | N | | 제품명 |
| lot_no | Char(50) | Y | IDX | LOT번호 |
| qty_inspected | Integer | N | | 검사수량 |
| qty_passed | Integer | N | | 합격수량 |
| qty_failed | Integer | N | | 불합격수량 |
| qty_rework | Integer | N | | 재작업수량 |
| defect_type | VarChar(50) | Y | | 불량유형 |
| defect_cause | VarChar(50) | Y | | 불량원인 |
| defect_rate | Decimal(5,2) | Y | | 불량률(%) |
| measured_value | Decimal(10,4) | Y | | 측정값 |
| spec_lower | Decimal(10,4) | Y | | 하한규격 |
| spec_upper | Decimal(10,4) | Y | | 상한규격 |
| inspector | VarChar(50) | Y | | 검사자 |
| source_id | Char(100) | N | UK | 원천ID |
| synced_at | DateTime | N | | 동기화시각 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `fact_finance` (재무 팩트)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| fiscal_month | Date | N | IDX | 회계월 |
| account_type | VarChar(20) | N | | 계정구분 |
| account_code | VarChar(50) | N | | 계정코드 |
| account_name | VarChar(200) | N | | 계정명 |
| amount | Decimal(18,2) | N | | 금액 |
| prev_amount | Decimal(18,2) | Y | | 전기금액 |
| revenue | Decimal(18,2) | Y | | 매출액 |
| cogs | Decimal(18,2) | Y | | 매출원가 |
| gross_profit | Decimal(18,2) | Y | | 매출총이익 |
| operating_profit | Decimal(18,2) | Y | | 영업이익 |
| net_profit | Decimal(18,2) | Y | | 당기순이익 |
| source_id | Char(100) | N | UK | 원천ID |
| synced_at | DateTime | N | | 동기화시각 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `fact_equipment` (설비 팩트)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| operation_date | Date | N | IDX | 가동일자 |
| equipment_id | Char(50) | N | IDX | 설비코드 |
| equipment_name | VarChar(200) | N | | 설비명 |
| plant | Char(10) | N | | 공장 |
| line | Char(20) | N | | 라인 |
| planned_time | Decimal(10,2) | N | | 계획시간 |
| actual_time | Decimal(10,2) | N | | 실가동시간 |
| downtime | Decimal(10,2) | N | | 비가동시간 |
| failure_count | Integer | N | | 고장횟수 |
| failure_time | Decimal(10,2) | Y | | 고장시간 |
| output_qty | Integer | N | | 생산수량 |
| defect_qty | Integer | N | | 불량수량 |
| availability | Decimal(5,2) | Y | | 가동률(%) |
| performance | Decimal(5,2) | Y | | 성능률(%) |
| quality_rate | Decimal(5,2) | Y | | 품질률(%) |
| oee | Decimal(5,2) | Y | | OEE(%) |
| source_id | Char(100) | N | UK | 원천ID |
| synced_at | DateTime | N | | 동기화시각 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `fact_inventory` (재고 팩트)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| inventory_date | Date | N | IDX | 재고일자 |
| warehouse | Char(20) | N | IDX | 창고 |
| location | VarChar(50) | Y | | 위치 |
| product_id | Char(50) | N | IDX | 제품코드 |
| product_name | VarChar(200) | N | | 제품명 |
| lot_no | Char(50) | Y | | LOT번호 |
| qty_on_hand | Integer | N | | 현재고 |
| qty_available | Integer | N | | 가용재고 |
| qty_reserved | Integer | N | | 예약재고 |
| qty_in_transit | Integer | N | | 입고예정 |
| unit_cost | Decimal(15,2) | N | | 단가 |
| total_value | Decimal(18,2) | N | | 총금액 |
| safety_stock | Integer | N | | 안전재고 |
| reorder_point | Integer | N | | 재주문점 |
| lead_time_days | Integer | N | | 리드타임(일) |
| source_id | Char(100) | N | UK | 원천ID |
| synced_at | DateTime | N | | 동기화시각 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `fact_cost` (원가 팩트)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| cost_month | Date | N | IDX | 원가월 |
| product_id | Char(50) | N | IDX | 제품코드 |
| product_name | VarChar(200) | N | | 제품명 |
| cost_center | Char(20) | Y | | 원가부문 |
| material_cost | Decimal(18,2) | N | | 재료비 |
| labor_cost | Decimal(18,2) | N | | 노무비 |
| overhead_cost | Decimal(18,2) | N | | 경비 |
| unit_cost | Decimal(15,2) | N | | 단위원가 |
| standard_cost | Decimal(15,2) | Y | | 표준원가 |
| variance | Decimal(15,2) | Y | | 원가차이 |
| variance_rate | Decimal(5,2) | Y | | 차이율(%) |
| output_qty | Integer | N | | 생산수량 |
| total_cost | Decimal(18,2) | N | | 총원가 |
| source_id | Char(100) | N | UK | 원천ID |
| synced_at | DateTime | N | | 동기화시각 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

### 4.3 Application Tables (업무 테이블)

#### `quality_inspections` (품질 검사)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| inspection_number | VarChar(50) | N | UK | 검사 번호 |
| inspection_type | VarChar(20) | N | | 검사 유형 |
| product_name | VarChar(200) | N | | 제품명 |
| product_code | VarChar(100) | N | | 제품 코드 |
| lot_number | VarChar(100) | N | | LOT 번호 |
| inspection_date | Date | N | IDX | 검사일자 |
| inspector | VarChar(100) | N | | 검사자 |
| sample_size | Integer | N | | 샘플 수량 |
| defect_count | Integer | N | | 불량 수량 |
| result | VarChar(20) | N | | 검사 결과 |
| notes | TextField | Y | | 비고 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `daily_productions` (일일 생산 실적)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| production_line_id | Integer | N | FK | 생산 라인 ID |
| production_date | Date | N | IDX | 생산일자 |
| target_quantity | Integer | N | | 목표 생산량 |
| actual_quantity | Integer | N | | 실제 생산량 |
| defect_quantity | Integer | N | | 불량 수량 |
| operating_hours | Decimal(5,2) | N | | 가동 시간 |
| downtime_hours | Decimal(5,2) | N | | 비가동 시간 |
| efficiency | Decimal(5,2) | N | | 생산 효율(%) |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

#### `sales_monthly` (월별 매출)

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|
| id | Integer | N | PK | ID |
| fiscal_year | Integer | N | IDX | 회계연도 |
| fiscal_month | Integer(1-12) | N | | 회계월 |
| target_amount | Decimal(15,2) | N | | 목표 매출 |
| actual_amount | Decimal(15,2) | N | | 실제 매출 |
| achievement_rate | Decimal(5,2) | N | | 달성률(%) |
| new_customers | Integer | N | | 신규 거래처 |
| contract_rate | Decimal(5,2) | N | | 계약 성사율(%) |
| pipeline_value | Decimal(15,2) | N | | 파이프라인 금액 |
| created_at | DateTime | N | | 생성일시 |
| updated_at | DateTime | N | | 수정일시 |

---

## 5. Relationships

### 5.1 Primary Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                      RELATIONSHIP RULES                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Production → Quality                                        │
│     production_lines.id → daily_productions.production_line_id   │
│     daily_productions → quality_inspections (by product/lot)     │
│                                                                  │
│  2. Product Dimension → All Facts                               │
│     dim_product.product_id →                                    │
│       ├─→ fact_production.product_id                            │
│       ├─→ fact_quality.product_id                               │
│       ├─→ fact_cost.product_id                                  │
│       └─→ fact_inventory.product_id                             │
│                                                                  │
│  3. Equipment Dimension → Equipment Fact                        │
│     dim_equipment.equipment_id → fact_equipment.equipment_id     │
│                                                                  │
│  4. BOM Relationships                                           │
│     dim_product.product_id → dim_bom.parent_product             │
│     dim_product.product_id → dim_bom.child_product              │
│                                                                  │
│  5. Ontology Structure                                          │
│     ontology_category.code → ontology_element.category_id       │
│     ontology_element.id → ontology_erp_mapping.element_id       │
│     ontology_element.id → ontology_relation.source_element      │
│     ontology_element.id → ontology_relation.target_element      │
│                                                                  │
│  6. Quality Inspection Records                                  │
│     quality_inspections.id → defect_records.inspection_id       │
│     defect_types.code → defect_records.defect_type_id           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Foreign Key Constraints

| Child Table | Child Column | Parent Table | Parent Column | On Delete |
|-------------|-------------|--------------|--------------|-----------|
| daily_productions | production_line_id | production_lines | id | CASCADE |
| defect_records | inspection_id | quality_inspections | id | CASCADE |
| defect_records | defect_type_id | defect_types | id | PROTECT |
| ontology_element | category_id | ontology_category | code | CASCADE |
| ontology_erp_mapping | element_id | ontology_element | id | CASCADE |
| ontology_relation | source_element | ontology_element | id | CASCADE |
| ontology_relation | target_element | ontology_element | id | CASCADE |

---

## 6. Indexes

### 6.1 Performance Indexes

#### Fact Table Indexes

```sql
-- fact_production
CREATE INDEX idx_fact_production_date_plant ON fact_production(work_date, plant);
CREATE INDEX idx_fact_production_product ON fact_production(product_id);

-- fact_quality
CREATE INDEX idx_fact_quality_date_type ON fact_quality(inspection_date, inspection_type);
CREATE INDEX idx_fact_quality_product ON fact_quality(product_id);
CREATE INDEX idx_fact_quality_lot ON fact_quality(lot_no);

-- fact_equipment
CREATE INDEX idx_fact_equipment_date_plant ON fact_equipment(operation_date, plant);
CREATE INDEX idx_fact_equipment_equipment ON fact_equipment(equipment_id);

-- fact_inventory
CREATE INDEX idx_fact_inventory_date_warehouse ON fact_inventory(inventory_date, warehouse);
CREATE INDEX idx_fact_inventory_product ON fact_inventory(product_id);

-- fact_finance
CREATE INDEX idx_fact_finance_month_type ON fact_finance(fiscal_month, account_type);
```

#### Dimension Table Indexes

```sql
-- dim_product
CREATE UNIQUE INDEX idx_dim_product_id ON dim_product(product_id);
CREATE INDEX idx_dim_product_category ON dim_product(category);

-- dim_equipment
CREATE UNIQUE INDEX idx_dim_equipment_id ON dim_equipment(equipment_id);
CREATE INDEX idx_dim_equipment_plant ON dim_equipment(plant);

-- dim_bom
CREATE INDEX idx_dim_bom_parent ON dim_bom(parent_product);
CREATE INDEX idx_dim_bom_child ON dim_bom(child_product);
```

---

## 7. Data Dictionary

### 7.1 Common Field Definitions

| Field Name | Data Type | Description | Valid Values |
|------------|-----------|-------------|--------------|
| fiscal_year | Integer | 회계연도 | 2020-2099 |
| fiscal_month | Integer | 회계월 | 1-12 |
| created_at | DateTime | 생성일시 | Auto-generated |
| updated_at | DateTime | 수정일시 | Auto-updated |

### 7.2 Enumerated Types

#### Inspection Type (검사 유형)
- `incoming`: 수입 검사
- `in_process`: 공정 검사
- `final`: 최종 검사
- `outgoing`: 출하 검사

#### Result (검사 결과)
- `pass`: 합격
- `fail`: 불합격
- `conditional`: 조건부 합격

#### Severity (심각도)
- `critical`: 치명적
- `major`: 중대
- `minor`: 경미

#### Status (공통 상태)
- `active`: 활성
- `inactive`: 비활성
- `draft`: 초안
- `completed`: 완료

---

## 8. Migration History

| Version | Date | Description |
|---------|------|-------------|
| 0001_initial | 2024-01-12 | Initial schema creation |
| 0002_fact_tables | 2024-01-15 | Added fact tables for ERP sync |
| 0003_dimension_tables | 2024-01-20 | Added dimension tables |
| 0004_ontology_tables | 2024-02-01 | Added ontology module tables |

---

## 9. Notes

1. **Database Version**: SQLite (development), PostgreSQL recommended for production
2. **Character Set**: UTF-8
3. **Timezone**: Asia/Seoul
4. **ERP Integration**: All fact tables support ERP synchronization via `source_id` and `synced_at` fields
5. **Data Retention**: Fact tables retain 5 years of data, dimension tables indefinitely

---

*This document is auto-generated from Django models. For the latest schema, run:*
```bash
python manage.py inspectdb > docs/schema.sql
```
