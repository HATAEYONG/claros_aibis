# AI 예측 업그레이드 추천안

**Claros MIS AI Dashboard**
버전: 2.0 → 3.0
작성일: 2026-04-01

---

## 1. 현재 시스템 분석

### 1.1 현재 구현 상태

**백엔드 AI 모델:**
```python
# forecasting/services/forecast_service.py
- Prophet (Facebook): 시계열 기본 예측
- LSTM: 딥러닝 기반 예측
- 단순 이동평균, 지수평활
```

**예측 범위:**
- 품질 예측 (QualityPrediction)
- 생산 예측 (ProductionPrediction)
- 재고 예측 (InventoryPrediction)
- 재무 예측 (FinancePrediction)

**프론트엔드 컴포넌트:**
- PredictionDashboard: 통합 예측 대시보드
- PredictionVsActual: 예측 vs 실적 비교
- AccuracyAnalysis: 예측 정확도 분석
- ParameterTuning: 파라미터 튜닝

### 1.2 현재 제한사항

**성능:**
- MAPE (Mean Absolute Percentage Error): 8-15%
- 단기 예측(1-3개월)에만 적합
- 장기 예측 정확도 저하

**기능:**
- 단변량 시계열 분석만 지원
- 외부 변수(시장, 경기) 미반영
- 실시간 재학습 미지원
- 앙상블 모델 미사용

**데이터:**
- 과거 데이터만 활용
- 실시간 데이터 스트리밍 미연동
- 이상치 처리 미흡

---

## 2. 업그레이드 추천안

### 2.1 모델 고도화 (Priority: High)

#### 2.1.1 Transformer 기반 모델 도입

**추천 모델:**

```python
# Temporal Fusion Transformer (TFT)
상위 스코어:
- 정확도: MAPE 3-5% (vs 현재 8-15%)
- 장기 예측: 6-12개월 가능
- 다변량 지원: 외부 변수 반영
- 불확실성 정량화: 예측 구간 제공

# Prophet 2.0 (Facebook)
상위 스코어:
- 계절성 이벤트 자동 감지
- 휴일/휴일일 자동 처리
- 극값 이상치 자동 보정

# N-BEATS (Neural Basis Expansion Analysis)
상위 스코어:
- 딥러닝 자동 회귀
- 계측적 예측 가능
- 인터프리터블 성분 분해
```

**구현 방법:**

```python
# ml_pipeline/upgrade/tft_model.py
import torch
import pytorch_forecasting as ptf
from pytorch_forecasting.models.temporal_fusion_transformer import TemporalFusionTransformer

class TFTForecaster:
    def __init__(self, config):
        self.model = TemporalFusionTransformer.from_dataset(
            train_dataloader,
            hidden_size=32,
            attention_head_size=4,
            dropout=0.1,
            hidden_continuous_size=16,
            loss=QuantileLoss(),
            log_interval=10,
        )

    def predict(self, context, horizon=90):
        """
        Args:
            context: 과거 데이터 (lookback window)
            horizon: 예측 기간 (일 단위)

        Returns:
            예측값 (PI 10, 50, 90%)
        """
        return self.model.predict(context, horizon)
```

#### 2.1.2 앙상블 모델 구축

```python
# ml_pipeline/upgrade/ensemble.py
class PredictionEnsemble:
    """
    앙상블 예측: 여러 모델의 예측 결합
    """
    def __init__(self):
        self.models = {
            'tft': TFTForecaster(),
            'prophet': ProphetForecaster(),
            'lstm': LSTMForecaster(),
            'arima': ARIMAForecaster(),
        }
        self.weights = {
            'tft': 0.35,
            'prophet': 0.25,
            'lstm': 0.25,
            'arima': 0.15,
        }

    def predict(self, data):
        predictions = {}
        for name, model in self.models.items():
            predictions[name] = model.predict(data)

        # 가중 평균
        ensemble = sum(
            pred * self.weights[name]
            for name, pred in predictions.items()
        )

        # 스태킹 앙상블 (성능 기반)
        # 최근 30일 실적 vs 예측 MAPE 반영

        return {
            'ensemble': ensemble,
            'individual': predictions,
            'confidence': self._calculate_confidence(predictions)
        }
```

### 2.2 데이터 품질 개선 (Priority: High)

#### 2.2.1 실시간 데이터 파이프라인

```python
# ml_pipeline/upgrade/realtime_pipeline.py
from kafka import KafkaConsumer
import asyncio

class RealtimeDataPipeline:
    """
    실시간 데이터 수집 및 전처리
    """
    def __init__(self):
        self.consumer = KafkaConsumer(
            'production-events',
            bootstrap_servers=['localhost:9092'],
            value_deserializer=lambda m: json.loads(m.decode())
        )
        self.processed_data = []

    async def process_stream(self):
        async for message in self.consumer:
            data = message.value

            # 실시간 전처리
            cleaned = self._preprocess(data)

            # 이상치 탐지
            if self._detect_anomaly(cleaned):
                await self._handle_anomaly(cleaned)

            # 예측 모델 업데이트 (Online Learning)
            await self._update_model(cleaned)
```

#### 2.2.2 피처 엔지니어링 고도화

```python
# ml_pipeline/upgrade/feature_engineering.py
class AdvancedFeatureEngineering:
    """
    고급 피처 엔지니어링
    """
    def create_features(self, df):
        # 시간 기반 피처
        df['day_of_week'] = df.index.dayofweek
        df['month'] = df.index.month
        df['quarter'] = df.index.quarter
        df['is_holiday'] = self._check_holiday(df.index)

        # 래그 피처
        df['sales_ma7'] = df['sales'].rolling(7).mean()
        df['sales_std7'] = df['sales'].rolling(7).std()
        df['sales_lag7'] = df['sales'].shift(7)

        # 외부 변수 조인
        df = df.merge(self.external_data, left_index=True)

        # 도메인 특화 피처
        df['working_days'] = self._calculate_working_days(df.index)
        df['inventory_turnover'] = df['sales'] / df['inventory']

        return df
```

### 2.3 하이퍼파라미터 튜닝 (Priority: Medium)

```python
# ml_pipeline/upgrade/hyperparameter_tuning.py
import optuna

class HyperparameterOptimizer:
    """
    Optuna를 활용한 자동 튜닝
    """
    def __init__(self, model_type='tft'):
        self.study = optuna.create_study(direction='minimize')

    def objective(self, trial):
        # 하이퍼파미터 공간 정의
        params = {
            'hidden_size': trial.suggest_int('hidden_size', 16, 128),
            'dropout': trial.suggest_float('dropout', 0.0, 0.3),
            'learning_rate': trial.suggest_float('lr', 1e-5, 1e-2, log=True),
            'batch_size': trial.suggest_categorical('bs', [32, 64, 128]),
        }

        # 모델 학습 및 평가
        model = self.train_model(params)
        mape = self.evaluate(model)

        return mape

    def optimize(self, n_trials=50):
        self.study.optimize(self.objective, n_trials=n_trials)
        return self.study.best_params
```

### 2.4 MLOps 도입 (Priority: High)

#### 2.4.1 모델 버전 관리

```python
# ml_pipeline/mlops/model_registry.py
import mlflow

class ModelRegistry:
    """
    MLflow를 활용한 모델 버전 관리
    """
    def __init__(self):
        mlflow.set_tracking_uri('http://localhost:5000')

    def register_model(self, model, model_name, metrics):
        with mlflow.start_run():
            mlflow.log_params(model.params)
            mlflow.log_metrics(metrics)
            mlflow.sklearn.log_model(model, 'model')

            # 모델 스테이징
            mlflow.pyfunc.log_model(
                model,
                'model',
                registered_model_name=model_name
            )
```

#### 2.4.2 A/B 테스트 프레임워크

```python
# ml_pipeline/mlops/ab_testing.py
class ABTestFramework:
    """
    모델 A/B 테스트
    """
    def __init__(self):
        self.model_a = 'tft_v2.1'
        self.model_b = 'tft_v2.2'
        self.test_groups = {
            'control': self.model_a,
            'treatment': self.model_b
        }

    def run_ab_test(self, test_period=30):
        """
        30일간 A/B 테스트 실행
        """
        results = {}
        for group, model in self.test_groups.items():
            predictions = model.predict(test_period)
            actual = get_actual_data(test_period)
            results[group] = {
                'mape': calculate_mape(predictions, actual),
                'mae': calculate_mae(predictions, actual),
                'rmse': calculate_rmse(predictions, actual)
            }

        # 통계적 유의성 검정
        winner = self._statistical_test(results)
        return winner
```

### 2.5 설명 가능 AI (XAI) (Priority: Medium)

```python
# ml_pipeline/explainability/shap_explainer.py
import shap

class PredictionExplainer:
    """
    SHAP를 활용한 예측 설명
    """
    def __init__(self, model):
        self.model = model
        self.explainer = shap.TreeExplainer(model)

    def explain_prediction(self, sample):
        """
        단일 예측에 대한 설명
        """
        shap_values = self.explainer.shap_values(sample)

        return {
            'prediction': self.model.predict(sample),
            'shap_values': shap_values,
            'feature_importance': self._get_feature_importance(shap_values),
            'base_value': self.explainer.expected_value
        }
```

---

## 3. 단계별 구현 로드맵

### Phase 1: 모델 고도화 (4-6주)

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1-2 | TFT 모델 구현 | TFTForecaster 클래스 |
| 2-3 | 앙상블 구현 | PredictionEnsemble |
| 3-4 | 파이프라인 개선 | 실시간 데이터 처리 |
| 4-5 | 피처 엔지니어링 | AdvancedFeatureEngineering |
| 5-6 | 테스트 및 검증 | 성능 비교 리포트 |

**예상 성능 개선:**
- MAPE: 8-15% → 3-5%
- 장기 예측 가능: 3개월 → 12개월

### Phase 2: MLOps 구축 (3-4주)

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1 | MLflow 설정 | 모델 레지스트리 |
| 2 | CI/CD 파이프라인 | 자동 학습 파이프라인 |
| 3 | A/B 테스트 프레임워크 | ABTestFramework |
| 4 | 모니터링 대시보드 | ModelMonitor |

### Phase 3: 설명 가능 AI (2-3주)

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1 | SHAP 통합 | PredictionExplainer |
| 2 | 리포트 생성 | ExplainabilityReport |
| 3 | UI 구현 | FeatureImportanceChart |

---

## 4. 기술 스택 업데이트

### 4.1 추가 패키지

```
# requirements.txt 추가
pytorch-forecasting>=0.11.0
optuna>=3.0.0
mlflow>=2.8.0
shap>=0.42.0
kafka-python>=2.0.0
prometheus-client>=0.17.0
```

### 4.2 인프라 변경

```
# docker-compose.yml 추가
services:
  mlflow:
    image: mlflow/mlflow:v2.8.0
    ports:
      - "5000:5000"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    ports:
      - "9092:9092"
```

---

## 5. 성능 비교 (기대효과)

### 5.1 정확도

| 지표 | 현재 | 목표 | 개선폭 |
|------|------|------|--------|
| MAPE (1개월) | 8.5% | 3-5% | 40-50% |
| MAPE (3개월) | 12.3% | 5-7% | 40-50% |
| MAPE (6개월) | N/A | 8-10% | 신규 |
| RMSE | 156 | 80-100 | 30-40% |

### 5.2 운영 효율

| 항목 | 개선 전 | 개선 후 | 개선폭 |
|------|---------|---------|--------|
| 모델 재학습 시간 | 수동 (주간) | 자동 (일간) | -85% |
| 신규 데이터 반영 | 배치 | 실시간 | 실시간 |
| 하이퍼파라미터 튜닝 | 수동 (시간단위) | 자동 (분단위) | -95% |
| A/B 테스트 | 수동 | 자동 | -80% |

---

## 6. 위험성 평가 및 완화

### 6.1 기술적 위험

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| 모델 복잡도 증가 | 유지보수 어려움 | MLOps 자동화, 문서화 |
| 높은 컴퓨팅 비용 | 비용 증가 | 클라우드 Auto-scaling |
| 데이터 의존성 증가 | 데이터 품질 중요 | 데이터 파이프라인 견고화 |
| 예측 실패 리스크 | 비즈니스 영향 | 앙상블 안정성 강화 |

### 6.2 완화 방안

1. **롤백 전략**: 신규 모델 실패 시 기존 모델로 자동 전환
2. **그라데이션 배포**: 전체 사용자 → 테스트 그룹 → 전체
3. **성능 모니터링**: Prometheus + Grafana 실시간 모니터링
4. **정기 재학습**: 매일 자동 모델 업데이트

---

## 7. ROI 분석

### 7.1 비용 추정

| 항목 | 비용 (연간) |
|------|-------------|
| ML 인프라 (GPU 서버) | 1,500만원 |
| 개발 인건 (6인월) | 4,500만원 |
| 클라우드 서비스 | 1,200만원 |
| 유지보수 | 2,000만원 |
| **합계** | **9,200만원** |

### 7.2 기대 효과

| 항목 | 효과 (연간) |
|------|--------------|
| 재고 비용 절감 (15%) | 12,000만원 |
| 생산 계획 최적화 | 6,000만원 |
| 품질 비용 절감 | 3,000만원 |
| 영업 기회 손실 방지 | 8,000만원 |
| **합계** | **29,000만원** |

### 7.3 회수기간

**단순 회수기간:** 4개월
**NPV (순현재가치):** 19,800만원
**ROI (투자수익률):** 215%

---

## 8. 추천 구현 우선순위

### Phase 1 (즉시 실행) - 1개월

1. **Prophet 2.0 업그레이드**
   - 가장 빠른 적용 가능
   - 즉시 성능 향상 (MAPE 20% 개선)

2. **앙상블 도입**
   - 기존 모델 조합으로 안정성 확보
   - 리스크 최소화

### Phase 2 (단기) - 3개월

1. **TFT 모델 도입**
   - 장기 예측 가능
   - 정확도 크게 향상

2. **실시간 데이터 파이프라인**
   - Kafka + 실시간 처리
   - 자동 모델 업데이트

### Phase 3 (중기) - 6개월

1. **MLOps 구축**
   - MLflow 모델 관리
   - CI/CD 자동화

2. **설명 가능 AI**
   - SHAP 통합
   - 비즈니스 해석 용이성

---

## 9. 결론

### 9.1 핵심 추천사항

1. **단기 (1개월)**
   - Prophet 2.0 업그레이드
   - 앙상블 모델 도입
   - 예측 정확도 MAPE 8% → 6% 개선

2. **중기 (3개월)**
   - Transformer(TFT) 모델 도입
   - 실시간 데이터 파이프라인 구축
   - MAPE 6% → 4% 개선
   - 6-12개월 예측 가능

3. **장기 (6개월)**
   - MLOps 완전 구축
   - 설명 가능 AI 도입
   - 자동화된 전체 시스템
   - MAPE 4% → 3% 개선

### 9.2 기대 효과

- **정확도**: 3배 향상 (MAPE 12% → 4%)
- **예측 기간**: 4배 확장 (3개월 → 12개월)
- **운영 효율**: 80% 자동화
- **ROI**: 215% (투자 대비 3.1배 수익)

---

## 10. 다음 단계

1. **기술 PoC**: TFT 모델 검증 (2주)
2. **비용 승인**: 예산 확보 및 일정 조율
3. **팀 구성**: ML 엔지니어 + MLOps 엔지니어
4. **개발 착수**: Phase 1 구현 시작
5. **정기 검토**: 매주 진행 상황 공유

---

**문서 버전:** 1.0
**작성자:** AI Architecture Team
**승인자:** CTO, Head of Data Science
