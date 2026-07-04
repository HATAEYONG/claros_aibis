# 기술문서: 샘플 데이터 서비스 활성화 및 API 오류 수정

## 1. 개요

본 문서는 Claros MIS AI Dashboard 프로젝트의 샘플 데이터 서비스 활성화 기능 구현 및 400 Bad Request 오류 수정에 대한 기술 문서입니다.

### 1.1 프로젝트 정보
- **프로젝트명**: Claros MIS AI Dashboard
- **백엔드**: Django REST Framework (포트 8000)
- **프론트엔드**: React + TypeScript + Vite (포트 3000)
- **작성일**: 2026-04-02

### 1.2 수정 사항 요약
| 항목 | 내용 | 상태 |
|------|------|------|
| 샘플 데이터 서비스 활성화 | 샘플 데이터 서비스 활성화/비활성화 토글 기능 구현 | ✅ 완료 |
| 400 Bad Request 오류 수정 | WorkOrder API의 status 파라미터 오류 수정 | ✅ 완료 |
| Django 모델 충돌 해결 | models/와 models.py 충돌 해결 | ✅ 완료 |

---

## 2. 문제 현상 및 원인 분석

### 2.1 샘플 데이터 서비스 관련 문제

**문제 현상:**
```
Error: cannot import name 'ERPSyncServiceManager' from 'erp_sync.models'
```

**원인 분석:**
- Django 앱 레지스트리 혼동으로 인한 모델 충돌
- `models.py`와 `models/` 디렉토리가 공존하여 Django가 모델을 중복 등록
- importlib을 사용한 동적 임포트 시 순환 참조 문제 발생

### 2.2 WorkOrder API 400 Bad Request 오류

**문제 현상:**
```
GET /api/production/work-orders/?status=in_transit&limit=20
Response: 400 Bad Request
Error: "올바르게 선택해 주세요. in_transit 이/가 선택가능항목에 없습니다."
```

**원인 분석:**
- 프론트엔드가 물류 상태값(`in_transit`)을 생산 WorkOrder API에 전달
- WorkOrder 모델의 STATUS_CHOICES에는 `in_transit`가 존재하지 않음
- 유효한 상태값: `planned`, `in_progress`, `completed`, `cancelled`

---

## 3. 해결 방안

### 3.1 샘플 데이터 서비스 활성화

**파일: `erp_sync/views/legacy_views.py`**

ServiceManagerHelper 클래스를 도입하여 importlib 사용을 제거:

```python
class ServiceManagerHelper:
    """ERPSyncServiceManager의 기능을 대체하는 헬퍼 클래스"""

    @staticmethod
    def get_all_services():
        """모든 서비스 설정 조회"""
        if ERPSyncServiceConfig is None:
            return {}
        services = {}
        for config in ERPSyncServiceConfig.objects.all():
            services[config.service_type] = config
        return services

    @staticmethod
    def get_service_config(service_type):
        """특정 서비스 타입의 설정 조회"""
        if ERPSyncServiceConfig is None:
            return None
        try:
            return ERPSyncServiceConfig.objects.get(service_type=service_type)
        except ERPSyncServiceConfig.DoesNotExist:
            return None

    @staticmethod
    def toggle_service(service_type):
        """서비스 활성화/비활성화 토글"""
        config = ServiceManagerHelper.get_service_config(service_type)
        if config:
            config.is_enabled = not config.is_enabled
            config.sync_status = 'idle' if config.is_enabled else 'disabled'
            config.save()
        return config
```

**서비스 활성화 제한 조건:**
- 샘플 데이터 서비스는 모든 ERP 서비스(SAP, FOM)가 비활성화된 경우에만 활성화 가능

### 3.2 Django 모델 충돌 해결

**임시 조치:**
- `models/` 디렉토리를 `models_mapping_backup/`로 임시改名
- Django가 `models.py`를 단일 모델 소스로 사용하도록 설정

**영향 파일:**
- `erp_sync/admin.py`: `apps.get_model()` 사용하여 모델 임포트
- `erp_sync/views/legacy_views.py`: ServiceManagerHelper 패턴 적용
- `erp_sync/sample_data_service.py`: ServiceManagerHelper 패턴 적용

### 3.3 WorkOrder API 400 오류 수정

**파일: `claros-mis-frontend/src/App.tsx` (라인 2422)**

**수정 전:**
```typescript
workOrders = await api.production.getWorkOrders('status=in_transit&limit=20');
```

**수정 후:**
```typescript
workOrders = await api.production.getWorkOrders('status=in_progress&limit=20');
```

**설명:**
- `in_transit` (운송중)은 물류 상태값
- `in_progress` (진행중)는 생산 작업지시 상태값
- 프론트엔드가 올바른 상태값을 사용하도록 수정

---

## 4. 기술 아키텍처

### 4.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                   Port: 3000 (Vite)                         │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  App.tsx         │  │ Production.tsx   │               │
│  │  (물류대시보드)   │  │ (생산대시보드)   │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                     │                           │
│           └──────────┬──────────┘                           │
│                      │                                       │
│              ┌───────▼────────┐                             │
│              │  API Service   │                             │
│              │  (api.ts)      │                             │
│              └───────┬────────┘                             │
└──────────────────────┼──────────────────────────────────────┘
                       │ Vite Proxy
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Django)                           │
│                   Port: 8000                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Endpoints                            │  │
│  │  /api/production/work-orders/                        │  │
│  │  /api/production/work-orders/dashboard/              │  │
│  │  /api/erp-sync/dashboard/executive-summary/          │  │
│  │  /api/erp-sync/service-config/all_services/          │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  WorkOrderViewSet                                    │  │
│  │  ERPSyncServiceConfigViewSet                         │  │
│  │  ServiceManagerHelper                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │              Model Layer                              │  │
│  │  WorkOrder (STATUS_CHOICES)                          │  │
│  │  ERPSyncServiceConfig                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 WorkOrder 상태값 정의

**백엔드 (Django Model):**
```python
STATUS_CHOICES = [
    ('planned', '계획'),
    ('in_progress', '진행중'),
    ('completed', '완료'),
    ('cancelled', '취소'),
]
```

**프론트엔드 (물류 상태값):**
```typescript
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'shipped': return '출고완료';
    case 'in_transit': return '운송중';  // 물류 전용
    case 'pending': return '대기중';
    case 'delayed': return '지연';
    default: return status;
  }
};
```

---

## 5. API 명세서

### 5.1 WorkOrder API

#### WorkOrder 목록 조회
```
GET /api/production/work-orders/
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 | 유효값 |
|----------|------|------|------|--------|
| status | string | 아니오 | 작업 상태 필터 | planned, in_progress, completed, cancelled |
| limit | integer | 아니오 | 반환 건수 제한 | 기본값: 없음 |
| offset | integer | 아니오 | 페이징 오프셋 | 기본값: 0 |

**Response Example:**
```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "order_number": "WO-2412-005",
      "production_line_name": "라인 A",
      "product_name": "제품 A",
      "target_quantity": 1200,
      "actual_quantity": 360,
      "achievement_rate": 30.0,
      "status": "in_progress",
      "status_display": "진행중",
      "planned_start": "2025-12-26T10:33:12.159496+09:00"
    }
  ]
}
```

#### WorkOrder 대시보드
```
GET /api/production/work-orders/dashboard/
```

**Response Example:**
```json
{
  "total_orders": 6,
  "in_progress": 5,
  "completed": 1,
  "average_achievement_rate": 100.0
}
```

### 5.2 ERP Sync Service Config API

#### 서비스 목록 조회
```
GET /api/erp-sync/service-config/all_services/
```

**Response Example:**
```json
{
  "services": [
    {
      "config_id": 1,
      "service_type": "sap",
      "service_name": "SAP ERP 동기화 서비스",
      "is_enabled": false,
      "sync_status": "disabled",
      "success_rate": 0
    },
    {
      "config_id": 2,
      "service_type": "fom",
      "service_name": "FOM ERP 동기화 서비스",
      "is_enabled": false,
      "sync_status": "disabled",
      "success_rate": 0
    },
    {
      "config_id": 3,
      "service_type": "sample",
      "service_name": "샘플 데이터 서비스",
      "is_enabled": true,
      "sync_status": "idle",
      "success_rate": 0
    }
  ],
  "summary": {
    "total_services": 3,
    "enabled_count": 1,
    "disabled_count": 2
  }
}
```

#### 서비스 토글
```
POST /api/erp-sync/service-config/toggle/{service_type}/
```

**Path Parameters:**
| 파라미터 | 타입 | 설명 | 유효값 |
|----------|------|------|--------|
| service_type | string | 서비스 타입 | sap, fom, sample |

**Response Example:**
```json
{
  "service": {
    "config_id": 3,
    "service_type": "sample",
    "service_name": "샘플 데이터 서비스",
    "is_enabled": true,
    "sync_status": "idle"
  },
  "message": "샘플 데이터 서비스이(가) 활성화되었습니다."
}
```

---

## 6. 테스트 결과

### 6.1 API 테스트 결과

| 엔드포인트 | 상태 | 응답 시간 | 데이터 |
|-----------|------|-----------|--------|
| GET /api/production/work-orders/?status=in_progress&limit=20 | 200 OK | <100ms | 5건 반환 |
| GET /api/production/work-orders/dashboard/ | 200 OK | <50ms | 통계 데이터 반환 |
| GET /api/production/lines/ | 200 OK | <100ms | 5개 라인 반환 |
| GET /api/production/daily-productions/weekly_summary/ | 200 OK | <100ms | 주간 요약 반환 |
| GET /api/erp-sync/dashboard/executive-summary/ | 200 OK | <150ms | 경영 요약 반환 |
| GET /api/erp-sync/service-config/all_services/ | 200 OK | <100ms | 3개 서비스 반환 |

### 6.2 프론트엔드 테스트 결과

| 페이지/컴포넌트 | 상태 | 데이터 로딩 | 오류 |
|-----------------|------|-------------|------|
| 물류 관리 (App.tsx) | ✅ 정상 | WorkOrders API 호출 성공 | 없음 |
| 생산 대시보드 (Production.tsx) | ✅ 정상 | 모든 API 호출 성공 | 없음 |
| Vite 프록시 | ✅ 정상 | /api → localhost:8000 | 없음 |

---

## 7. 배포 및 운영 가이드

### 7.1 사전 요구사항
- Python 3.11+
- Node.js 18+
- Django 4.2+
- React 18+

### 7.2 백엔드 실행
```bash
cd claros-mis-backend
python manage.py runserver 8000
```

### 7.3 프론트엔드 실행
```bash
cd claros-mis-frontend
npm run dev
```

### 7.4 서비스 활성화 절차

1. **샘플 데이터 서비스 활성화:**
   ```bash
   # 1. 모든 ERP 서비스 비활성화 확인
   curl -X GET "http://localhost:8000/api/erp-sync/service-config/all_services/"

   # 2. 샘플 서비스 활성화
   curl -X POST "http://localhost:8000/api/erp-sync/service-config/toggle/sample/"
   ```

2. **ERP 서비스로 전환 시:**
   ```bash
   # 1. 샘플 서비스 비활성화
   curl -X POST "http://localhost:8000/api/erp-sync/service-config/toggle/sample/"

   # 2. SAP 또는 FOM 서비스 활성화
   curl -X POST "http://localhost:8000/api/erp-sync/service-config/toggle/sap/"
   ```

### 7.5 모니터링 포인트

| 항목 | 체크 방법 | 정상 기준 |
|------|-----------|-----------|
| 백엔드 서버 | curl http://localhost:8000/api/ | 200 OK |
| 프론트엔드 서버 | curl http://localhost:3000/ | 200 OK |
| WorkOrder API | curl /api/production/work-orders/ | 200 OK |
| 서비스 상태 | curl /api/erp-sync/service-config/all_services/ | 샘플 서비스 enabled |

---

## 8. 향후 개선 사항

### 8.1 모델 충돌 근본 해결
- 현재: `models/` → `models_mapping_backup/` 임시 조치
- 개선안:
  - 모델 매핑 시스템을 별도 앱으로 분리
  - 또는 models.py에 매핑 모델 통합

### 8.2 API 통합
- 현재: 물류 대시보드가 생산 WorkOrder API를 사용
- 개선안: 전용 물류 API 엔드포인트 개발

### 8.3 상태값 표준화
- 현재: 물류와 생산이 다른 상태값 사용
- 개선안: 상태값 표준화 및 통합 enum 정의

---

## 9. 참고 문서

### 9.1 관련 파일

| 파일 | 경로 | 설명 |
|------|------|------|
| Admin 설정 | `erp_sync/admin.py` | Django Admin 설정 (apps.get_model 사용) |
| Legacy Views | `erp_sync/views/legacy_views.py` | ServiceManagerHelper 구현 |
| Sample Data Service | `erp_sync/sample_data_service.py` | 샘플 데이터 생성 서비스 |
| Production Views | `production/views.py` | WorkOrderViewSet 구현 |
| Production Models | `production/models.py` | WorkOrder 모델 정의 |
| Frontend API Service | `claros-mis-frontend/src/services/api.ts` | API 클라이언트 |
| Frontend App | `claros-mis-frontend/src/App.tsx` | 물류 대시보드 (status 수정) |
| Production Dashboard | `claros-mis-frontend/src/components/dashboard/Production.tsx` | 생산 대시보드 |
| Vite Config | `claros-mis-frontend/vite.config.ts` | 프록시 설정 |

### 9.2 로그 및 문제 해결

**발생했던 오류:**
1. `ImportError: cannot import name 'ERPSyncServiceManager'`
   - 해결: ServiceManagerHelper 패턴 도입

2. `400 Bad Request: in_transit is not a valid choice`
   - 해결: status=in_transit → status=in_progress

3. `Conflicting 'erpsalesyearplan' models`
   - 해결: models/ 디렉토리 임시 제거

---

## 10. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-04-02 | 1.0 | 초기 문서 작성 | Claude AI |
| 2026-04-02 | 1.1 | API 오류 수정 내용 추가 | Claude AI |

---

**문서 끝**
