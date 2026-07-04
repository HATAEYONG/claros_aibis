# MLOps 구현 가이드

**Claros MIS AI Dashboard - MLOps (Phase 2)**
버전: 1.0
작성일: 2026-04-01
상태: 구현 완료

---

## 1. 개요

### 1.1 목표

머신러닝 모델의 전체 라이프사이클을 자동화하고 모니터링하는 MLOps 시스템 구축

**주요 기능:**
- MLflow 기반 모델 레지스트리
- A/B 테스트 프레임워크
- 실시간 모델 모니터링
- CI/CD 파이프라인 자동화

### 1.2 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    MLOps Platform                          │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Model     │  │    A/B       │  │      Model      │   │
│  │  Registry   │  │   Testing    │  │   Monitoring    │   │
│  │  (MLflow)   │  │  Framework   │  │  (Prometheus)   │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘   │
│         │                │                   │             │
│         └────────────────┼───────────────────┘             │
│                          ▼                                 │
│                  ┌───────────────┐                         │
│                  │  CI/CD        │                         │
│                  │  Pipeline     │                         │
│                  └───────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer                                 │
│  /api/ml-pipeline/mlops/*                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 모델 레지스트리 (Model Registry)

### 2.1 기능

- MLflow Tracking Server 연동
- 모델 버전 관리
- 스테이징 (Development → Staging → Production)
- 모델 메타데이터 관리
- 실험 추적 및 비교

### 2.2 사용 예시

```python
from ml_pipeline.mlops import ModelRegistry, get_model_registry

# 레지스트리 초기화
registry = ModelRegistry(
    tracking_uri='http://localhost:5000',
    use_mlflow=True
)

# 모델 등록
metadata = registry.register_model(
    model=my_model,
    model_name='production_forecast',
    model_type='ensemble',
    metrics={'mape': 4.2, 'mae': 85.3, 'rmse': 120.5},
    parameters={'epochs': 50, 'batch_size': 64},
    tags={'version': 'v2.1', 'purpose': 'forecasting'}
)

# 모델 로드
model, info = registry.get_model(
    model_name='production_forecast',
    stage='Production'
)

# 스테이지 전환
registry.transition_model_stage(
    model_name='production_forecast',
    version='5',
    new_stage='Production'
)
```

### 2.3 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ml-pipeline/mlops/registry/health/` | GET | 헬스 체크 |
| `/api/ml-pipeline/mlops/registry/models/` | GET | 모델 목록 |
| `/api/ml-pipeline/mlops/registry/models/<name>/` | GET | 모델 상세 |
| `/api/ml-pipeline/mlops/registry/models/transition/` | POST | 스테이지 전환 |
| `/api/ml-pipeline/mlops/registry/models/compare/` | GET | 모델 비교 |

---

## 3. A/B 테스트 (A/B Testing)

### 3.1 기능

- 두 모델의 통계적 비교
- 트래픽 분배 (50:50 또는 커스텀)
- 실시간 성능 추적
- t-검정 기반 유의성 검정
- 자동 승자 선정

### 3.2 사용 예시

```python
from ml_pipeline.mlops import ABTestFramework, ABTestConfig

# 프레임워크 초기화
framework = ABTestFramework()

# 테스트 설정
config = ABTestConfig(
    test_name='forecast_comparison_v2_v3',
    model_a='ensemble_v2',
    model_b='ensemble_v3',
    test_period_days=30,
    traffic_split=0.5,
    min_sample_size=1000,
    metric='mape'
)

# 테스트 생성 및 시작
test_id = framework.create_test(config)
framework.start_test(test_id)

# 트래픽 분배
user_group = framework.allocate_traffic(test_id, user_id='user123')

# 예측 결과 기록
framework.record_prediction(
    test_id=test_id,
    group=user_group,
    prediction=125.5,
    actual=128.0
)

# 테스트 평가
result = framework.evaluate_test(test_id)
print(f"Winner: {result.winner}, Confidence: {result.confidence}%")
```

### 3.3 Multi-Armed Bandit

```python
from ml_pipeline.mlops import MultiArmedBandit

# MAB 초기화
mab = MultiArmedBandit(
    models=['model_a', 'model_b', 'model_c'],
    algorithm='epsilon_greedy',
    epsilon=0.1
)

# 모델 선택
selected_model = mab.select_model()

# 보상 업데이트
mab.update_reward(selected_model, reward=0.85)
```

### 3.4 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ml-pipeline/mlops/ab-testing/create/` | POST | 테스트 생성 |
| `/api/ml-pipeline/mlops/ab-testing/<id>/start/` | POST | 테스트 시작 |
| `/api/ml-pipeline/mlops/ab-testing/<id>/result/` | GET | 결과 조회 |
| `/api/ml-pipeline/mlops/ab-testing/list/` | GET | 테스트 목록 |

---

## 4. 모델 모니터링 (Model Monitoring)

### 4.1 기능

- 실시간 성능 메트릭 추적
- 데이터 드리프트 감지 (KS 검정)
- 모델 드리프트 감지
- 알림 발송 (Email, Slack, Webhook)
- Prometheus/Grafana 연동

### 4.2 사용 예시

```python
from ml_pipeline.mlops import ModelMonitor, MonitorConfig

# 모니터 초기화
config = MonitorConfig(
    model_name='production_forecast',
    mape_threshold=10.0,
    latency_threshold_ms=1000.0
)
monitor = ModelMonitor(config)

# 모니터링 시작
monitor.start_monitoring()

# 예측 결과 기록
monitor.record_prediction(
    prediction=125.5,
    actual=128.0,
    latency_ms=45.2
)

# 데이터 드리프트 감지
drift_result = monitor.detect_data_drift(current_data)

# 메트릭 요약 조회
summary = monitor.get_metrics_summary()

# Prometheus 메트릭 내보내기
from ml_pipeline.mlops import PrometheusExporter
exporter = PrometheusExporter()
exporter.set_metric('prediction_mape', 4.2, {'model': 'forecast'})
exporter.save_to_file('metrics.prom')
```

### 4.3 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ml-pipeline/mlops/monitoring/start/` | POST | 모니터링 시작 |
| `/api/ml-pipeline/mlops/monitoring/record/` | POST | 예측 기록 |
| `/api/ml-pipeline/mlops/monitoring/metrics/` | GET | 메트릭 조회 |
| `/api/ml-pipeline/mlops/monitoring/alerts/` | GET | 알림 조회 |

---

## 5. CI/CD 파이프라인

### 5.1 파이프라인 구성

```yaml
pipeline_name: ml_training_pipeline

stages:
  - name: data_validation
    type: data_validation
    command: python scripts/validate_data.py
    timeout_seconds: 600

  - name: feature_engineering
    type: feature_engineering
    command: python scripts/create_features.py
    dependencies:
      - data_validation

  - name: training
    type: training
    command: python scripts/train_model.py
    dependencies:
      - feature_engineering

  - name: evaluation
    type: evaluation
    command: python scripts/evaluate_model.py
    dependencies:
      - training

  - name: deployment
    type: deployment
    command: python scripts/deploy_model.py
    dependencies:
      - evaluation
```

### 5.2 사용 예시

```python
from ml_pipeline.mlops import CIPipeline

# 파이프라인 초기화
pipeline = CIPipeline(
    pipeline_name='ml_training_pipeline',
    config_path='pipeline_config.yaml'
)

# 파이프라인 실행
run = pipeline.run_pipeline(
    parameters={'epochs': 50, 'batch_size': 64},
    stop_on_failure=True
)

# 실행 상태 확인
print(f"Status: {run.status.value}")
print(f"Stages: {run.stages}")
```

### 5.3 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ml-pipeline/mlops/pipeline/trigger/` | POST | 파이프라인 트리거 |
| `/api/ml-pipeline/mlops/pipeline/runs/<id>/` | GET | 실행 조회 |
| `/api/ml-pipeline/mlops/pipeline/runs/list/` | GET | 실행 목록 |

---

## 6. 설치 및 설정

### 6.1 MLflow 설치

```bash
# MLflow 설치
pip install mlflow

# MLflow 서버 시작
mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./mlartifacts --host 0.0.0.0 --port 5000
```

### 6.2 환경 변수 설정

```bash
# .env
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=http://localhost:5000
MODEL_ARTIFACT_ROOT=./mlartifacts
```

### 6.3 Django 설정

```python
# config/settings.py

INSTALLED_APPS = [
    ...
    'ml_pipeline',
    'ml_pipeline.mlops',
]
```

---

## 7. Grafana 대시보드

### 7.1 Prometheus 데이터 소스

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ml_pipeline'
    static_configs:
      - targets: ['localhost:9090']
```

### 7.2 추천 대시보드 패널

1. **모델 성능 패널**
   - MAPE, MAE, RMSE 추이
   - 임계값 알림

2. **예측 처리량 패널**
   - 일일 예측 수
   - 평균 지연 시간

3. **드리프트 감지 패널**
   - 데이터 분포 변화
   - 모델 성능 저하

---

## 8. 파일 구조

```
ml_pipeline/
├── mlops/
│   ├── __init__.py
│   ├── model_registry.py      # MLflow 모델 레지스트리
│   ├── ab_testing.py          # A/B 테스트 프레임워크
│   ├── model_monitor.py       # 모델 모니터링
│   ├── ci_pipeline.py         # CI/CD 파이프라인
│   ├── api.py                 # MLOps API
│   └── urls.py                # URL 라우팅
```

---

## 9. 다음 단계 (Phase 3)

### 9.1 설명 가능 AI (2-3주)

- [ ] SHAP 통합
- [ ] 설명 가능 AI 리포트
- [ ] 변수 중요도 UI

### 9.2 고급 기능

- [ ] Hyperparameter Tuning (Optuna)
- [ ] 모델 압축 및 최적화
- [ ] Edge 배포

---

**문서 버전:** 1.0
**작성자:** AI Architecture Team
**상태:** Phase 2 구현 완료
