# Claros MIS-AI Dashboard - ERD (Entity Relationship Diagram)

> 시스템 데이터베이스 구조 및 PK/FK 분석 문서

---

## 1. ERD 개요

### 1.1 데이터베이스 아키텍처 유형

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERP 시스템 레이어                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ SAP ERP │  │  FOM ERP  │  │  AXOS ERP │                      │
│  │(Yuhan)  │  │(MSSQL)  │  │(Oracle)  │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼────────────┼─────────────┼──────────────────────────┘
        │            │                │
        └────────────┴────────────────┘
                           │
                ┌──────────▼──────────┐
                │   ERP 연동 레이어    │
                └──────────┬──────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────┐  ┌──────────────┐  ┌──────▼─────────┐
│  데이터 허브   │  │    이벤트    │  │   AI/Agent    │
│  (ODS/DS)     │  │   시스템      │  │   프레임워크   │
└───────┬────────┘  └──────────────┘  └──────┬─────────┘
        │                                   │
        └──────────────┬────────────────┘
                       │
            ┌────────────▼────────────┐
            │   팩트/분석 테이블    │
            │  (Fact Tables)       │
            └────────────┬────────────┘
                       │
            ┌────────────▼────────────┐
            │    차원 테이블          │
            │  (Dim Tables)         │
            └─────────────────────────┘
```

### 1.2 테이블 분류

| 카테고리 | 테이블 수 | 비율 | 설명 |
|----------|----------|------|------|
| **핵심 업무 테이블** | 45 | 45% | 생산, 품질, 재무, 영업, 구매 등 |
| **참조/마스터 테이블** | 20 | 20% | 제품, 설비, 협력사, 공정 기준 |
| **AI/Agent 테이블** | 15 | 15% | 이벤트, 추천, 정책, 지식 그래프 |
| **연동/ERP 테이블** | 12 | 12% | ERP 소스, 매핑, 동기화 |
| **보고서/분석 테이블** | 8 | 8% | 대시보드, KPI, 리포트 |

---

## 2. 핵심 업무 영역 ERD

### 2.1 생산 관리 (Production)

```
┌──────────────────┐       PK: id (Auto)
│  PRODUCTION_LINE   │
│  (생산 라인)      │
│  - code           │       Unique: code
│  - name           │       FK: → equipment
│  - location       │
└────────┬─────────┘
         │ 1:N
         ├──────────────────────────────────────────┐
         │                                         │
    ┌────▼─────────┐                    ┌─────▼───────┐
    │  WORK_ORDER    │                    │ EQUIPMENT   │
    │  (작업 지시서) │                    │  (설비)      │
    │  - order_number│                    │  - code      │
    │  - production  │  PK: id (Auto)       │  - name      │
    │  - status      │  FK: → production_line│  - model     │
    └────────────────┘                    └─────────────┘
         │
    ┌────▼─────────┐
    │DAILY_PRODUCTION│
    │  (일일 생산실적) │  PK: id (Auto)
    │  - work_date   │  FK: → production_line
    │  - quantity    │
    └────────────────┘
```

### 2.2 품질 관리 (Quality)

```
┌───────────────────┐
│ QUALITY_INSPECTION│  PK: id (Auto)
│  (품질 검사)      │   Unique: inspection_number
│  - inspection_num │
│  - inspection_date│
└────────┬──────────┘
         │ 1:N
         │
    ┌────▼──────────────┐
    │ DEFECT_RECORD       │  PK: id (Auto)
    │ (불량 기록)         │  FK: → inspection (CASCADE)
    │  - defect_date      │      → defect_type (PROTECT)
    │  - quantity         │
    └────┬──────────────┘
         │
         │ 1:N
         │
    ┌────▼──────────┐
    │ DEFECT_TYPE    │  PK: code (Unique)
    │ (불강 유형)    │  FK: → defect_records
    │  - code         │
    │  - name         │
    │  - category     │
    └─────────────────┘
```

### 2.3 재무/회계 (Financial & Accounting)

```
┌──────────────────────┐
│  FINANCIAL_STATEMENT │  PK: (statement_type, fiscal_year, fiscal_month)
│  (재무제표)           │   Composite Key
│  - statement_type     │
│  - fiscal_year       │
│  - fiscal_month      │
│  - revenue           │
│  - expense           │
└──────────────────────┘
         │
    ┌────▼────────────────────┐
    │ FACT_FINANCE           │  PK: id (Auto)
    │ (재무 팩트 테이블)      │  FK: None (Denormalized)
    │  - fiscal_month        │
    │  - account_code        │
    │  - amount             │
    └────────────────────────┘
```

### 2.4 원가 관리 (Cost Management)

```
┌──────────────────────┐
│  PRODUCT_COST          │  PK: id (Auto)
│  (제품 원가)           │
│  - product_id         │
│  - material_cost       │
│  - labor_cost         │
│  - overhead_cost      │
└──────────────────────┘
         │
    ┌────▼────────────────────┐
    │ FACT_COST              │  PK: id (Auto)
    │ (원가 팩트 테이블)       │  FK: None (Denormalized)
    │  - cost_type            │
    │  - cost_center          │
    │  - amount               │
    └────────────────────────┘
```

### 2.5 구매/자재 (Purchase & Inventory)

```
┌──────────────────────┐       PK: supplier_code (Unique)
│  SUPPLIER              │
│  (협력사)              │
│  - supplier_code      │
│  - name               │
│  - contact            │
└──────────────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │                                        │
┌─────▼──────────┐  ┌──────────────┐  ┌──────▼─────────┐
│ PURCHASE_ORDER │  │   INVENTORY  │  │ FACT_INVENTORY  │
│  (구매 주문)   │  │  (재고)      │  │ (재고 팩트)     │
│  - id          │  │  - id        │  │  - id           │
│  - supplier_id │  │  - product_id│  │  - warehouse_id  │
└────────────────┘  └──────────────┘  └─────────────────┘
```

---

## 3. AI/Agent 프레임워크 ERD

### 3.1 이벤트 시스템

```
┌──────────────────┐       PK: event_id (UUID)
│  EVENT               │
│  (이벤트)            │   Unique: event_id
│  - event_id          │   Indexes: event_type, severity, status
│  - event_type        │
│  - severity          │
│  - status            │
└────────┬──────────┘
         │ 1:N
         │
    ┌────▼──────────────────────┐
    │ EVENT_CORRELATION         │  PK: correlation_id (UUID)
    │ (이벤트 상관분석)        │  FK: source_event_id (CASCADE)
    │  - source_event_id        │      → target_event_id (CASCADE)
    │  - target_event_id        │  Unique: (source, target)
    │  - correlation_score     │
    └────────────────────────────┘
```

### 3.2 AI Agent 시스템

```
┌──────────────────┐
│  AGENT_RUN_LOG       │  PK: request_id (UUID)
│  (AI 실행 로그)      │   Indexes: agent_name, status, created_at
│  - request_id        │
│  - agent_name        │
│  - status            │
└────────┬──────────┘
         │ 1:N
         │
    ┌────▼──────────────────────────┐
    │ REFLECTION_LOG                │  PK: reflection_id (UUID)
    │ (AI 학습 로그)                │  FK: agent_run_id (CASCADE)
    │  - reflection_id              │
    │  - learning_type              │
    │  - insights                    │
    └──────────────────────────────┘
```

### 3.3 지식 그래프 (Knowledge Graph)

```
┌──────────────────┐       PK: node_id (UUID)
│  ONTOLOGY_NODE       │
│  (온톨로지 노드)      │   Indexes: node_type, category
│  - node_id           │
│  - node_type         │
│  - name              │
│  - properties        │
└────────┬──────────┘
         │ 1:N (self-referential)
         │
    ┌────▼──────────────────────────┐
    │ ONTOLOGY_EDGE                 │  PK: edge_id (UUID)
    │ (온톨로지 관계)               │  FK: source_node_id (CASCADE)
    │  - edge_id                     │      → target_node_id (CASCADE)
    │  - source_node_id             │  Unique: (source, target, type)
    │  - target_node_id             │
    │  - relationship_type           │
    └──────────────────────────────┘
```

---

## 4. ERP 연동 ERD

### 4.1 ERP 매핑 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERP 시스템 레이어                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                                │
│  │ SAP ERP  │  │  FOM ERP  │  │  AXOS ERP │                                │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                                │
└───────┼────────────┼─────────────┼────────────────────────────────────┘
        │            │                │
        └────────────┴────────────────┘
                           │
                ┌──────────▼──────────┐
                │   ERP_SOURCE        │  PK: erp_source_id
                │   (ERP 소스 정의)   │
                └──────────┬──────────┘
                           │ 1:N
                ┌──────────▼──────────┐
                │ ERP_TABLE_DEFINITION │  PK: table_id
                │ (ERP 테이블 정의)    │  FK: → erp_source
                └──────────┬──────────┘
                           │ 1:N
                ┌──────────▼──────────┐
                │ ERP_FIELD_DEFINITION│  PK: field_id
                │ (ERP 필드 정의)     │  FK: → table_definition
                └──────────┬──────────┘
                           │
                ┌──────────▼───────────────────────────────┐
                │          ERP_TABLE_MAPPING                │
                │          (ERP → Django 매핑)            │
                │  - erp_table_definition (FK)              │
                │  - erp_target_model (FK)                  │
                └──────────┬───────────────────────────────┘
                           │
                ┌──────────▼───────────────────────────────┐
                │          ERP_FIELD_MAPPING                │
                │          (필드 단위 매핑)                  │
                │  - table_mapping (FK)                     │
                │  - erp_field_definition (FK)             │
                │  - erp_target_field (FK)                  │
                └──────────────────────────────────────────┘
```

---

## 5. Primary Key (PK) 분석

### 5.1 PK 유형별 분류

| PK 유형 | 테이블 수 | 비율 | 예시 |
|---------|----------|------|------|
| **Auto-Increment Integer** | 70 | 70% | `id = models.AutoField(primary_key=True)` |
| **UUID** | 15 | 15% | `event_id = models.UUIDField(primary_key=True)` |
| **Natural Key** | 10 | 10% | `code = models.CharField(max_length=50, primary_key=True)` |
| **Composite Key** | 5 | 5% | `unique_together = ['fiscal_year', 'fiscal_month']` |

### 5.2 PK 설계 패턴

```python
# 패턴 1: Auto-Increment (Django 기본값)
class WorkOrder(models.Model):
    id = models.AutoField(primary_key=True)
    order_number = models.CharField(max_length=50, unique=True)

# 패턴 2: Natural Key (비즈니스 식별자)
class ProductionLine(models.Model):
    code = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)

# 패턴 3: UUID (분산 시스템, AI 연산)
class Event(models.Model):
    event_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    event_type = models.CharField(max_length=50)

# 패턴 4: Composite Key (복합 키)
class FinancialStatement(models.Model):
    statement_type = models.CharField(max_length=20)
    fiscal_year = models.IntegerField()
    fiscal_month = models.IntegerField()

    class Meta:
        unique_together = ['statement_type', 'fiscal_year', 'fiscal_month']
```

---

## 6. Foreign Key (FK) 분석

### 6.1 FK 관계 유형별 분류

| 관계 유형 | 수량 | CASCADE | PROTECT | SET_NULL | RESTRICT |
|-----------|------|---------|---------|----------|----------|
| **1:N (Composition)** | 60 | 70% | 15% | 10% | 5% |
| **1:N (Reference)** | 20 | 20% | 60% | 15% | 5% |
| **N:1 (Aggregation)** | 10 | 30% | 10% | 50% | 10% |
| **M:N (Self-Referential)** | 5 | 100% | 0% | 0% | 0% |
| **M:N (Many-to-Many)** | 5 | N/A | N/A | N/A | N/A |

### 6.2 주요 FK 관계 매트릭스

| 부모 테이블 | 자식 테이블 | 관계 유형 | ON_DELETE |
|-------------|----------|----------|-----------|
| ProductionLine | WorkOrder | 1:N | CASCADE |
| ProductionLine | Equipment | 1:N | CASCADE |
| QualityInspection | DefectRecord | 1:N | CASCADE |
| DefectType | DefectRecord | 1:N | PROTECT |
| Event (source) | EventCorrelation | 1:N | CASCADE |
| Event (target) | EventCorrelation | 1:N | CASCADE |
| AgentRunLog | ReflectionLog | 1:N | CASCADE |
| Document | DocumentChunk | 1:N | CASCADE |
| OntologyNode | OntologyEdge (source) | 1:N | CASCADE |
| OntologyNode | OntologyEdge (target) | 1:N | CASCADE |
| PolicyRule | PolicyViolation | 1:N | CASCADE |
| Recommendation | ApprovalRequest | 1:N (nullable) | SET_NULL |

### 6.3 FK 제약 조건 (ON_DELETE) 정책

```python
# CASCADE: 부모 삭제 시 자식도 삭제 (60%)
production_line = models.ForeignKey(
    ProductionLine,
    on_delete=models.CASCADE,
    related_name='work_orders'
)

# PROTECT: 참조 중이면 삭제 불가 (15%)
defect_type = models.ForeignKey(
    DefectType,
    on_delete=models.PROTECT,
    related_name='defects'
)

# SET_NULL: 부모 삭제 시 NULL 설정 (10%)
owner = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    related_name='data_marts'
)

# RESTRICT: Django 기본값 (5%)
# 참조하는 레코드가 있으면 삭제 불가
```

---

## 7. 관계 유형 다이어그램

### 7.1 핵심 도메인 관계도

```
                    ┌─────────────┐
                    │   제조     │
                    │  Production │
                    └──────┬──────┘
                           │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌───▼────┐   ┌───▼────────┐
    │ 품질    │   │  설비  │   │   자재      │
    │ Quality │   │Equipment│   │  Material   │
    └────┬────┘   └─────────┘   └─────────────┘
         │
    ┌────▼────┐
    │  원가    │
    │  Cost   │
    └────┬────┘
         │
    ┌────▼────┐
    │ 재무/회계│
    │Finance  │
    └────┬────┘
         │
    ┌────▼────┐
    │   ESG   │
    └─────────┘
```

### 7.2 데이터 흐름 관계도

```
┌──────────────┐
│  ERP 데이터   │
│  (외부 시스템)│
└──────┬───────┘
       │ ERP Sync
       ▼
┌──────────────┐
│  ODS 레이어   │
│  (데이터 허브)│
└──────┬───────┘
       │ Extract
       ▼
┌──────────────┐
│  Fact 테이블  │
│  (팩트 테이블) │
└──────┬───────┘
       │ Transform
       ▼
┌──────────────┐
│  Dimension    │
│  (차원 테이블) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  분석/리포트  │
└──────────────┘
```

---

## 8. 인덱스 설계 분석

### 8.1 단일 컬럼 인덱스

| 테이블 | 인덱스 필드 | 목적 |
|-------|-----------|------|
| `work_orders` | `order_number` | 작업 지시번호 고속 조회 |
| `work_orders` | `production_line_id` | 생산 라인별 작업 조회 |
| `defect_records` | `inspection_id` | 검사별 불량 조회 |
| `events` | `event_type, severity, status` | 이벤트 필터링 |
| `events` | `event_time` | 시간대별 이벤트 조회 |
| `fact_production` | `work_date, plant` | 날짜/공장별 생산 조회 |
| `fact_production` | `product_id` | 제품별 생산 조회 |
| `erp_table_mapping` | `erp_table_definition_id` | ERP 테이블별 매핑 조회 |
| `erp_field_mapping` | `table_mapping_id` | 매핑별 필드 조회 |

### 8.2 복합 인덱스

| 테이블 | 인덱스 필드 | 목적 |
|-------|-----------|------|
| `fact_production` | `work_date, plant, product_id` | 복합 필터링 |
| `fact_equipment` | `operation_date, plant, equipment_id` | 설비 모니터링 |
| `fact_quality` | `inspection_date, product_id, lot_no` | 품질 추적 |
| `fact_inventory` | `inventory_date, warehouse, product_id` | 재고 조회 |

---

## 9. 데이터 무결성성 제약조건

### 9.1 무결성성 규칙

| 유형 | 제약조건 | 예시 |
|------|----------|------|
| **Entity Integrity** | PK uniqueness | `id` 필드는 고유해야 함 |
| **Referential Integrity** | FK relationship | 부모가 존재해야 자식 생성 가능 |
| **Domain Integrity** | Data type/Value | ENUM 값, 숫자 범위 등 |
| **User-Defined Integrity** | Business rules | `order_number` 형식, 검사 수량 등 |

### 9.2 주요 무결성성 제약

```python
# UNIQUE 제약 (고유성)
class ProductionLine(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "생산 라인"
        ordering = ['code']

# CHECK 제약 (데이터 유효성)
class WorkOrder(models.Model):
    quantity = models.IntegerField()

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError("수량은 0보다 커야 합니다.")

# ForeignKey 제약 (참조 무결성성)
class DefectRecord(models.Model):
    inspection = models.ForeignKey(
        QualityInspection,
        on_delete=models.CASCADE,  # 검사 삭제 시 불량도 삭제
        related_name='defects'
    )
```

---

## 10. 성능 최적화 고려사항

### 10.1 인덱스 전략

1. **FK 컬럼 인덱싱**: 모든 FK 컬럼에 인덱스 생성
2. **복합 인덱스**: 자주 조회되는 컬럼 조합으로 인덱스 생성
3. **파티셔닝**: 대형 팩트 테이블 날짜 기준 파티셔닝 고려

### 10.2 조회 최적화

```python
# N+1 문제 해결을 위한 select_related
work_orders = WorkOrder.objects.select_related(
    'production_line',
    'product'
).all()

# prefetch_related를 통한 M:N 관계 최적화
inspections = QualityInspection.objects.prefetch_related(
    'defect_records__defect_type'
).all()
```

---

## 11. ERD 시각화 (Mermaid)

```mermaid
erDiagram
    PRODUCTION_LINE ||--o{ WORK_ORDER : "contains"
    PRODUCTION_LINE ||--o{ DAILY_PRODUCTION : "tracks"
    PRODUCTION_LINE ||--o{ EQUIPMENT : "houses"

    QUALITY_INSPECTION ||--o{ DEFECT_RECORD : "identifies"}
    DEFECT_TYPE ||--o{ DEFECT_RECORD : "categorizes"}

    EVENT ||--o{ EVENT_CORRELATION : "correlates_with"}
    EVENT ||--o{ EVENT_CORRELATION : "correlates_with"}

    AGENT_RUN_LOG ||--o{ REFLECTION_LOG : "generates"}

    POLICY_RULE ||--o{ POLICY_VIOLATION : "detects"}

    DOCUMENT ||--o{ DOCUMENT_CHUNK : "contains"}

    ONTOLOGY_NODE ||--o{ ONTOLOGY_EDGE : "connects_to"
    ONTOLOGY_EDGE ||--o{ ONTOLOGY_NODE : "connects_from"

    ERP_SOURCE ||--o{ ERP_TABLE_DEFINITION : "defines"}
    ERP_TABLE_DEFINITION ||--o{ ERP_FIELD_DEFINITION : "details"}
    ERP_TABLE_DEFINITION ||--o{ ERP_TABLE_MAPPING : "maps_to"}
    ERP_TARGET_MODEL ||--o{ ERP_TABLE_MAPPING : "maps_from"}
    ERP_TABLE_MAPPING ||--o{ ERP_FIELD_MAPPING : "specifies"}
```

---

## 12. 요약 통계

### 12.1 PK/FK 구성 통계

| 항목 | 수량 | 비율 |
|------|------|------|
| **전체 모델 수** | 100+ | 100% |
| **PK: Auto-Increment** | 70 | 70% |
| **PK: UUID** | 15 | 15% |
| **PK: Natural Key** | 10 | 10% |
| **PK: Composite Key** | 5 | 5% |
| **FK 관계 수** | 85+ | 100% |
| **CASCADE 관계** | 50 | 60% |
| **PROTECT 관계** | 15 | 18% |
| **SET_NULL 관계** | 12 | 14% |

### 12.2 도메인별 모델 분류

| 도메인 | 모델 수 | 주요 PK/FK 특징 |
|--------|---------|------------------|
| Production | 8 | Auto-increment PK, CASCADE FK |
| Quality | 5 | Auto-increment PK, PROTECT for reference data |
| Financial | 6 | Composite PK for time-series |
| Cost | 5 | Auto-increment PK |
| Purchase | 8 | Natural PK for suppliers |
| Manufacturing | 4 | Auto-increment PK |
| Accounting | 4 | Auto-increment PK |
| Sales | 5 | Auto-increment PK |
| ESG | 3 | Auto-increment PK |
| Events | 5 | UUID PK for distributed events |
| AI Agents | 8 | UUID PK for AI operations |
| ERP Sync | 8 | Auto-increment PK |
| Knowledge Graph | 3 | UUID PK for graph entities |

---

*이 ERD 문서는 Claros MIS-AI Dashboard 시스템의 데이터베이스 구조를 체계적으로 분석한 것입니다.*
