# Claros MIS-AI Dashboard 업그레이드 요약

## 업그레이드 개요

**업그레이드 일자:** 2026년 2월 28일
**대상 시스템:** Claros MIS-AI Dashboard Backend & Frontend
**업그레이드 범위:** Django, React, TypeScript, Vite, 의존성 라이브러리, 신규 기능 추가

---

## 1. 백엔드 업그레이드 (Django 5.1)

### 주요 변경사항

| 항목 | 이전 버전 | 새 버전 | 비고 |
|------|-----------|----------|------|
| Django | 4.2.17 | 5.1.0 | 비동기 뷰, 향상된 Admin |
| scikit-learn | 1.6.0 | 1.6.1 | 버그 수정 |
| XGBoost | 2.1.2 | 2.1.3 | 버그 수정 |

### Django 5.1 신규 기능

- **비동기 뷰 지원:** `async_view` 데코레이터로 비동기 뷰 정의 가능
- **향상된 Admin:** 더 나은 성능과 UX
- **데이터베이스 최적화:** 향상된 쿼리 최적화
- **보안 강화:** 업데이트된 보안 헤더 및 설정

### 추가된 기능

#### 1. API 버저닝
```
/api/v1/...  # 현재 버전
/api/v2/...  # 미래 버전 (예약)
```

#### 2. 레이트 리미팅
- 익명 사용자: 100 requests/hour
- 인증 사용자: 1000 requests/hour
- 스태프 사용자: 5000 requests/hour
- 버스트 제한: 10 requests/second

#### 3. Redis 캐싱
- KPI 캐시: 5분 TTL
- 대시보드 캐싱
- 세션 캐싱

#### 4. WebSocket 지원
- 실시간 대시보드 업데이트
- 실시간 KPI 모니터링
- 알림 시스템

---

## 2. 프론트엔드 업그레이드

### 주요 변경사항

| 항목 | 이전 버전 | 새 버전 | 비고 |
|------|-----------|----------|------|
| React | 18.2.0 | 19.0.0 | React Compiler |
| TypeScript | 5.3.3 | 5.7.2 | 타입 시스템 향상 |
| Vite | 5.0.8 | 6.0.7 | 빌드 속도 개선 |
| Tailwind CSS | 3.3.6 | 4.0.6 | 새로운 CSS 방식 |
| React Router | 6.20.0 | 6.28.0 | 안정화 |
| Lucide React | 0.294.0 | 0.468.0 | 아이콘 업데이트 |
| Chart.js | 4.4.0 | 4.4.7 | 버그 수정 |

### React 19 신규 기능

- **React Compiler:** 자동 메모이제이션
- **Server Actions:** 서버 측 액션 지원
- **향상된 Hooks:** `use()` API, `useOptimistic()`
- **타입스크립트 개선:** 더 나은 타입 추론

### Vite 6 신규 기능

- **빌드 속도 향상:** 최대 50% 더 빠른 빌드
- **새로운 플러그인 API:** 더 나은 확장성
- **환경 변수 처리:** 개선된 `.env` 파일 처리

---

## 3. 신규 추가 기능

### 3.1 배치 작업 API
```
POST /api/batch-create/    # 일괄 생성
POST /api/batch-update/    # 일괄 수정
POST /api/batch-delete/    # 일괄 삭제
POST /api/batch-upsert/    # 일괄 생성/수정
```

### 3.2 내보내기/가져오기 API
```
GET  /api/export/csv/      # CSV 내보내기
GET  /api/export/excel/    # Excel 내보내기
GET  /api/export/json/     # JSON 내보내기
POST /api/import/csv/      # CSV 가져오기
POST /api/import/excel/    # Excel 가져오기
POST /api/import/json/     # JSON 가져오기
```

### 3.3 대시보드 집계 API
```
GET /api/dashboard/overview/  # 전체 경영 지표 요약
GET /api/dashboard/kpis/      # 전체 KPI 요약
GET /api/dashboard/trends/    # 월별 트렌드
GET /api/dashboard/alerts/    # 경고 알림
```

### 3.4 AI 채팅 및 분석 API
```
POST /api/ai/chat/                # AI 챗봇
POST /api/ai/sql/text-to-sql/     # Text-to-SQL
GET  /api/ai/ontology/search/     # 온톨로지 검색
POST /api/ai/analysis/causal/     # 인과관계 분석
GET  /api/ai/lot/trace/{lot_no}/  # 로트 추적
```

### 3.5 WebSocket 엔드포인트
```
ws://localhost:8000/ws/dashboard/      # 대시보드 실시간 업데이트
ws://localhost:8000/ws/kpi/           # KPI 실시간 모니터링
ws://localhost:8000/ws/notifications/ # 알림
```

---

## 4. 설정 변경사항

### 4.1 .env 파일
```bash
# 새로 추가된 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
USE_HIREDIS=False

RATELIMIT_ENABLE=True
API_VERSION=v1

CHANNEL_LAYERS=redis
CHANNEL_HOST=localhost
CHANNEL_PORT=6379
```

### 4.2 requirements.txt
```
# 업데이트된 버전
Django==5.1.0
scikit-learn==1.6.1
xgboost==2.1.3

# 이미 포함됨
channels==4.2.0
channels-redis==4.2.1
django-redis==5.4.0
```

### 4.3 package.json
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7",
    "tailwindcss": "^4.0.6"
  }
}
```

---

## 5. 마이그레이션 가이드

### 5.1 데이터베이스 마이그레이션
```bash
# 기존 데이터베이스 백업
python manage.py dumpdata > backup.json

# 마이그레이션 실행
python manage.py makemigrations
python manage.py migrate

# 데이터 복원 (필요시)
python manage.py loaddata backup.json
```

### 5.2 의존성 업그레이드
```bash
# 백엔드
cd claros-mis-backend
pip install -r requirements.txt --upgrade

# 프론트엔드
cd claros-mis-frontend
npm install
```

### 5.3 Redis 서버 시작
```bash
# Windows (Docker)
docker run -d -p 6379:6379 redis:latest

# 또는 로컬 Redis
redis-server
```

---

## 6. 테스트 체크리스트

### 6.1 백엔드 테스트
- [ ] Django 서버 시작 확인
- [ ] API 엔드포인트 응답 확인
- [ ] 레이트 리미팅 동작 확인
- [ ] Redis 캐싱 동작 확인
- [ ] WebSocket 연결 확인

### 6.2 프론트엔드 테스트
- [ ] Vite 개발 서버 시작 확인
- [ ] 컴포넌트 렌더링 확인
- [ ] API 호출 동작 확인
- [ ] 빌드 성공 확인

### 6.3 통합 테스트
- [ ] 로그인/로그아웃
- [ ] 대시보드 로딩
- [ ] KPI 표시
- [ ] 실시간 업데이트

---

## 7. 롤백 절차

### 7.1 백엔드 롤백
```bash
# Git에서 이전 버전으로 복귀
git checkout <commit-hash>

# 의존성 복원
pip install -r requirements.txt

# 마이그레이션 롤백
python manage.py migrate <app> <migration-number>
```

### 7.2 프론트엔드 롤백
```bash
# Git에서 이전 버전으로 복귀
git checkout <commit-hash>

# 의존성 복원
npm install

# 빌드
npm run build
```

---

## 8. 이슈 및 해결 방법

### 8.1 알려진 호환성 문제

| 문제 | 해결 방법 |
|------|-----------|
| PostgreSQL 연결 실패 | SQLite 사용 (`DB_TYPE=sqlite`) |
| Redis 연결 실패 | Docker로 Redis 실행 또는 Redis 설치 |
| WebSocket 연결 실패 | ASGI 서버 사용 (daphne) |

### 8.2 의존성 충돌

```bash
# 의존성 충돌 해결
pip install --force-reinstall <package>
```

---

## 9. 다음 단계

1. **프로덕션 배포 전 테스트:** 모든 기능 테스트
2. **성능 벤치마킹:** 새 버전과 이전 버전 비교
3. **사용자 가이드 업데이트:** 새로운 기능 문서화
4. **모니터링 설정:** Prometheus/Grafana 대시보드 구성

---

## 10. 지원

문제가 발생할 경우:
- GitHub Issues: https://github.com/claros/mis-ai-dashboard/issues
- 기술 문서: `TECHNICAL_DOCUMENTATION.md`
- 데이터베이스 설정: `YH_DATABASE_SETUP.md`
