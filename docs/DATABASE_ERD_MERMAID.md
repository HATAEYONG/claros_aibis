# Netplus MIS-AI Database ERD (Mermaid)

This document contains Mermaid diagrams that can be rendered in:
- GitHub/GitLab
- VS Code (with Mermaid extension)
- [Mermaid Live Editor](https://mermaid.live)

---

## 1. Module Overview

```mermaid
graph TB
    subgraph "Netplus MIS Database"
        FT[Fact Tables<br/>팩트 테이블]
        DT[Dimension Tables<br/>마스터 테이블]
        AT[Application Tables<br/>업무 테이블]

        FT --> FT1[6 팩트 테이블]
        DT --> DT1[3 마스터 테이블]
        AT --> AT1[70+ 업무 테이블]
    end

    subgraph "Fact Tables"
        FP[fact_production<br/>생산팩트]
        FQ[fact_quality<br/>품질팩트]
        FF[fact_finance<br/>재무팩트]
        FE[fact_equipment<br/>설비팩트]
        FI[fact_inventory<br/>재고팩트]
        FC[fact_cost<br/>원가팩트]
    end

    subgraph "Dimension Tables"
        DP[dim_product<br/>제품]
        DE[dim_equipment<br/>설비]
        DB[dim_bom<br/>BOM]
    end

    FT1 --> FP
    FT1 --> FQ
    FT1 --> FF
    FT1 --> FE
    FT1 --> FI
    FT1 --> FC

    DT1 --> DP
    DT1 --> DE
    DT1 --> DB
```

---

## 2. Core Relationships

```mermaid
erDiagram
    dim_product {
        string product_id PK "제품코드"
        string product_name "제품명"
        string category "제품군"
        decimal standard_cost "표준원가"
        decimal selling_price "판매가"
        boolean is_active "사용여부"
    }

    dim_equipment {
        string equipment_id PK "설비코드"
        string equipment_name "설비명"
        string plant "공장"
        string line "라인"
        string status "상태"
    }

    dim_bom {
        int id PK
        string parent_product FK "부모제품"
        string child_product FK "자재제품"
        decimal quantity "소요량"
        int level "레벨"
    }

    fact_production {
        int id PK
        date work_date "작업일"
        string plant "공장"
        string line "라인"
        string product_id FK "제품코드"
        int qty_plan "계획수량"
        int qty_actual "실적수량"
        int qty_bad "불량수량"
        decimal efficiency "효율(%)"
        string source_id UK "원천ID"
    }

    fact_quality {
        int id PK
        date inspection_date "검사일자"
        string inspection_type "검사구분"
        string product_id FK "제품코드"
        string lot_no "LOT번호"
        int qty_inspected "검사수량"
        int qty_passed "합격수량"
        int qty_failed "불합격수량"
        decimal defect_rate "불량률(%)"
    }

    fact_equipment {
        int id PK
        date operation_date "가동일자"
        string equipment_id FK "설비코드"
        decimal planned_time "계획시간"
        decimal actual_time "실가동시간"
        decimal downtime "비가동시간"
        decimal availability "가동률(%)"
        decimal performance "성능률(%)"
        decimal quality_rate "품질률(%)"
        decimal oee "OEE(%)"
    }

    fact_inventory {
        int id PK
        date inventory_date "재고일자"
        string warehouse "창고"
        string product_id FK "제품코드"
        int qty_on_hand "현재고"
        int qty_available "가용재고"
        decimal unit_cost "단가"
        decimal total_value "총금액"
        int safety_stock "안전재고"
    }

    fact_cost {
        int id PK
        date cost_month "원가월"
        string product_id FK "제품코드"
        decimal material_cost "재료비"
        decimal labor_cost "노무비"
        decimal overhead_cost "경비"
        decimal unit_cost "단위원가"
        decimal standard_cost "표준원가"
        decimal variance "원가차이"
    }

    dim_product ||--o{ fact_production : "produces"
    dim_product ||--o{ fact_quality : "inspects"
    dim_product ||--o{ fact_inventory : "stores"
    dim_product ||--o{ fact_cost : "costs"

    dim_equipment ||--o{ fact_equipment : "operates"

    dim_product ||--o{ dim_bom : "parent"
    dim_product ||--o{ dim_bom : "child"

    fact_production ||--o{ fact_quality : "correlates"
```

---

## 3. Module-wise ERD

### 3.1 Quality Module (품질)

```mermaid
erDiagram
    quality_inspections {
        int id PK
        string inspection_number UK "검사번호"
        date inspection_date "검사일자"
        string inspection_type "검사유형"
        string product_code "제품코드"
        string lot_number "LOT번호"
        int sample_size "샘플수량"
        int defect_count "불량수량"
        string result "결과"
        string inspector "검사자"
    }

    defect_types {
        int id PK
        string code UK "코드"
        string name "불량유형"
        string severity "심각도"
        string description "설명"
    }

    defect_records {
        int id PK
        int inspection_id FK "검사ID"
        int defect_type_id FK "불량유형ID"
        int quantity "불량수량"
        string location "발생위치"
        string corrective_action "시정조치"
    }

    customer_complaints {
        int id PK
        string complaint_number UK "클레임번호"
        date complaint_date "접수일자"
        string customer_name "고객명"
        string product_name "제품명"
        string description "내용"
        string severity "심각도"
        string status "처리상태"
    }

    process_capabilities {
        int id PK
        date measurement_date "측정일자"
        string product_name "제품명"
        string process_name "공정명"
        decimal usl "상한규격"
        decimal lsl "하한규격"
        decimal mean "평균"
        decimal std_dev "표준편차"
        decimal cpk "CPK"
    }

    quality_inspections ||--o{ defect_records : "has"
    defect_types ||--o{ defect_records : "categorizes"
```

### 3.2 Sales Module (영업)

```mermaid
erDiagram
    sales_monthly {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        decimal target_amount "목표매출"
        decimal actual_amount "실제매출"
        decimal achievement_rate "달성률"
        int new_customers "신규거래처"
        decimal contract_rate "계약성사율"
    }

    sales_product {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string product_code "제품코드"
        decimal sales_amount "매출액"
        int sales_quantity "판매수량"
        decimal share_rate "비중"
    }

    sales_customer_tier {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string tier "등급"
        int customer_count "고객수"
        decimal sales_amount "매출액"
    }

    sales_pipeline {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string stage "단계"
        int opportunity_count "기회건수"
        decimal total_value "총금액"
        decimal conversion_rate "전환율"
    }

    sales_team_performance {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string salesperson_name "영업사원명"
        decimal target_amount "목표"
        decimal actual_amount "실적"
        int deal_count "계약건수"
        decimal conversion_rate "성사율"
    }

    sales_top_customer {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string customer_code "거래처코드"
        string customer_name "거래처명"
        decimal revenue "매출액"
        string status "상태"
    }
```

### 3.3 Ontology Module (온톨로지)

```mermaid
erDiagram
    ontology_category {
        string code PK "카테고리코드"
        string name "카테고리명"
        int level "계층레벨"
        string parent_id FK "상위카테고리"
        int sort_order "정렬순서"
    }

    ontology_element {
        int id PK
        string category_id FK "카테고리코드"
        string code "요소코드"
        string name_ko "한글명"
        string name_en "영문명"
        string icon "아이콘"
        string color "색상코드"
    }

    ontology_erp_mapping {
        int id PK
        int element_id FK "온톨로지요소ID"
        string table_name "ERP테이블명"
        string table_description "테이블설명"
        json key_columns "주요컬럼"
        json link_columns "연계컬럼"
        string data_flow_direction "데이터흐름"
    }

    ontology_relation {
        int id PK
        int source_element_id FK "소스요소ID"
        int target_element_id FK "타겟요소ID"
        string relation_type "관계유형"
        decimal weight "가중치"
    }

    ontology_category ||--o{ ontology_element : "contains"
    ontology_category ||--o{ ontology_category : "parent_of"
    ontology_element ||--o{ ontology_erp_mapping : "mapped_to"
    ontology_element ||--o{ ontology_relation : "source_of"
    ontology_element ||--o{ ontology_relation : "target_of"
```

### 3.4 Cost Module (원가)

```mermaid
erDiagram
    cost_monthly {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        decimal total_cost "총원가"
        decimal unit_cost "단위당원가"
        decimal material_cost "직접재료비"
        decimal labor_cost "직접노무비"
        decimal overhead_cost "제조경비"
    }

    cost_product {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string product_code "제품코드"
        int production_volume "생산량"
        decimal material_cost "재료비"
        decimal labor_cost "노무비"
        decimal overhead_cost "경비"
        decimal total_cost "총원가"
        decimal margin "이익"
        decimal margin_rate "이익률"
    }

    cost_reduction_project {
        int id PK
        string project_id UK "프로젝트ID"
        string title "프로젝트명"
        string category "분류"
        decimal target_saving "목표절감액"
        decimal actual_saving "실제절감액"
        decimal progress "진척도"
        string status "상태"
    }

    cost_break_even {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        decimal fixed_cost "고정비"
        decimal variable_cost_ratio "변동비율"
        decimal break_even_point "손익분기점"
        decimal margin_of_safety "안전마진율"
    }

    cost_structure {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string cost_type "원가유형"
        decimal amount "금액"
        decimal ratio "비율"
    }
```

### 3.5 ESG Module (ESG경영)

```mermaid
erDiagram
    esg_score {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        decimal environment_score "환경점수"
        decimal social_score "사회점수"
        decimal governance_score "지배구조점수"
        decimal total_score "종합점수"
    }

    carbon_emission {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        decimal target_emission "목표배출량"
        decimal actual_emission "실제배출량"
        decimal reduction_rate "감축률"
    }

    energy_consumption {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string energy_source "에너지원"
        decimal consumption "소비량"
        decimal cost "비용"
    }

    four_m2e_metric {
        int id PK
        int fiscal_year "회계연도"
        int fiscal_month "회계월"
        string category "분류"
        string metric_name "지표명"
        decimal target_value "목표값"
        decimal actual_value "실제값"
        string status "상태"
    }

    environmental_project {
        int id PK
        string project_id UK "프로젝트ID"
        string title "프로젝트명"
        string category "분류"
        decimal investment "투자액"
        decimal saving "절감액"
        decimal progress "진척도"
    }
```

---

## 4. Data Flow Architecture

```mermaid
graph TB
    subgraph "ERP System"
        ERP1[PPC100<br/>생산실적]
        ERP2[QUA100<br/>품질검사]
        ERP3[FAC300<br/>설비가동]
        ERP4[MAT100<br/>제품마스터]
        ERP5[FIN300<br/>재무]
        ERP6[ACC200<br/>원가]
    end

    subgraph "ETL/Sync"
        ETL[(Django<br/>Management<br/>Commands)]
    end

    subgraph "MIS Database"
        subgraph "Fact Tables"
            FT1[fact_production]
            FT2[fact_quality]
            FT3[fact_equipment]
            FT4[fact_finance]
            FT5[fact_cost]
        end

        subgraph "Dimension Tables"
            DT1[dim_product]
            DT2[dim_equipment]
            DT3[dim_bom]
        end
    end

    subgraph "Analytics"
        AI[LocalAnalyzer<br/>Python Service]
        API[REST API<br/>Django DRF]
        FE[Frontend<br/>React Dashboard]
    end

    ERP1 --> ETL
    ERP2 --> ETL
    ERP3 --> ETL
    ERP4 --> ETL
    ERP5 --> ETL
    ERP6 --> ETL

    ETL --> FT1
    ETL --> FT2
    ETL --> FT3
    ETL --> FT4
    ETL --> FT5
    ETL --> DT1
    ETL --> DT2
    ETL --> DT3

    FT1 --> API
    FT2 --> API
    FT3 --> API
    FT4 --> API
    FT5 --> API
    DT1 --> API

    API --> FE
    FT1 --> AI
    FT2 --> AI
    FT3 --> AI

    AI --> API
```

---

## 5. 6M/4M2E Ontology Structure

```mermaid
mindmap
    root((Ontology))
        6M[6M 변경관리]
            Man[Man<br/>인력]
                Worker[작업자]
                Skill[숙련도]
                Training[교육]
            Machine[Machine<br/>설비]
                Equipment[설비]
                Maintenance[보전]
                Capacity[생산능력]
            Material[Material<br/>자재]
                RawMaterial[원자재]
                Supplier[공급사]
                Quality[품질]
            Method[Method<br/>방법]
                Process[공정]
                Standard[표준]
                Procedure[절차]
            Measurement[Measurement<br/>측정]
                Inspection[검사]
                Data[데이터]
                Analysis[분석]
            MotherNature[Mother Nature<br/>환경]
                Temperature[온도]
                Humidity[습도]
                Cleanliness[청결도]
        4M2E[4M2E 제조관리]
            Man[Man]
            Machine[Machine]
            Material[Material]
            Method[Method]
            Environment[Environment<br/>환경]
            Energy[Energy<br/>에너지]
        Cost[원가관리]
            DirectMaterial[직접재료비]
            DirectLabor[직접노무비]
            Overhead[제조경비]
        Finance[재무관리]
            Revenue[매출]
            Expense[비용]
            Profit[이익]
        ESG[ESG경영]
            Environment[환경]
            Social[사회]
            Governance[지배구조]
```

---

## 6. Complete Module Map

```mermaid
graph TB
    subgraph "Netplus MIS-AI Dashboard"
        direction TB

        subgraph "Financial Module"
            FM1[Financial Statements]
            FM2[Financial Ratios]
            FM3[Fact Finance]
        end

        subgraph "Production Module"
            PM1[Production Lines]
            PM2[Work Orders]
            PM3[Daily Productions]
            PM4[Equipment]
            PM5[Fact Production]
            PM6[Fact Equipment]
            PM7[Dim Product]
            PM8[Dim Equipment]
            PM9[Dim BOM]
        end

        subgraph "Quality Module"
            QM1[Quality Inspections]
            QM2[Defect Types]
            QM3[Defect Records]
            QM4[Customer Complaints]
            QM5[Process Capabilities]
            QM6[Fact Quality]
        end

        subgraph "Sales Module"
            SM1[Sales Monthly]
            SM2[Sales Product]
            SM3[Sales Customer Tier]
            SM4[Sales Pipeline]
            SM5[Sales Team Performance]
            SM6[Top Customer]
        end

        subgraph "Purchase Module"
            PUM1[Purchase Monthly]
            PUM2[Inventory]
            PUM3[Purchase Order]
            PUM4[Supplier]
            PUM5[Material Price]
            PUM6[Inventory Turnover]
            PUM7[Fact Inventory]
        end

        subgraph "Manufacturing Module"
            MM1[Workshop Status]
            MM2[Cycle Time]
            MM3[OEE Metric]
            MM4[Manpower Allocation]
            MM5[Work Standard]
            MM6[Equipment Downtime]
        end

        subgraph "Cost Module"
            CM1[Monthly Cost]
            CM2[Product Cost]
            CM3[Cost Reduction Project]
            CM4[Cost Driver]
            CM5[Breakeven Analysis]
            CM6[Cost Structure]
            CM7[Fact Cost]
        end

        subgraph "ESG Module"
            EM1[ESG Score]
            EM2[Carbon Emission]
            EM3[Energy Consumption]
            EM4[4M2E Metric]
            EM5[Environmental Project]
            EM6[Social Responsibility]
            EM7[Governance Metric]
        end

        subgraph "Accounting Module"
            AM1[Budget vs Actual]
            AM2[Department Profitability]
            AM3[KPI Performance]
            AM4[Financial Ratio Analysis]
            AM5[Budget Allocation]
            AM6[Investment ROI]
        end

        subgraph "Productivity Module"
            PRM1[Hourly Production]
            PRM2[Line Utilization]
            PRM3[Worker Productivity]
            PRM4[OEE Component]
            PRM5[Production Efficiency]
            PRM6[Daily Summary]
        end

        subgraph "Development Module"
            DM1[R&D Project]
            DM2[Innovation Metric]
            DM3[Patent]
            DM4[R&D Personnel]
            DM5[Technology Roadmap]
            DM6[R&D Budget]
        end

        subgraph "Reports Module"
            RM1[Executive Summary]
            RM2[Department Comparison]
            RM3[Key Metric Summary]
            RM4[Risk/Opportunity]
            RM5[Recommendation]
            RM6[Monthly Report]
        end

        subgraph "Ontology Module"
            OM1[Ontology Category]
            OM2[Ontology Element]
            OM3[ERP Mapping]
            OM4[Ontology Relation]
            OM5[Data Flow Metrics]
            OM6[Analysis Log]
        end
    end
```

---

## 7. Star Schema Pattern

```mermaid
erDiagram
    %% Central Fact Table
    fact_production {
        int id PK
        date work_date FK
        string plant FK
        string line FK
        string product_id FK
        int qty_plan
        int qty_actual
        decimal efficiency
    }

    %% Dimension Tables
    dim_date {
        date date PK
        int year
        int month
        int quarter
        string day_of_week
    }

    dim_plant {
        string plant_id PK
        string plant_name
        string location
        string manager
    }

    dim_line {
        string line_id PK
        string line_name
        string plant_id FK
        int capacity
    }

    dim_product {
        string product_id PK
        string product_name
        string category
        string group_name
    }

    %% Relationships
    fact_production }o--|| dim_date : "work_date"
    fact_production }o--|| dim_plant : "plant"
    fact_production }o--|| dim_line : "line"
    fact_production }o--|| dim_product : "product_id"
    dim_line }o--|| dim_plant : "plant_id"
```

---

## Notes

1. **PK**: Primary Key
2. **FK**: Foreign Key
3. **UK**: Unique Key
4. **IDX**: Indexed Column

To render these diagrams:
- Save as `.md` file
- Open in GitHub/GitLab
- Or use VS Code with Mermaid extension
- Or visit https://mermaid.live
