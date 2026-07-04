# RUNBOOK

1. docker compose up -d --build
2. gateway: POST /api/v1/simulate/equipment-downtime/
3. gateway: GET /api/v1/core/dashboard/summary/
4. gateway: GET /api/v1/core/events/
5. gateway: GET /api/v1/core/scores/
6. gateway: GET /api/v1/core/alerts/
7. gateway: GET /api/v1/core/tasks/
8. gateway: GET /api/v1/core/forecasts/
9. ocpm-service: GET /graph
