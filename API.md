# Claros MIS-AI Dashboard - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Response Format](#common-response-format)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [KPI Endpoints](#kpi-endpoints)
   - [Financial Endpoints](#financial-endpoints)
   - [Production Endpoints](#production-endpoints)
   - [Quality Endpoints](#quality-endpoints)
   - [Sales Endpoints](#sales-endpoints)
   - [AI Assistant Endpoints](#ai-assistant-endpoints)
   - [Business Process Endpoints](#business-process-endpoints)
6. [Data Models](#data-models)
7. [Rate Limiting](#rate-limiting)
8. [Pagination](#pagination)
9. [Filtering and Sorting](#filtering-and-sorting)
10. [WebSocket Events](#websocket-events)

---

## Overview

The Claros MIS-AI Dashboard provides a RESTful API for accessing all system functionality. The API is built using Django REST Framework and follows REST principles.

### Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://api.yourdomain.com/api`

### API Versioning

The API is versioned using URL prefixes:

- Current version: `/api/v1/`
- Deprecated versions: `/api/v0/` (will be removed in future releases)

### Supported Formats

- Request format: JSON
- Response format: JSON
- Character encoding: UTF-8

---

## Authentication

### JWT Authentication

Most endpoints require authentication using JWT (JSON Web Token).

#### Login

```yaml
POST /api/auth/login/
```

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  },
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Refresh

```yaml
POST /api/auth/refresh/
```

**Request Body:**
```json
{
  "token": "your_expired_token"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new_jwt_token",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### Logout

```yaml
POST /api/auth/logout/
```

**Headers:**
```
Authorization: Bearer your_token
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-12-20T10:00:00Z",
    "request_id": "abc-123-def"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_count": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "timestamp": "2024-12-20T10:00:00Z"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Enter a valid email address"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-12-20T10:00:00Z",
    "request_id": "abc-123-def"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content returned |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `TOKEN_EXPIRED` | JWT token has expired |
| `PERMISSION_DENIED` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |

---

## API Endpoints

### KPI Endpoints

#### Get All KPIs by Category

```yaml
GET /api/financial/kpi/all_kpis/
GET /api/production/kpi/all_kpis/
GET /api/quality/kpi/all_kpis/
GET /api/sales/kpi/all_kpis/
GET /api/purchase/kpi/all_kpis/
GET /api/manufacturing/kpi/all_kpis/
GET /api/accounting/kpi/all_kpis/
GET /api/esg/kpi/all_kpis/
GET /api/reports/kpi/all_kpis/
```

**Query Parameters:**
- `target_date` (string, optional): Target date for KPI calculation (format: YYYY-MM-DD)
- `category` (string, optional): KPI category filter

**Response:**
```json
{
  "target_date": "2024-12-20",
  "total_kpis": 10,
  "kpis": [
    {
      "code": "PROD_001",
      "name": "생산량",
      "value": 1250000,
      "target": 1200000,
      "unit": "개",
      "achievement_rate": 104.17,
      "status": "good",
      "trend": "up",
      "calculated_at": "2024-12-20T15:30:00Z"
    }
  ]
}
```

#### Calculate KPIs

```yaml
POST /api/financial/kpi/calculate/
POST /api/production/kpi/calculate/
```

**Request Body:**
```json
{
  "target_date": "2024-12-20",
  "force_recalculate": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "KPI calculation initiated",
  "task_id": "celery-task-id-123",
  "estimated_completion": "2024-12-20T15:35:00Z"
}
```

#### Get KPI History

```yaml
GET /api/financial/kpi/history/{code}/
```

**Path Parameters:**
- `code` (string): KPI code

**Query Parameters:**
- `start_date` (string): Start date (format: YYYY-MM-DD)
- `end_date` (string): End date (format: YYYY-MM-DD)
- `interval` (string): Time interval (day, week, month)

**Response:**
```json
{
  "kpi_code": "PROD_001",
  "kpi_name": "생산량",
  "data": [
    {
      "date": "2024-12-01",
      "value": 1200000,
      "target": 1200000,
      "achievement_rate": 100.0
    }
  ]
}
```

---

### Financial Endpoints

#### Get Financial Statements

```yaml
GET /api/financial/statements/
```

**Query Parameters:**
- `statement_type` (string): Statement type (balance_sheet, income_statement, cash_flow)
- `period` (string): Period (monthly, quarterly, yearly)
- `year` (integer): Fiscal year
- `month` (integer): Fiscal month

**Response:**
```json
{
  "statement_type": "income_statement",
  "period": "2024-12",
  "items": [
    {
      "account_code": "4000",
      "account_name": "매출액",
      "current_amount": 1250000000,
      "previous_amount": 1200000000,
      "change_amount": 50000000,
      "change_rate": 4.17
    }
  ]
}
```

#### Get Financial Indicators

```yaml
GET /api/financial/indicators/
```

**Query Parameters:**
- `date` (string): Calculation date (format: YYYY-MM-DD)

**Response:**
```json
{
  "calculation_date": "2024-12-20",
  "liquidity": {
    "current_ratio": 1.5,
    "quick_ratio": 1.2,
    "cash_ratio": 0.8
  },
  "profitability": {
    "gross_profit_margin": 35.5,
    "operating_profit_margin": 12.3,
    "net_profit_margin": 8.7
  },
  "growth": {
    "revenue_growth": 4.17,
    "profit_growth": 8.5
  }
}
```

---

### Production Endpoints

#### Get Work Orders

```yaml
GET /api/production/work-orders/
```

**Query Parameters:**
- `status` (string): Filter by status (pending, in_progress, completed)
- `start_date` (string): Start date
- `end_date` (string): End date
- `page` (integer): Page number
- `page_size` (integer): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "wo_no": "WO-2024-1220-001",
      "product_code": "PRD-001",
      "product_name": "제품A",
      "line_code": "LINE-01",
      "plan_qty": 1000,
      "actual_qty": 950,
      "status": "in_progress",
      "start_date": "2024-12-20",
      "end_date": "2024-12-22"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_count": 150
  }
}
```

#### Create Work Order

```yaml
POST /api/production/work-orders/
```

**Request Body:**
```json
{
  "product_code": "PRD-001",
  "line_code": "LINE-01",
  "plan_qty": 1000,
  "start_date": "2024-12-20",
  "end_date": "2024-12-22"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "wo_no": "WO-2024-1220-001",
    "status": "pending"
  }
}
```

#### Get Production Records

```yaml
GET /api/production/records/
```

**Query Parameters:**
- `wo_no` (string): Work order number
- `date` (string): Production date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "wo_no": "WO-2024-1220-001",
      "prod_date": "2024-12-20",
      "plan_qty": 1000,
      "good_qty": 950,
      "defect_qty": 50,
      "yield_rate": 95.0,
      "work_hours": 8.5
    }
  ]
}
```

---

### Quality Endpoints

#### Get Inspections

```yaml
GET /api/quality/inspections/
```

**Query Parameters:**
- `insp_type` (string): Inspection type
- `start_date` (string): Start date
- `end_date` (string): End date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "insp_type": "incoming",
      "insp_date": "2024-12-20",
      "sample_qty": 100,
      "pass_qty": 98,
      "defect_qty": 2,
      "pass_rate": 98.0
    }
  ]
}
```

#### Record Defect

```yaml
POST /api/quality/defects/
```

**Request Body:**
```json
{
  "defect_date": "2024-12-20",
  "defect_type": "dimensional",
  "defect_qty": 10,
  "cause": "Tool wear",
  "action_taken": "Tool replacement"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "defect_no": "DEF-2024-1220-001"
  }
}
```

---

### Sales Endpoints

#### Get Sales Orders

```yaml
GET /api/sales/orders/
```

**Query Parameters:**
- `customer_code` (string): Customer code
- `status` (string): Order status
- `start_date` (string): Start date
- `end_date` (string): End date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "so_no": "SO-2024-1220-001",
      "customer_code": "CUST-001",
      "customer_name": "고객사A",
      "order_date": "2024-12-20",
      "delivery_date": "2024-12-25",
      "total_amount": 5000000,
      "status": "confirmed"
    }
  ]
}
```

#### Get Sales Summary

```yaml
GET /api/sales/summary/
```

**Query Parameters:**
- `period` (string): Period (daily, weekly, monthly)
- `start_date` (string): Start date
- `end_date` (string): End date

**Response:**
```json
{
  "period": "monthly",
  "summary": [
    {
      "period": "2024-12",
      "total_sales": 1250000000,
      "total_quantity": 50000,
      "average_order_value": 25000000,
      "orders_count": 50
    }
  ]
}
```

---

### AI Assistant Endpoints

#### Chat with AI

```yaml
POST /api/ai/chat/
```

**Request Body:**
```json
{
  "message": "이번 달 매출 현황 알려줘",
  "context": {
    "session_id": "session-123",
    "history": [
      {
        "role": "user",
        "content": "안녕하세요"
      },
      {
        "role": "assistant",
        "content": "안녕하세요! 무엇을 도와드릴까요?"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "이번 달(12월) 총 매출은 125억 원으로, 전월 대비 4.17% 증가했습니다.",
  "sql_query": "SELECT SUM(amount) FROM sales WHERE sales_date BETWEEN '2024-12-01' AND '2024-12-31'",
  "data": [
    {
      "period": "2024-12",
      "total_sales": 1250000000
    }
  ],
  "confidence": 0.95,
  "suggestions": [
    "전월 대비 매출 추이를 보시겠습니까?",
    "품목별 매출 현황을 확인하시겠습니까?"
  ]
}
```

#### Text to SQL

```yaml
POST /api/ai/text-to-sql/
```

**Request Body:**
```json
{
  "query": "이번 주 생산량이 가장 높은 제품 TOP 5",
  "domain": "production"
}
```

**Response:**
```json
{
  "success": true,
  "sql": "SELECT product_code, product_name, SUM(quantity) as total_qty FROM production_records WHERE prod_date >= DATE('now', '-7 days') GROUP BY product_code ORDER BY total_qty DESC LIMIT 5",
  "explanation": "최근 7일간 생산 기록을 제품별로 집계하여 생산량이 많은 순서로 상위 5개를 조회합니다.",
  "confidence": 0.92
}
```

#### Execute SQL Query

```yaml
POST /api/ai/execute-sql/
```

**Request Body:**
```json
{
  "sql": "SELECT * FROM production_records WHERE prod_date >= '2024-12-01'",
  "parameters": []
}
```

**Response:**
```json
{
  "success": true,
  "columns": ["id", "wo_no", "prod_date", "plan_qty", "good_qty"],
  "data": [
    [1, "WO-001", "2024-12-01", 1000, 950],
    [2, "WO-002", "2024-12-01", 800, 780]
  ],
  "row_count": 2
}
```

#### Causal Analysis

```yaml
POST /api/ai/analyze/causal/
```

**Request Body:**
```json
{
  "issue": "치수불량율 증가",
  "analysis_depth": 3,
  "include_solutions": true
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "issue": "치수불량율 증가",
    "root_causes": [
      {
        "factor": "설비 노후화",
        "confidence": 0.85,
        "evidence": [
          "설비 가동률 85% (기준 90%)",
          "정기 검사에서 정밀도 저하 확인"
        ]
      },
      {
        "factor": "작업자 숙련도 부족",
        "confidence": 0.72,
        "evidence": [
          "신규 작업자 비율 30% 증가",
          "교육 완료율 60%"
        ]
      }
    ],
    "solutions": [
      {
        "action": "설비 보강",
        "priority": "high",
        "estimated_cost": 50000000,
        "expected_impact": "불량률 2% 감소"
      }
    ]
  }
}
```

---

### Business Process Endpoints

#### O2C (Order to Cash) Process

```yaml
GET /api/business-process/o2c/stages/
```

**Response:**
```json
{
  "success": true,
  "stages": [
    {
      "stage_code": "ORDER_RECEIVED",
      "stage_name": "주문 접수",
      "order_count": 150,
      "value": 750000000,
      "avg_duration_hours": 2.5,
      "issues": []
    },
    {
      "stage_code": "PRODUCTION",
      "stage_name": "생산",
      "order_count": 120,
      "value": 600000000,
      "avg_duration_hours": 48.0,
      "issues": [
        {
          "type": "delay",
          "count": 5,
          "reason": "자재 부족"
        }
      ]
    }
  ]
}
```

#### P2P (Procure to Pay) Process

```yaml
GET /api/business-process/p2p/stages/
```

**Response:**
```json
{
  "success": true,
  "stages": [
    {
      "stage_code": "PURCHASE_REQUEST",
      "stage_name": "구매 요청",
      "request_count": 200,
      "value": 300000000,
      "avg_duration_hours": 4.0
    }
  ]
}
```

---

## Data Models

### KPI Model

```typescript
interface KPI {
  code: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  achievement_rate: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  calculated_at: string;
}
```

### Work Order Model

```typescript
interface WorkOrder {
  id: number;
  wo_no: string;
  product_code: string;
  product_name: string;
  line_code: string;
  plan_qty: number;
  actual_qty: number;
  status: 'pending' | 'in_progress' | 'completed';
  start_date: string;
  end_date: string;
}
```

---

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **Premium users**: 10000 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1703097600
```

---

## Pagination

For list endpoints, use pagination parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Example:**
```
GET /api/production/work-orders/?page=2&page_size=50
```

---

## Filtering and Sorting

### Filtering

Use query parameters for filtering:

```
GET /api/production/work-orders/?status=in_progress&start_date=2024-12-01
```

### Sorting

Use the `ordering` parameter:

```
GET /api/production/work-orders/?ordering=-created_date
```

Prefix with `-` for descending order.

---

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/events/');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Event Types

#### KPI Update Event

```json
{
  "type": "kpi_update",
  "data": {
    "category": "production",
    "kpis": [...]
  },
  "timestamp": "2024-12-20T15:30:00Z"
}
```

#### Alert Event

```json
{
  "type": "alert",
  "data": {
    "severity": "warning",
    "message": "품질 불량률이 기준치를 초과했습니다",
    "kpi_code": "QUAL_005"
  },
  "timestamp": "2024-12-20T15:30:00Z"
}
```

---

## Appendix

### HTTP Methods

| Method | Description |
|--------|-------------|
| GET | Retrieve resource |
| POST | Create resource |
| PUT | Update resource (full) |
| PATCH | Update resource (partial) |
| DELETE | Delete resource |

### Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | Response content type |
| `X-Request-ID` | Unique request identifier |
| `X-RateLimit-Limit` | Rate limit |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Rate limit reset time |

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-31
**Maintained By**: Claros Development Team
