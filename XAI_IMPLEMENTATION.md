# 설명 가능 AI (XAI) 구현 가이드

**Claros MIS AI Dashboard - XAI (Phase 3)**
버전: 1.0
작성일: 2026-04-01
상태: 구현 완료

---

## 1. 개요

### 1.1 목표

머신러닝 모델의 예측을 설명하고 투명성을 확보하는 설명 가능 AI 시스템 구축

**주요 기능:**
- SHAP 기반 예측 설명
- Attention 가중치 시각화
- 설명 가능 AI 리포트 자동 생성
- 변수 중요도 분석

### 1.2 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    XAI Platform                             │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │    SHAP     │  │  Attention   │  │  XAI Report     │   │
│  │  Explainer  │  │ Visualizer   │  │  Generator      │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘   │
│         │                │                   │             │
│         └────────────────┼───────────────────┘             │
│                          ▼                                 │
│                  ┌───────────────┐                         │
│                  │  Variable     │                         │
│                  │  Importance   │                         │
│                  └───────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer                                 │
│  /api/ml-pipeline/xai/*                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. SHAP Explainer

### 2.1 기능

- 전역 변수 중요도 (Global Feature Importance)
- 로컬 예측 설명 (Local Prediction Explanation)
- SHAP Summary Plot
- Waterfall Plot
- Dependence Plot
- 상호작용 효과 분석

### 2.2 사용 예시

```python
from ml_pipeline.xai import SHAPExplainer
from sklearn.ensemble import RandomForestRegressor

# 모델 학습
model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)

# SHAP Explainer 초기화
explainer = SHAPExplainer(
    model=model,
    model_type='tree',
    feature_names=feature_names
)

# 단일 예측 설명
explanation = explainer.explain_prediction(
    instance=X_test[0],
    plot_type='waterfall'
)

print(f"예측값: {explanation['prediction']}")
print(f"기준값: {explanation['expected_value']}")
print(f"상위 양성 변수: {explanation['top_positive']}")

# 전역 변수 중요도
importance = explainer.get_global_importance(X_test)
print(f"전역 변수 중요도: {importance['global_feature_importance']}")
```

### 2.3 SHAP Plot

```python
# Summary Plot
explainer.plot_summary(X_test, save_path='summary.png')

# Waterfall Plot (단일 예측)
explainer.plot_waterfall(X_test[0], save_path='waterfall.png')

# Dependence Plot
explainer.plot_dependence(X_test, feature_idx=0, save_path='dependence.png')
```

---

## 3. Attention Visualizer

### 3.1 기능

- TFT Multi-head Attention 시각화
- Attention Heatmap
- 시점별 중요도 분석
- 헤드별 비교
- Variable Selection Weights

### 3.2 사용 예시

```python
from ml_pipeline.xai import AttentionVisualizer, VariableSelectionVisualizer

# Attention Visualizer 초기화
visualizer = AttentionVisualizer(
    attention_heads=4,
    context_length=90
)

# Attention 가중치 추출
visualizer.extract_attention_weights(input_data)

# Attention Heatmap
visualizer.plot_attention_heatmap(
    sample_idx=0,
    head_idx=0,
    save_path='attention_heatmap.png'
)

# 시점별 중요도
importance = visualizer.get_temporal_importance(sample_idx=0)
print(f"가장 주목받은 시점: {importance['most_attended_time']}")

# 헤드별 비교
visualizer.compare_heads(save_path='heads_comparison.png')

# Variable Selection
var_visualizer = VariableSelectionVisualizer(
    variable_names=feature_names,
    selection_weights=weights
)
var_visualizer.plot_selection_weights(save_path='variable_selection.png')
```

---

## 4. XAI Report Generator

### 4.1 기능

- HTML/Markdown/JSON 리포트 생성
- 모델 요약
- 변수 중요도 분석
- 예측 설명 포함
- 인사이트 및 권장사항

### 4.2 사용 예시

```python
from ml_pipeline.xai import XAIReportGenerator

# 리포트 생성기 초기화
generator = XAIReportGenerator(
    model_name='production_forecast_v2',
    model_type='ensemble',
    target_variable='production_quantity'
)

# 모델 요약 추가
generator.add_model_summary(
    training_period='2025-01-01 ~ 2025-12-31',
    metrics={'mape': 4.2, 'mae': 85.3, 'rmse': 120.5},
    hyperparameters={'epochs': 50, 'batch_size': 64}
)

# 변수 중요도 추가
generator.add_feature_importance(
    importance=[
        {'feature': 'lag_7d', 'value': 0.25},
        {'feature': 'moving_avg_7d', 'value': 0.22},
        {'feature': 'day_of_week', 'value': 0.15}
    ],
    global_importance={'lag_7d': 0.25, 'moving_avg_7d': 0.22}
)

# 예측 설명 추가
generator.add_prediction_explanation(
    instance_id='sample_001',
    prediction=125.5,
    actual=128.0,
    explanation=shap_explanation,
    shap_values=[0.5, -0.3, 0.2, ...]
)

# 인사이트 추가
generator.add_insights(
    insights=[
        'lag_7d 변수가 예측에 가장 큰 영향을 미칩니다',
        '계절성 패턴이 뚜렷하게 관찰됩니다'
    ],
    recommendations=[
        '7일 지연 변수를 항상 포함하십시오',
        '주말/주중 효과를 고려하십시오'
    ]
)

# HTML 리포트 생성
generator.generate_html_report('xai_report.html')
```

---

## 5. API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ml-pipeline/xai/health/` | GET | 헬스 체크 |
| `/api/ml-pipeline/xai/explain/prediction/` | POST | 단일 예측 설명 |
| `/api/ml-pipeline/xai/explain/batch/` | POST | 배치 예측 설명 |
| `/api/ml-pipeline/xai/importance/global/` | GET | 전역 변수 중요도 |
| `/api/ml-pipeline/xai/importance/permutation/` | POST | 순열 중요도 |
| `/api/ml-pipeline/xai/visualize/attention/` | POST | Attention 시각화 |
| `/api/ml-pipeline/xai/report/generate/` | POST | XAI 리포트 생성 |
| `/api/ml-pipeline/xai/importance/variables/` | GET | Variable 중요도 |
| `/api/ml-pipeline/xai/compare/predictions/` | POST | 예측 비교 |

---

## 6. 프론트엔드 사용 예시

```typescript
import xaiService from '@/services/xaiService';

// 단일 예측 설명
const explanation = await xaiService.explainPrediction({
  model_name: 'production_forecast',
  instance: [125.5, 120.3, 118.7, ...],
  feature_names: ['lag_1', 'lag_2', 'lag_3', ...],
  plot_type: 'waterfall'
});

console.log('예측값:', explanation.explanation.prediction);
console.log('SHAP 값:', explanation.explanation.shap_values);
console.log('상위 변수:', explanation.explanation.top_positive);

// 전역 변수 중요도
const importance = await xaiService.getGlobalImportance({
  model_name: 'production_forecast',
  plot_type: 'bar'
});

console.log('전역 중요도:', importance.importance.global_feature_importance);

// XAI 리포트 생성
const report = await xaiService.generateReport({
  model_name: 'production_forecast_v2',
  model_type: 'ensemble',
  metrics: { mape: 4.2, mae: 85.3 },
  feature_importance: [
    { feature: 'lag_7d', importance: 0.25 },
    { feature: 'moving_avg_7d', importance: 0.22 }
  ],
  insights: ['lag_7d 변수가 가장 중요합니다'],
  recommendations: ['7일 지연 변수 포함 권장'],
  report_format: 'html'
});

console.log('리포트 경로:', report.report_path);
```

---

## 7. 설치 및 설정

### 7.1 패키지 설치

```bash
# SHAP
pip install shap

# 시각화
pip install matplotlib seaborn plotly

# 템플릿 (HTML 리포트)
pip install jinja2

# Scikit-learn (Permutation Importance)
pip install scikit-learn
```

### 7.2 Django 설정

```python
# config/settings.py

INSTALLED_APPS = [
    ...
    'ml_pipeline',
    'ml_pipeline.xai',
]
```

---

## 8. 파일 구조

```
ml_pipeline/
├── xai/
│   ├── __init__.py
│   ├── shap_explainer.py          # SHAP 기반 예측 설명
│   ├── attention_visualizer.py    # Attention 시각화
│   ├── xai_report.py              # 리포트 생성기
│   ├── api.py                     # XAI API
│   └── urls.py                    # URL 라우팅
```

---

## 9. Phase 1-3 완료 요약

### Phase 1: ML Pipeline V2
- ✅ TFT/Prophet/LSTM 모델
- ✅ 앙상블 시스템
- ✅ 고급 피처 엔지니어링
- ✅ 실시간 데이터 파이프라인

### Phase 2: MLOps
- ✅ Model Registry (MLflow)
- ✅ A/B Testing Framework
- ✅ Model Monitoring
- ✅ CI/CD Pipeline

### Phase 3: XAI
- ✅ SHAP Explainer
- ✅ Attention Visualizer
- ✅ XAI Report Generator
- ✅ API 및 프론트엔드 서비스

---

**문서 버전:** 1.0
**작성자:** AI Architecture Team
**상태:** Phase 3 구현 완료
