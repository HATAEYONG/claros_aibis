# AI & BI DeepSeeHub Platform 기술문서

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [인프라 구성](#3-인프라-구성)
4. [Celery 비동기 처리](#4-celery-비동기-처리)
5. [Structured Logging & ELK](#5-structured-logging--elk)
6. [Prometheus 메트릭 & Grafana](#6-prometheus-메트릭--grafana)
7. [적응형 배치 처리](#7-적응형-배치-처리)
8. [AI 어시스턴트 (RAG + Text-to-SQL)](#8-ai-어시스턴트-rag--text-to-sql)
9. [데이터베이스 스키마](#9-데이터베이스-스키마)
10. [API 엔드포인트](#10-api-엔드포인트)
11. [설치 및 실행](#11-설치-및-실행)
12. [기술 스택](#12-기술-스택)
13. [개발 가이드](#13-개발-가이드)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개

**AI & BI DeepSeeHub Platform**는 제조업체를 위한 AI 기반 경영정보시스템(MIS) 대시보드입니다. 자연어 질의를 통한 데이터 조회, AI 예측, 온톨로지 기반 원인 분석 등의 기능을 제공합니다.

### 1.2 주요 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 어시스턴트** | 자연어로 SQL 생성 및 데이터 조회 (RAG + Text-to-SQL) |
| 📊 **12개 도메인 예측** | 생산, 품질, 영업, 재고, 설비, 고객, 원가, 재무, 구매, 물류, 인사, ESG |
| 🗂️ **기준정보 관리** | 10개 모듈 (제품, 공급사, 고객, 사원, 창고, 부서, 공장, 설비, 원가센터, 계정) |
| 🔍 **온톨로지 분석** | 6M/4M2E 기반 원인-결과-대책 분석 |
| 📦 **로트 추적** | 전방향/후방향 로트 추적 및 품질 이력 조회 |
| ⚡ **비동기 처리** | Celery 기반 우선순위 큐 처리 |
| 📈 **모니터링** | Prometheus/Grafana 기반 메트릭 수집 |
| 📝 **구조화 로깅** | ELK Stack 기반 로그 집적 및 분석 |

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  React 18 + TypeScript + Vite                               ││
│  │  - 24개 메뉴 구조                                           ││
│  │  - AI 어시스턴트 채팅 UI                                     ││
│  │  - 대시보드 차트 컴포넌트                                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Django 5.0 + DRF                                           ││
│  │  - RESTful API 엔드포인트                                    ││
│  │  - SQL 실행 서비스                                           ││
│  │  - 로트 추적 API                                             ││
│  │  - 인과 관계 분석 API                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Async Processing Layer                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Celery + Redis                                              ││
│  │  - Priority Queues (high/medium/low)                         ││
│  │  - Autoscaling Workers (2-8)                                ││
│  │  - Beat Scheduler (periodic tasks)                          ││
│  │  - Flower Monitoring (port 5555)                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Observability Layer                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐│
│  │  ELK Stack           │  │  Prometheus          │  │  Grafana     ││
│  │  - Elasticsearch     │  │  - Metrics Collection│  │  - Dashboards ││
│  │  - Logstash/Filebeat │  │  - HTTP/DB/Custom     │  │  - Alerts     ││
│  │  - Kibana (5601)      │  │  - Prometheus (9090)  │  │  - (3000)     ││
│  └──────────────────────┘  └──────────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 디렉토리 구조

```
claros-mis-ai-dashboard/
├── claros-mis-frontend/          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/              # AI 채팅 컴포넌트
│   │   │   ├── dashboard/         # 대시보드 페이지
│   │   │   ├── prediction/        # 예측 관리
│   │   │   └── icons/             # 아이콘 컴포넌트
│   │   ├── services/
│   │   │   ├── vectorSearchService.ts    # 벡터 검색 서비스
│   │   │   ├── textToSqlService.ts       # Text-to-SQL 서비스
│   │   │   └── llmService.ts             # LLM 연동 서비스
│   │   └── App.tsx
│   └── package.json
│
└── claros-mis-backend/           # Django Backend
    ├── config/
    │   ├── celery.py            # Celery 앱 설정 (Priority Queues)
    │   ├── grafana_dashboards/  # Grafana 대시보드 JSON
    │   ├── settings.py          # Django 설정
    │   └── urls.py              # URL 라우팅
    ├── utils/
    │   ├── logging_config.py    # 구조화 로깅 (JSON)
    │   ├── middleware.py        # Request ID, Metrics 미들웨어
    │   ├── metrics.py           # Prometheus 메트릭 수집기
    │   ├── adaptive_batch.py    # 적응형 배치 크기 조정
    │   ├── health_check.py      # 헬스체크 + 메트릭
    │   └── service_monitor.py   # 서비스 모니터링
    ├── ai/
    │   └── tasks.py             # Celery 비동기 태스크
    ├── erp_sync/
    │   └── services.py          # ERP 동기화 (적응형 배치)
    └── manage.py
```

---

## 3. 인프라 구성

### 3.1 서비스 포트

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend | 80, 443 | React 앱 (nginx) |
| Backend API | 8000 | Django REST API |
| PostgreSQL | 5432 | 데이터베이스 |
| Redis | 6379 | Celery 브로커/캐시 |
| Flower | 5555 | Celery 모니터링 |
| Elasticsearch | 9200 | 로그 저장소 |
| Kibana | 5601 | 로그 시각화 |
| Prometheus | 9090 | 메트릭 수집 |
| Grafana | 3000 | 대시보드 |

### 3.2 데이터 흐름

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 사용자   │───▶│ Frontend│───▶│ Backend │───▶│PostgreSQL│
└─────────┘    └─────────┘    └────┬────┘    └─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Redis    │   │Celery     │   │Elasticsearch│
            │  Queue    │───▶│Workers    │───▶│  Logs     │
            └───────────┘   │(Priority) │   └───────────┘
                              └───────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │Prometheus  │
                              │  Metrics   │
                              └───────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │  Grafana  │
                              │Dashboards │
                              └───────────┘
```

---

## 4. Celery 비동기 처리

### 4.1 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Django Application                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Celery App (config/celery.py)          │
│  - Priority Queues: high, medium, low                        │
│  - Task Routing by Priority                                   │
│  - Autoscaling: 2-8 workers                                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │   High  │   │  Medium │   │   Low   │
        │  Queue  │   │  Queue  │   │  Queue  │
        └────┬────┘   └────┬────┘   └────┬────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
                ┌───────────────────────┐
                │  Celery Workers        │
                │  (autoscale: 2-8)      │
                │  --queues=high,medium,low│
                └───────────────────────┘
```

### 4.2 Priority Queue 설정

| 큐 | 우선순위 | 용도 | 예시 태스크 |
|----|---------|----|-----------|
| `high` | 9-10 | 긴급, 실시간 | 긴급 알림, 실시간 예측 |
| `medium` | 4-8 | 일반 작업 | KPI 계산, 배치 예측, ERP 동기화 |
| `low` | 1-3 | 배치, 백그라운드 | 모델 학습, 데이터 정리, 리포트 생성 |

### 4.3 Celery 파일 구조

```python
# config/celery.py
app = Celery('claros_mis')

# Priority Queues
app.conf.task_routes = {
    'high_priority_tasks': {'queue': 'high'},
    'medium_priority_tasks': {'queue': 'medium'},
    'low_priority_tasks': {'queue': 'low'},
}

# Autoscaling
app.conf.worker_autoscale_min = 2
app.conf.worker_autoscale_max = 8
```

```python
# ai/tasks.py
@shared_task(queue='high', priority=9)
def high_priority_prediction_task(prediction_id, params):
    """긴급 AI 예측 태스크"""
    pass

@shared_task(queue='medium', priority=5)
def calculate_kpi_task(kpi_type='all'):
    """KPI 계산 태스크"""
    pass
```

### 4.4 주기적 태스크 (Celery Beat)

| 태스크 | 스케줄 | 큐 | 설명 |
|--------|--------|-----|------|
| `calculate_kpi_task` | 15분마다 | medium | KPI 계산 |
| `run_predictions_task` | 매시 정시 | medium | AI 예측 실행 |
| `sync_realtime_task` | 15분마다 | medium | ERP 실시간 동기화 |
| `cleanup_old_data_task` | 매일 자정 | low | 90일 이상 데이터 정리 |

### 4.5 Flower 모니터링

- **URL**: `http://localhost:5555`
- **기능**:
  - 실시간 태스크 모니터링
  - Worker 상태 확인
  - 태스크 성공/실패 추적
  - 큐 길이 모니터링

---

## 5. Structured Logging & ELK

### 5.1 로그 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                  Django Application                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Request ID Middleware                                  ││
│  │  Metrics Collection Middleware                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Structured Logging (JSON Format)               │
│  {                                                           │
│    "timestamp": "2025-02-26T10:00:00Z",                     │
│    "level": "INFO",                                         │
│    "logger": "ai.views",                                    │
│    "message": "AI prediction completed",                    │
│    "request_id": "abc-123",                                 │
│    "user_id": "user@example.com",                           │
│    "duration_ms": 150                                      │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Filebeat (Log Shipping)                    │
│  - Reads /var/log/claros/app.log                          │
│  - Ships to Elasticsearch                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Elasticsearch (Log Storage)                │
│  - Index: claros-mis-app-*                                 │
│  - Index: claros-mis-errors-*                               │
│  - Index: claros-mis-audit-*                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Kibana (Log Visualization)                  │
│  - URL: http://localhost:5601                               │
│  - Log discovery                                             │
│  - Dashboard creation                                       │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 로그 포맷

```json
{
  "timestamp": "2025-02-26T10:00:00Z",
  "level": "INFO",
  "logger": "ai.views",
  "message": "AI prediction completed",
  "app": "claros-mis",
  "environment": "production",
  "service": "backend",
  "request": {
    "request_id": "abc-123",
    "user_id": "user@example.com",
    "session_id": "xyz-789",
    "ip_address": "192.168.1.100",
    "path": "/api/ai/predictions/",
    "method": "POST",
    "duration_ms": 150
  },
  "tags": ["ai", "prediction"]
}
```

### 5.3 인덱스 패턴

| 인덱스 패턴 | 설명 | 예시 |
|-----------|------|------|
| `claros-mis-app-*` | 일반 애플리케이션 로그 | `claros-mis-app-2025.02.26` |
| `claros-mis-errors-*` | 에러 로그만 | `claros-mis-errors-2025.02.26` |
| `claros-mis-audit-*` | 감사 로그 | `claros-mis-audit-2025.02` |

### 5.4 로그 설정

```python
# config/settings.py
LOGGING = {
    'formatters': {
        'json': {
            '()': 'utils.logging_config.StructuredFormatter',
        },
    },
    'handlers': {
        'file': {
            'filename': '/var/log/claros/app.log',
            'formatter': 'json',
        },
        'error_file': {
            'filename': '/var/log/claros/errors.log',
            'formatter': 'json',
            'level': 'ERROR',
        },
    },
}
```

---

## 6. Prometheus 메트릭 & Grafana

### 6.1 메트릭 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                  Django Application                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Metrics Collection Middleware                          ││
│  │  - HTTP Request Metrics                                 ││
│  │  - Response Time Tracking                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Metrics Collector (utils/metrics.py)          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  HTTP: requests_total, request_duration_seconds         ││
│  │  DB: db_queries_total, db_query_duration_seconds       ││
│  │  Cache: cache_operations_total, cache_hit_ratio          ││
│  │  AI: ai_predictions_total, ai_prediction_duration       ││
│  │  Celery: celery_tasks_total, celery_task_duration      ││
│  │  Business: kpi_calculation_duration, erp_sync_records  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               /metrics endpoint (Prometheus format)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Prometheus (Scraping)                       │
│  - Scrapes every 15s                                       │
│  - URL: http://backend:8000/metrics                        │
│  - Port: 9090                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Grafana (Dashboards)                        │
│  - URL: http://localhost:3000                               │
│  - Auto-provisioned datasources                             │
│  - Pre-built dashboards                                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 주요 메트릭

#### HTTP 메트릭
```prometheus
http_requests_total{method="GET", endpoint="/api/ai/predictions/", status="200"}
http_request_duration_seconds_bucket{method="POST", endpoint="/api/sql/execute/", le="0.5"}
```

#### Celery 메트릭
```prometheus
celery_tasks_total{task_name="calculate_kpi_task", status="success", queue="medium"}
celery_task_duration_seconds_sum{task_name="run_predictions_task", queue="medium"}
celery_queue_length{queue="high"}
```

#### 비즈니스 메트릭
```prometheus
kpi_calculation_duration_seconds_sum{kpi_type="sales"}
erp_sync_duration_seconds_sum{sync_type="realtime", table="SDY100_YH"}
erp_sync_records_total{sync_type="realtime", table="SDY100_YH", status="success"}
```

### 6.3 Grafana 대시보드

| 대시보드 | 설명 | 주요 메트릭 |
|---------|------|-----------|
| **System Overview** | 시스템 리소스 모니터링 | CPU, Memory, Disk, Health Check |
| **API Performance** | API 성능 모니터링 | Request Rate, Response Time, Error Rate |
| **Business Metrics** | 비즈니스 메트릭 | KPI Duration, Prediction Duration, ERP Sync Records |
| **Celery Tasks** | Celery 태스크 모니터링 | Task Throughput, Duration, Queue Length |

### 6.4 Prometheus 설정

```yaml
# deploy/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'claros-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
```

---

## 7. 적응형 배치 처리

### 7.1 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                  ERP Sync Service                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  1. 네트워크 상태 확인                                   ││
│  │     - Latency 측정                                        ││
│  │     - Packet Loss 측정                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  2. 네트워크 조건 분류                                   ││
│  │     - Excellent (<50ms) → 5000건                         ││
│  │     - Good (<150ms) → 2000건                             ││
│  │     - Fair (<300ms) → 1000건                             ││
│  │     - Poor (<500ms) → 500건                              ││
│  │     - Very Poor (>=500ms) → 100건                        ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  3. 배치 크기 결정 및 처리                                ││
│  │     - 성공 시: 10% 증가                                    ││
│  │     - 실패 시: 50% 감소                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 7.2 네트워크 조건별 배치 크기

| 네트워크 상태 | 지연 시간 | 배치 크기 |
|--------------|-----------|---------|
| Excellent | < 50ms | 5,000건 |
| Good | < 150ms | 2,000건 |
| Fair | < 300ms | 1,000건 |
| Poor | < 500ms | 500건 |
| Very Poor | >= 500ms | 100건 |

### 7.3 적응형 배치 모듈

```python
# utils/adaptive_batch.py
from utils.adaptive_batch import get_adaptive_batch_size, record_batch_success, record_batch_failure

# 배치 크기 가져오기
batch_size = get_adaptive_batch_size()

# ERP 동기화
sync_log = erp_service.sync_table('SDY100_YH', batch_size=batch_size)

# 성공/실패 기록
if sync_log.status == 'success':
    record_batch_success(batch_size)
else:
    record_batch_failure(batch_size, sync_log.error)
```

### 7.4 환경 설정

```python
# config/settings.py
ADAPTIVE_BATCH_ENABLED = True
BATCH_SIZE_MIN = 100
BATCH_SIZE_MAX = 5000
NETWORK_CHECK_INTERVAL = 60
```

---

## 8. AI 어시스턴트 (RAG + Text-to-SQL)

### 8.1 기능 개요

AI 어시스턴트는 자연어 질문을 이해하여 적절한 SQL 쿼리를 생성하고 실행하는 기능을 제공합니다.

### 8.2 처리 흐름

```
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────┐
│ 사용자   │───▶│ 자연어 질문  │───▶│ 벡터 검색    │───▶│ 관련    │
│ 질문 입력 │    │             │    │ (FAISS-like) │    │ 테이블  │
└─────────┘    └─────────────┘    └──────────────┘    └─────────┘
```

---

## 9. 데이터베이스 스키마

### 9.1 모듈별 테이블 목록

```sql
-- 인사 (HR) 모듈
HR_EMPLOYEE (emp_id PK, emp_name, dept_code FK, position, hire_date, salary)
HR_DEPARTMENT (dept_code PK, dept_name, parent_dept, manager_id FK)
HR_ATTENDANCE (att_id PK, emp_id FK, work_date, check_in, check_out, work_hours)

-- 급여 (Payroll) 모듈
PAY_SALARY (pay_id PK, emp_id FK, pay_year, pay_month, base_salary, net_pay)

-- 자재 (Materials) 모듈
MM_MATERIAL (mat_code PK, mat_name, mat_type, unit, unit_price)
MM_INVENTORY (inv_id PK, mat_code FK, warehouse_code, current_qty)

-- 생산 (Production) 모듈
PP_WORK_ORDER (wo_no PK, product_code FK, line_code, plan_qty, actual_qty)
PP_PRODUCTION (prod_id PK, wo_no FK, prod_date, plan_qty, good_qty, yield_rate)

-- 품질 (Quality) 모듈
QM_INSPECTION (insp_id PK, insp_type, insp_date, sample_qty, pass_qty, pass_rate)
QM_DEFECT (defect_id PK, defect_date, defect_type, defect_qty, cause)

-- 영업 (Sales) 모듈
SD_SALES_ORDER (so_no PK, customer_code FK, order_date, total_amount)
SD_SALES (sales_id PK, sales_date, customer_code FK, quantity, amount)
```

---

## 10. API 엔드포인트

### 10.1 헬스체크 & 메트릭

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/health/` | 전체 시스템 헬스체크 |
| GET | `/api/health/readiness/` | Readiness probe |
| GET | `/api/health/liveness/` | Liveness probe |
| GET | `/metrics` | Prometheus 메트릭 |

### 10.2 로컬 분석 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/local-analysis/comprehensive/` | 종합 데이터 분석 |
| GET | `/api/local-analysis/sales/` | 매출 분석 |
| GET | `/api/local-analysis/quality/` | 품질 분석 |
| GET | `/api/local-analysis/production/` | 생산 분석 |

### 10.3 AI 어시스턴트 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/sql/execute/` | SQL 쿼리 실행 |
| POST | `/api/analysis/causal/` | 인과 관계 분석 |
| GET | `/api/lot/trace/{lot_no}/` | 로트 추적 |

---

## 11. 설치 및 실행

### 11.1 Docker Compose로 시작

```bash
# 1. Docker Desktop 시작

# 2. 모든 서비스 시작
cd C:\work\claude_code\claros-mis-ai-dashboard
docker-compose up -d

# 3. 서비스 상태 확인
docker-compose ps

# 4. 로그 확인
docker-compose logs -f backend
docker-compose logs -f celery-worker
docker-compose logs -f elasticsearch

# 5. 서비스 중지
docker-compose down

# 6. 볼륨까지 제거
docker-compose down -v
```

### 11.2 개별 서비스 시작 (개발용)

```bash
# 백엔드
cd claros-mis-backend
python manage.py runserver 8000

# Celery Worker
celery -A config worker --loglevel=info --concurrency=4 --queues=high,medium,low

# Celery Beat
celery -A config beat --loglevel=info

# Flower
celery -A config flower --port=5555
```

### 11.3 접속 URL

| 서비스 | URL | 자격증증 |
|--------|-----|----------|
| Frontend | http://localhost | - |
| Backend API | http://localhost:8000/api | - |
| Admin Panel | http://localhost:8000/admin | Django admin |
| Flower (Celery) | http://localhost:5555 | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3000 | admin/admin |
| Kibana | http://localhost:5601 | - |

---

## 12. 기술 스택

### 12.1 Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Django | 4.2.17 | 웹 프레임워크 |
| DRF | 3.15.2 | API 프레임워크 |
| Celery | 5.4.0 | 비동기 작업 |
| Redis | 7.0 | 브로커/캐시 |
| PostgreSQL | 15 | 데이터베이스 |

### 12.2 Observability

| 기술 | 버전 | 용도 |
|------|------|------|
| Elasticsearch | 8.12.0 | 로그 저장/검색 |
| Kibana | 8.12.0 | 로그 시각화 |
| Prometheus | v2.50.0 | 메트릭 수집 |
| Grafana | 10.3.0 | 대시보드 |
| python-json-logger | 2.0.7 | 구조화 로깅 |
| prometheus-client | 0.21.0 | 메트릭 export |
| django-prometheus | 2.3.1 | Django-Prometheus 통합 |

### 12.3 AI/ML

| 기술 | 용도 |
|------|------|
| FAISS | 벡터 검색 |
| Ollama | 로컬 LLM |
| OpenAI API | ChatGPT |
| Gemini API | Google AI |

---

## 13. 개발 가이드

### 13.1 새로운 Celery 태스크 추가

```python
# ai/tasks.py
from celery import shared_task

@shared_task(queue='medium', priority=5)
def my_new_task(param1, param2):
    """새로운 태스크 설명"""
    try:
        # 비즈니스 로직
        result = do_something(param1, param2)

        # 성공 기록
        from utils.metrics import metrics_collector
        metrics_collector.record_custom_task(task_name='my_new_task', status='success')

        return result
    except Exception as e:
        # 실패 기록
        metrics_collector.record_custom_task(task_name='my_new_task', status='error')
        raise
```

### 13.2 새로운 Prometheus 메트릭 추가

```python
# utils/metrics.py
class MetricsCollector:
    def __init__(self):
        # 새로운 카운터
        self.my_custom_counter = Counter(
            'my_custom_operations_total',
            'Total custom operations',
            ['operation_type', 'status'],
            registry=self.registry
        )
```

### 13.3 환경 변수

```bash
# .env
# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password_2024
DB_HOST=db
DB_PORT=5432

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
CELERY_WORKER_CONCURRENCY=4
CELERY_WORKER_AUTOSCALE_MIN=2
CELERY_WORKER_AUTOSCALE_MAX=8

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
ELASTICSEARCH_URL=http://elasticsearch:9200

# Metrics
ENABLE_METRICS=true
PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus

# Adaptive Batch
ADAPTIVE_BATCH_ENABLED=true
BATCH_SIZE_MIN=100
BATCH_SIZE_MAX=5000
NETWORK_CHECK_INTERVAL=60
```

---

## 부록

### A. 용어 정리

| 용어 | 설명 |
|------|------|
| RAG | Retrieval Augmented Generation - 검색 증강 생성 |
| Text-to-SQL | 자연어를 SQL 쿼리로 변환 |
| Celery | 파이썬 기반 분산 작업 큐 |
| Redis | 인메모리 데이터 저장소 |
| ELK | Elasticsearch, Logstash, Kibana |
| Prometheus | 메트릭 수집 시스템 |
| Grafana | 시각화 대시보드 |
| Priority Queue | 우선순위 기반 작업 큐 |
| Autoscaling | 자동 스케일링 (2-8 workers) |
| Adaptive Batch | 네트워크 상태 기반 배치 크기 조정 |

### B. 포트 참조

| 서비스 | 내부 포트 | 외부 포트 |
|--------|-----------|---------|
| Frontend | 80 | 80 |
| Backend | 8000 | 8000 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Flower | 5555 | 5555 |
| Elasticsearch | 9200 | 9200 |
| Kibana | 5601 | 5601 |
| Prometheus | 9090 | 9090 |
| Grafana | 3000 | 3000 |

---

## 14. 변경 이력 (Changelog)

### 버전 2.0.0 (2026-02-26)

#### 추가된 기능
- **Celery 인프라**: 우선순위 큐 (high/medium/low), 오토스케일링 (2-8 workers)
- **Flower 모니터링**: Celery 태스크 실시간 모니터링 (포트 5555)
- **Structured Logging**: JSON 형식 구조화 로깅
- **ELK Stack**: Elasticsearch, Kibana 통합 (포트 9200, 5601)
- **Prometheus 메트릭**: HTTP, DB, Cache, AI, Celery, 비즈니스 메트릭
- **Grafana 대시보드**: 4개 사전 빌드된 대시보드
- **적응형 배치 처리**: 네트워크 상태 기반 배치 크기 자동 조정
- **Request ID 미들웨어**: 요청 추적 가능한 UUID 할당
- **헬스체크 강화**: `/metrics` 엔드포인트 추가

#### 수정된 사항
- **docker-compose.yml**: Redis, Celery, ELK, Prometheus, Grafana 서비스 추가
- **requirements.txt**: 새로운 의존성 추가
- **config/settings.py**: Celery, Logging, Metrics 설정 추가

#### 버전 1.1.0 (2026-02-22)
- 종합 데이터 분석 페이지 추가

---

**문서 버전**: 2.0.0
**최종 수정일**: 2026-02-26
**작성자**: AI & BI DeepSeeHub 팀
