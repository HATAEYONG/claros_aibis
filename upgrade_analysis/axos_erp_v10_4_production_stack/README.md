# AXOS ERP V10.4 Production Stack

Kafka/Graph/AI/Forecast를 포함한 실전형 scaffold 패키지입니다.

## 구성
- api-gateway (Django)
- event-hub-api (FastAPI)
- ai-risk-service (FastAPI)
- forecasting-service (FastAPI)
- alert-service (FastAPI)
- workflow-service (FastAPI)
- ocpm-service (FastAPI)
- graph-sync-worker
- frontend shell

## 주요 흐름
event publish -> risk scoring -> forecast -> alert/task -> graph update
