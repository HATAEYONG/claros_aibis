# AI & BI DeepSeeHub Platform 기술 문서

## 📋 프로젝트 개요

**프로젝트명**: AI & BI DeepSeeHub Platform
**목적**: 제조업 통합 관리 시스템 with AI 예측
**개발 환경**:
- Frontend: React + TypeScript + Vite
- Backend: Django + Python 3.11
- Database: PostgreSQL, ERP 연동
- AI/ML: PyTorch, Stable Baselines3, scikit-learn

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vite)                        │
│  React + TypeScript + Tailwind CSS                         │
│  http://localhost:3009/                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────────────┐
│                   Backend (Django)                          │
│  ML Pipeline Modules:                                       │
│  - reinforcement_learning (강화학습)                         │
│  - automl (AutoML)                                          │
│  - xai (XAI, SHAP)                                           │
│  - knowledge_graph (지식 그래프)                            │
│  - forecasting (시계열 예측)                                │
│  http://localhost:8000/                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│              Data Sources                                   │
│  - ERP System (PostgreSQL)                                  │
│  - Production Data                                          │
│  - Quality Data                                             │
│  - Inventory/Financial Data                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 주요 기능 모듈

### 1. 예측 관리 (Prediction)

#### 1.1 예측 모델 관리 (ModelManagement)
- **파일**: `src/components/prediction/ModelManagement.tsx`
- **기능**: ML 모델의 학습, 배포, 성능 모니터링, 버전 관리
- **지원 모델**: LSTM, RandomForest, XGBoost, LightGBM, Prophet, ARIMA, Transformer
- **도메인**: production, quality, sales, inventory, finance, equipment, customer, cost, purchase, logistics, hr

#### 1.2 강화학습 기반 예측 (ReinforcementLearning)
- **파일**: `src/components/prediction/ReinforcementLearning.tsx`
- **기능**: RL 알고리즘을 활용한 적응형 예측
- **RL 알고리즘**: DQN, PPO, A3C
- **주요 탭**:
  - RL 학습: 알고리즘 선택, 하이퍼파라미터 튜닝, 학습 진행 모니터링
  - 적응형 학습: 성능 메트릭, 재학습 권장
  - 드리프트 탐지: DDM, EDDM, ADWIN, Page-Hinkley
  - 앙상블: 모델별 가중치 자동 최적화

#### 1.3 도메인별 예측 (Domain Prediction)

| 컴포넌트 | 파일 | 기능 |
|---------|------|------|
| 4M2E 예측 | `FourM2EPrediction.tsx` | Man, Machine, Material, Method, Environment, Energy 요소별 예측 |
| 4M2E 영향도 예측 | `FourM2EImpactPrediction.tsx` | 각 요소의 영향도 순위 및 위험도 분석 |
| 시나리오 예측 | `ScenarioPrediction.tsx` | 낙관/현실/비관 시나리오별 결과 시뮬레이션 |
| ESG 예측 | `ESGPrediction.tsx` | 환경(E), 사회(S), 지배(G) 지표 예측 |
| 코스 분해 예측 | `CostBreakdownPrediction.tsx` | 4M2E 요소별 원가 분해 예측 |
| 코스 드라이버 예측 | `CostDriverPrediction.tsx` | 원가 동인별 영향도 및 위험도 분석 |

### 2. 데이터 파이프라인 (Data Pipeline)

#### 2.1 데이터 처리 (DataProcessing)
- **파일**: `src/components/datapipeline/DataProcessing.tsx`
- **기능**: ETL 파이프라인 관리, 데이터 소스 관리, 처리 내역 추적
- **파이프라인 단계**: load → clean → transform → validate → export

### 3. AI 챗봇 (AI Chatbot)

| 메뉴 | ID | 기능 |
|------|-----|------|
| 에이전트 챗봇 V2 | `agentChatbotV2` | 멀티 에이전트 챗봇 |
| 온톨로지 AI 어시스턴트 | `ontologyAIAssistant` | 지식 그래프 기반 AI (Gemini) |
| AI 어시스턴트(RAG) | `aiAssistant` | RAG 기반 질의응답 |
| 증거 뷰어 | `evidenceViewer` | 추론 근거 표시 |
| 에이전트 추적 | `agentTrace` | 에이전트 동향 추적 |
| 대화 컨텍스트 | `conversationContext` | 대화 맥락 관리 |
| LLM 설정 | `llmSettings` | LLM 파라미터 설정 |

---

## 🔌 Backend API Endpoints

### Reinforcement Learning API
**Base URL**: `/api/rl/`

| Endpoint | Method | 기능 |
|----------|--------|------|
| `/health/` | GET | 헬스 체크 |
| `/train/` | POST | RL 모델 학습 |
| `/predict/` | POST | RL 기반 예측 |
| `/adapt/` | POST | 적응형 학습 |
| `/adapt/stats/` | GET | 적응 통계 조회 |
| `/drift/detect/` | POST | 개념 드리프트 탐지 |
| `/drift/stats/` | GET | 드리프트 통계 조회 |
| `/performance/update/` | POST | 성능 메트릭 업데이트 |
| `/performance/summary/` | GET | 성능 요약 조회 |
| `/select_model/` | POST | RL 기반 모델 선택 |
| `/ensemble/update_weights/` | POST | 앙상블 가중치 업데이트 |
| `/reward/calculate/` | POST | 리워드 계산 |
| `/info/` | GET | 모듈 정보 조회 |

---

## 📁 프로젝트 구조

```
claros-mis-ai-dashboard/
├── claros-mis-frontend/          # React Frontend
│   └── src/
│       ├── components/
│       │   ├── prediction/         # 예측 관련 컴포넌트
│       │   │   ├── ModelManagement.tsx
│       │   │   ├── ReinforcementLearning.tsx
│       │   │   ├── FourM2EPrediction.tsx
│       │   │   ├── FourM2EImpactPrediction.tsx
│       │   │   ├── ScenarioPrediction.tsx
│       │   │   ├── ESGPrediction.tsx
│       │   │   ├── CostBreakdownPrediction.tsx
│       │   │   └── CostDriverPrediction.tsx
│       │   ├── datapipeline/       # 데이터 파이프라인
│       │   │   └── DataProcessing.tsx
│       │   ├── chat/               # AI 챗봇
│       │   ├── dashboard/          # 대시보드
│       │   ├── knowledge_graph/    # 지식 그래프
│       │   └── ...
│       ├── services/               # API 서비스
│       ├── context/                # React Context
│       └── App.tsx                 # 메인 앱 (라우팅)
│
└── claros-mis-backend/           # Django Backend
    └── ml_pipeline/
        ├── reinforcement_learning/  # 강화학습 모듈
        │   ├── rl_forecaster.py     # RL 예측 엔진
        │   ├── adaptive_learning.py # 적응형 학습
        │   ├── reward_system.py     # 리워드 시스템
        │   ├── api.py               # REST API
        │   └── urls.py              # URL 라우팅
        ├── automl/                  # AutoML
        ├── xai/                     # XAI (SHAP)
        ├── knowledge_graph/         # 지식 그래프
        └── forecasting/            # 시계열 예측
```

---

## 🚀 설치 및 실행 방법

### Frontend 실행
```bash
cd claros-mis-frontend
npm install
npm run dev
# 접속: http://localhost:3009/
```

### Backend 실행
```bash
cd claros-mis-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
# 접속: http://localhost:8000/
```

---

## 🎨 UI 커스터마이징

### 메뉴 색상 테마
```typescript
// App.tsx의 colors 객체
{
  dataPrediction: 'bg-orange-700',           // 데이터 예측 - 주황
  predictionSettingsGroup: 'bg-stone-700',  // 예측 설정 - 회색
  predictionResultsGroup: 'bg-teal-700',    // 예측 결과 - 청록
  aiChatbot: 'bg-sky-700',                 // AI 챗봇 - 스카이
  nextGenAI: 'bg-gradient-to-r from-purple-700 to-pink-700',
  dataPipeline: 'bg-gradient-to-r from-teal-600 to-cyan-600',
}
```

### 주요 버튼 위치 (화면 상단 오른쪽)
1. **온톨로지 AI 어시스턴트** - 브레인 아이콘, 그라데이션 버튼
2. **AI 어시스턴트(RAG)** - 봇 아이콘, 그라데이션 버튼

---

## 📊 데이터 모델

### RLForecaster 모델 파라미터
```python
class RLForecaster:
    rl_algorithm: str    # 'dqn', 'ppo', 'a3c'
    state_dim: int       # 상태 차원 (기본값: 64)
    action_dim: int      # 행동 차원 (기본값: 10)
    learning_rate: float # 학습률 (기본값: 0.001)
    gamma: float         # 할인 인자 (기본값: 0.99)
    buffer_size: int     # 리플레이 버퍼 크기 (기본값: 10000)
```

### 예측 결과 포맷
```typescript
interface PredictionResult {
  forecast: number[];      // 예측값 배열
  dates: string[];         // 예측 날짜
  horizon: number;         // 예측 기간
  action: number;          # RL 선택된 행동
  confidence: number;      # 신뢰도
  generated_at: string;    # 생성 시간
}
```

---

## 🔧 기술 스택

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.x
- **Styling**: Tailwind CSS
- **Icons**: Custom icon components
- **State Management**: React Context API
- **Code Splitting**: React.lazy()

### Backend
- **Framework**: Django 4.x
- **Python**: 3.11
- **ML Libraries**:
  - PyTorch (딥러닝)
  - Stable Baselines3 (강화학습)
  - scikit-learn (머신러닝)
  - Prophet (시계열 예측)
  - Gymnasium (RL 환경)
- **Database**: PostgreSQL
- **API**: Django REST Framework

---

## 📝 최신 업데이트 (2026-04-01)

### 추가된 기능
1. **강화학습 기반 예측**: DQN, PPO, A3C 알고리즘 지원
2. **도메인별 예측 확장**: 4M2E, 시나리오, ESG, 코스 관련 예측 6개 추가
3. **데이터 처리 화면**: ETL 파이프라인 관리 UI
4. **메뉴 구조 재편**: AI 챗봇, 데이터 파이프라인, 데이터 시각화 위치 조정

### 수정된 파일
- `src/App.tsx`: 메뉴 구조, 라우팅, 헤더 버튼 텍스트 수정
- `src/components/prediction/`: 8개 새로운 예측 컴포넌트 추가
- `src/components/datapipeline/DataProcessing.tsx`: 데이터 처리 UI 추가

---

## 🐥 알려진 이슈

### TypeScript 빌드 경고
일부 컴포넌트에서 TypeScript 타입 오류가 있지만, Vite 개발 서버에서는 정상 작동합니다.

### ERP DB 연결
PostgreSQL ERP 데이터베이스(133.186.214.219:27455) 연결이 불안정할 경우 Mock 데이터를 사용합니다.

---

## 💻 API 사용 예시

### 1. 강화학습 모델 학습

```bash
# RL 모델 학습 요청
curl -X POST http://localhost:8000/api/rl/train/ \
  -H "Content-Type: application/json" \
  -d '{
    "train_data": {
      "date": ["2024-01-01", "2024-01-02", "2024-01-03"],
      "value": [100, 102, 98]
    },
    "validation_data": {
      "date": ["2024-01-04", "2024-01-05"],
      "value": [101, 99]
    },
    "target_col": "value",
    "config": {
      "rl_algorithm": "dqn",
      "state_dim": 64,
      "action_dim": 10,
      "episodes": 100
    }
  }'
```

**응답 예시**:
```json
{
  "success": true,
  "training_result": {
    "status": "success",
    "rl_algorithm": "dqn",
    "episodes": 100,
    "final_reward": 0.875,
    "evaluation": {
      "mape": 4.2,
      "mae": 125.5,
      "rmse": 180.3
    },
    "trained_at": "2026-04-01T16:30:00"
  }
}
```

### 2. RL 기반 예측

```bash
# 예측 요청
curl -X POST http://localhost:8000/api/rl/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "date": ["2024-01-01", "2024-01-02", "2024-01-03"],
      "value": [100, 102, 98]
    },
    "horizon": 30,
    "target_col": "value"
  }'
```

**응답 예시**:
```json
{
  "success": true,
  "forecast": {
    "forecast": [99.5, 101.2, 100.8, ...],
    "dates": ["2026-04-02T00:00:00", "2026-04-03T00:00:00", ...],
    "horizon": 30,
    "action": 5,
    "confidence": 0.87,
    "generated_at": "2026-04-01T16:35:00"
  }
}
```

### 3. 개념 드리프트 탐지

```bash
# 드리프트 탐지 요청
curl -X POST http://localhost:8000/api/rl/drift/detect/ \
  -H "Content-Type: application/json" \
  -d '{
    "prediction": 1000.0,
    "actual": 1050.0,
    "baseline_error": 0.05,
    "method": "adwin"
  }'
```

**응답 예시**:
```json
{
  "success": true,
  "drift_detection": {
    "detected": true,
    "confidence": 0.92,
    "drift_magnitude": 0.05,
    "method": "adwin",
    "timestamp": "2026-04-01T16:40:00"
  }
}
```

### 4. 앙상블 가중치 업데이트

```bash
# 앙상블 가중치 업데이트
curl -X POST http://localhost:8000/api/rl/ensemble/update_weights/ \
  -H "Content-Type: application/json" \
  -d '{
    "predictions": {
      "lstm": [100, 102, 98, 101],
      "tft": [99, 101, 99, 100],
      "prophet": [98, 100, 97, 99]
    },
    "actuals": [101, 100, 99, 100],
    "learning_rate": 0.01
  }'
```

**응답 예시**:
```json
{
  "success": true,
  "ensemble_weights": {
    "lstm": 0.40,
    "tft": 0.35,
    "prophet": 0.25
  },
  "normalized_sum": 1.0
}
```

---

## 🧩 컴포넌트별 Props 인터페이스

### ModelManagement Props

```typescript
// No props - uses internal state
interface ModelInfo {
  id: string;
  name: string;
  type: 'LSTM' | 'RandomForest' | 'XGBoost' | 'LightGBM' | 'Prophet' | 'ARIMA' | 'Transformer';
  domain: 'production' | 'quality' | 'sales' | 'inventory' | 'finance' |
           'equipment' | 'customer' | 'cost' | 'purchase' | 'logistics' | 'hr' | 'etc';
  version: string;
  status: 'training' | 'active' | 'deprecated' | 'failed';
  accuracy: number;
  mape: number;
  rmse: number;
  lastTrained: string;
  lastDeployed: string;
  trainingProgress: number;
  description: string;
}

interface TrainingHistory {
  id: string;
  modelId: string;
  startTime: string;
  endTime?: string;
  status: 'completed' | 'failed' | 'running';
  accuracy?: number;
  epochs?: number;
  loss?: number;
  errorMessage?: string;
  progress?: number;
}
```

### ReinforcementLearning Props

```typescript
// No props - uses internal state
interface RLConfig {
  rl_algorithm: 'dqn' | 'ppo' | 'a3c';
  state_dim: number;
  action_dim: number;
  learning_rate: number;
  gamma: number;
  buffer_size: number;
  episodes: number;
}

interface TrainingHistory {
  id: string;
  algorithm: string;
  episodes: number;
  finalReward: number;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  mape?: number;
  mae?: number;
  rmse?: number;
}
```

### FourM2EPrediction Props

```typescript
// No props - uses internal state
interface FactorPrediction {
  factor: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface PredictionModel {
  id: string;
  name: string;
  type: 'LSTM' | 'RandomForest' | 'XGBoost' | 'Prophet';
  accuracy: number;
  lastTrained: string;
}
```

### DataProcessing Props

```typescript
// No props - uses internal state
interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  records: number;
  duration: number;
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'file' | 'api' | 'stream';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
}
```

---

## 🚀 배포 가이드

### 1. 프론트엔드 배포

#### 1.1 빌드

```bash
cd claros-mis-frontend
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

#### 1.2 정적 웹 호스팅 배포 (Nginx 예시)

```nginx
# /etc/nginx/sites-available/claros-mis
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/claros-mis-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 설정
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 1.3 Docker 배포

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# 빌드 및 실행
docker build -t claros-mis-frontend .
docker run -p 80:80 claros-mis-frontend
```

### 2. 백엔드 배포

#### 2.1 환경 변수 설정

```bash
# .env 파일
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/claros_mis
ALLOWED_HOSTS=your-domain.com,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3009,https://your-domain.com
```

#### 2.2 Gunicorn을 사용한 프로덕션 서버

```bash
# Gunicorn 설치
pip install gunicorn

# 실행
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

#### 2.3 Docker 배포

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```bash
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./claros-mis-backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://db:5432/claros_mis
    depends_on:
      - db

  frontend:
    build: ./claros-mis-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=claros_mis
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. CI/CD 파이프라인 (GitHub Actions 예시)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # Frontend 테스트 및 빌드
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd claros-mis-frontend
          npm ci

      - name: Run tests
        run: |
          cd claros-mis-frontend
          npm test

      - name: Build frontend
        run: |
          cd claros-mis-frontend
          npm run build

      # Backend 테스트
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd claros-mis-backend
          pip install -r requirements.txt

      - name: Run tests
        run: |
          cd claros-mis-backend
          python manage.py test

      # 배포
      - name: Deploy to server
        run: |
          # 배포 스크립트 실행
          ssh user@server 'cd /var/www/claros-mis && git pull && ./deploy.sh'
```

---

## 🧪 테스트 방법론

### 1. 단위 테스트 (Unit Test)

#### 1.1 Frontend (React Testing Library)

```typescript
// ModelManagement.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModelManagement from './ModelManagement';

describe('ModelManagement Component', () => {
  test('renders model list', () => {
    render(<ModelManagement />);
    expect(screen.getByText('생산량 예측 모델')).toBeInTheDocument();
  });

  test('switches tabs', async () => {
    render(<ModelManagement />);
    const trainingTab = screen.getByText('학습 관리');
    fireEvent.click(trainingTab);
    await waitFor(() => {
      expect(screen.getByText('학습 진행 중')).toBeInTheDocument();
    });
  });

  test('starts model training', async () => {
    render(<ModelManagement />);
    const trainButton = screen.getByText('모델 학습');
    fireEvent.click(trainButton);
    await waitFor(() => {
      expect(screen.getByText(/학습 완료/)).toBeInTheDocument();
    });
  });
});
```

#### 1.2 Backend (Django Test)

```python
# tests/test_rl_forecaster.py
from django.test import TestCase
from ml_pipeline.reinforcement_learning.rl_forecaster import RLForecaster

class RLForecasterTest(TestCase):
    def setUp(self):
        self.forecaster = RLForecaster(
            rl_algorithm='dqn',
            state_dim=32,
            action_dim=5
        )

    def test_initialization(self):
        self.assertEqual(self.forecaster.rl_algorithm, 'dqn')
        self.assertEqual(self.forecaster.state_dim, 32)
        self.assertFalse(self.forecaster.is_fitted)

    def test_training(self):
        import pandas as pd
        train_data = pd.DataFrame({
            'date': pd.date_range('2024-01-01', periods=100),
            'value': range(100)
        })

        result = self.forecaster.fit(train_data, episodes=10)
        self.assertTrue(result['status'] == 'success')
        self.assertTrue(self.forecaster.is_fitted)

    def test_prediction(self):
        import pandas as pd
        self.forecaster.is_fitted = True
        test_data = pd.DataFrame({
            'date': pd.date_range('2024-01-01', periods=30),
            'value': range(30)
        })

        result = self.forecaster.predict(test_data, horizon=7)
        self.assertIn('forecast', result)
        self.assertEqual(len(result['forecast']), 7)
```

### 2. 통합 테스트 (Integration Test)

```python
# tests/integration/test_rl_api.py
from django.test import TestCase, Client
import json

class RLAPITest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_health_check(self):
        response = self.client.get('/api/rl/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')

    def test_train_and_predict(self):
        # 학습 요청
        train_response = self.client.post('/api/rl/train/',
            data=json.dumps({
                'train_data': {'value': [100, 102, 98]},
                'config': {'rl_algorithm': 'dqn', 'episodes': 10}
            }),
            content_type='application/json'
        )
        self.assertEqual(train_response.status_code, 200)

        # 예측 요청
        predict_response = self.client.post('/api/rl/predict/',
            data=json.dumps({
                'data': {'value': [100, 102, 98]},
                'horizon': 7
            }),
            content_type='application/json'
        )
        self.assertEqual(predict_response.status_code, 200)
        data = predict_response.json()
        self.assertIn('forecast', data)
```

### 3. E2E 테스트 (Playwright)

```typescript
// e2e/rl-prediction.spec.ts
import { test, expect } from '@playwright/test';

test.describe('RL Prediction Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009');
  });

  test('navigate to RL prediction and train model', async ({ page }) => {
    // 메뉴 이동
    await page.click('text=데이터 예측');
    await page.click('text=예측 설정');
    await page.click('text=강화학습 기반 예측');

    // 알고리즘 선택
    await page.click('text=DQN');

    // 학습 시작
    await page.click('text=학습 시작');

    // 학습 진행 확인
    await expect(page.locator('text=학습 진행 중')).toBeVisible();
    await expect(page.locator('text=학습 완료')).toBeVisible({ timeout: 30000 });
  });

  test('check prediction results', async ({ page }) => {
    await page.goto('http://localhost:3009');
    await page.click('text=데이터 예측');
    await page.click('text=4M2E 예측');

    // 예측 결과 확인
    await expect(page.locator('text=Man (인력)')).toBeVisible();
    await expect(page.locator('text=Machine (설비)')).toBeVisible();
  });
});
```

### 4. 성능 테스트 (Locust)

```python
# locustfile.py
from locust import HttpUser, task, between

class RLUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.client.get("/api/rl/health/")

    @task(3)
    def view_prediction(self):
        self.client.post("/api/rl/predict/",
            json={
                "data": {"value": [100, 102, 98]},
                "horizon": 7
            }
        )

    @task(1)
    def check_drift(self):
        self.client.post("/api/rl/drift/detect/",
            json={
                "prediction": 1000,
                "actual": 1050,
                "baseline_error": 0.05
            }
        )
```

```bash
# Locust 실행
locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10
```

### 5. 테스트 커버리지 목표

| 구분 | 커버리지 목표 | 측정 도구 |
|--------|----------------|-----------|
| Frontend Unit | 80% | Jest + React Testing Library |
| Backend Unit | 85% | Django TestCase + pytest |
| Integration | 70% | Django Client + Pytest |
| E2E | 60% | Playwright |
| API Performance | 95% | Locust, JMeter |

---

## 📞 연락처
- **프로젝트**: AI & BI DeepSeeHub Platform
- **개발 환경**: Windows 10, Python 3.11, Node.js
- **버전**: 1.0.0
