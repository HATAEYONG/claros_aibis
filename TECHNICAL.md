# Claros MIS-AI Dashboard - Technical Documentation

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [API Specifications](#api-specifications)
6. [Deployment Strategy](#deployment-strategy)
7. [Monitoring & Observability](#monitoring--observability)
8. [Security](#security)
9. [Performance Optimization](#performance-optimization)
10. [Development Workflow](#development-workflow)

---

## System Architecture

### Overall Architecture

The Claros MIS-AI Dashboard follows a modern microservices-inspired architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  React 18 + TypeScript + Vite                              │
│  - Component-based architecture                            │
│  - Real-time data visualization                           │
│  - AI Chatbot interface                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
│  Django REST Framework + CORS                              │
│  - Authentication & Authorization                          │
│  - Request routing & validation                            │
│  - API versioning                                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│  Business Logic │  │   AI/ML      │  │  Integration │
│     Layer       │  │   Services   │  │    Layer     │
│ - Financial     │  │ - LLM        │  │ - ERP Sync   │
│ - Production    │  │ - Forecasting│  │ - External   │
│ - Quality       │  │ - Anomaly    │  │   APIs       │
│ - Sales         │  │   Detection  │  │              │
└─────────────────┘  └──────────────┘  └──────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  PostgreSQL + Redis + Elasticsearch                         │
│  - Relational data storage                                 │
│  - Caching & session management                            │
│  - Full-text search & logging                              │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture

The backend follows Django's app-based modular architecture:

```
claros-mis-backend/
├── config/                 # Project configuration
│   ├── settings.py        # Django settings
│   ├── urls.py           # Root URL configuration
│   ├── celery.py         # Celery configuration
│   └── wsgi.py           # WSGI configuration
│
├── financial/             # Financial management module
│   ├── models.py         # Financial data models
│   ├── views.py          # API endpoints
│   ├── serializers.py    # DRF serializers
│   └── urls.py           # Module URLs
│
├── production/            # Production management module
├── quality/              # Quality management module
├── sales/                # Sales management module
├── purchase/             # Purchase management module
├── cost/                 # Cost management module
├── accounting/           # Management accounting module
├── manufacturing/        # Manufacturing management module
├── productivity/         # Productivity analysis module
├── development/          # Development management module
├── reports/              # Reports module
├── esg/                  # ESG management module
│
├── ai/                   # AI/ML services
│   ├── copilot/          # AI Copilot chat interface
│   ├── forecasting/      # Time series forecasting
│   ├── anomaly_detection/ # Anomaly detection
│   └── ml_pipeline/      # ML pipeline
│
├── business_process/     # O2C, P2P process management
├── domain_agents/        # Domain-specific AI agents
├── erp_sync/            # ERP synchronization
├── ontology/            # Ontology management
│
├── events/              # Event-driven architecture
├── governance/          # Governance layer
├── control_tower/       # Control tower
├── data_hub/            # Data integration layer
├── rag/                 # RAG system
├── integrations/        # External integrations
└── visualization/       # Data visualization
```

### Frontend Architecture

The frontend uses a component-based architecture with React 18:

```
claros-mis-frontend/src/
├── components/
│   ├── common/           # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   │
│   ├── dashboard/        # Dashboard components
│   │   ├── Dashboard.tsx
│   │   ├── DashboardV2.tsx
│   │   ├── Sales.tsx
│   │   ├── Quality.tsx
│   │   ├── Production.tsx
│   │   └── ...
│   │
│   ├── chat/            # AI chatbot components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   └── InputPanel.tsx
│   │
│   ├── auth/            # Authentication components
│   ├── erp/             # ERP integration components
│   ├── prediction/      # Prediction components
│   └── icons/           # Icon components
│
├── context/             # React Context providers
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useKPI.ts
│
├── services/            # API service layer
│   ├── api.ts
│   ├── authService.ts
│   └── kpiService.ts
│
├── utils/               # Utility functions
│   ├── formatters.ts
│   └── validators.ts
│
├── constants/           # Application constants
│   └── endpoints.ts
│
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

---

## Database Schema

### Core Tables

#### Financial Module

```sql
-- Financial Statements
CREATE TABLE financial_statements (
    id SERIAL PRIMARY KEY,
    statement_type VARCHAR(50),  -- balance_sheet, income_statement, cash_flow
    period_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Statement Items
CREATE TABLE financial_items (
    id SERIAL PRIMARY KEY,
    statement_id INTEGER REFERENCES financial_statements(id),
    account_code VARCHAR(20),
    account_name VARCHAR(200),
    current_amount DECIMAL(15,2),
    previous_amount DECIMAL(15,2),
    change_amount DECIMAL(15,2),
    change_rate DECIMAL(5,2)
);

-- Financial KPIs
CREATE TABLE financial_kpis (
    id SERIAL PRIMARY KEY,
    calculation_date DATE NOT NULL,
    liquidity_ratio DECIMAL(5,2),
    profitability_ratio DECIMAL(5,2),
    growth_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Production Module

```sql
-- Work Orders
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    wo_no VARCHAR(50) UNIQUE,
    product_code VARCHAR(50),
    line_code VARCHAR(50),
    plan_qty INTEGER,
    actual_qty INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20)
);

-- Production Records
CREATE TABLE production_records (
    id SERIAL PRIMARY KEY,
    wo_no VARCHAR(50) REFERENCES work_orders(wo_no),
    prod_date DATE NOT NULL,
    plan_qty INTEGER,
    good_qty INTEGER,
    defect_qty INTEGER,
    yield_rate DECIMAL(5,2),
    work_hours DECIMAL(5,2)
);

-- Production KPIs
CREATE TABLE production_kpis (
    id SERIAL PRIMARY KEY,
    calculation_date DATE NOT NULL,
    production_qty INTEGER,
    yield_rate DECIMAL(5,2),
    oee DECIMAL(5,2),
    cycle_time DECIMAL(10,2),
    defect_rate DECIMAL(5,2)
);
```

#### Quality Module

```sql
-- Inspections
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    insp_type VARCHAR(50),
    insp_date DATE NOT NULL,
    sample_qty INTEGER,
    pass_qty INTEGER,
    defect_qty INTEGER,
    pass_rate DECIMAL(5,2)
);

-- Defects
CREATE TABLE defects (
    id SERIAL PRIMARY KEY,
    defect_date DATE NOT NULL,
    defect_type VARCHAR(100),
    defect_qty INTEGER,
    cause TEXT,
    action_taken TEXT
);

-- Quality KPIs
CREATE TABLE quality_kpis (
    id SERIAL PRIMARY KEY,
    calculation_date DATE NOT NULL,
    first_pass_yield DECIMAL(5,2),
    customer_complaints INTEGER,
    supplier_quality_rate DECIMAL(5,2),
    cpk DECIMAL(5,2)
);
```

#### Sales Module

```sql
-- Sales Orders
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    so_no VARCHAR(50) UNIQUE,
    customer_code VARCHAR(50),
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(15,2),
    status VARCHAR(20)
);

-- Sales Records
CREATE TABLE sales_records (
    id SERIAL PRIMARY KEY,
    sales_date DATE NOT NULL,
    customer_code VARCHAR(50),
    product_code VARCHAR(50),
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    amount DECIMAL(15,2)
);

-- Sales KPIs
CREATE TABLE sales_kpis (
    id SERIAL PRIMARY KEY,
    calculation_date DATE NOT NULL,
    monthly_sales DECIMAL(15,2),
    growth_rate DECIMAL(5,2),
    new_customers INTEGER,
    customer_retention_rate DECIMAL(5,2)
);
```

---

## Component Structure

### Frontend Components

#### Dashboard Components

```typescript
// Dashboard.tsx
interface DashboardProps {
  dateRange: DateRange;
  refreshInterval?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ dateRange }) => {
  return (
    <div className="dashboard">
      <KPICards />
      <Charts />
      <DataTable />
    </div>
  );
};
```

#### Chat Components

```typescript
// ChatInterface.tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    // API call to backend
  };

  return (
    <div className="chat-interface">
      <MessageList messages={messages} />
      <InputPanel onSend={sendMessage} />
    </div>
  );
};
```

### Backend Components

#### API Views

```python
# views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class FinancialKPIViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Financial KPI management
    """
    queryset = FinancialKPI.objects.all()
    serializer_class = FinancialKPISerializer

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest KPI data"""
        latest = self.queryset.latest('calculation_date')
        serializer = self.get_serializer(latest)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate KPIs for a specific date"""
        # Business logic for KPI calculation
        pass
```

---

## State Management

### React Context API

The application uses React Context API for global state management:

```typescript
// AuthContext.tsx
interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (credentials: Credentials) => {
    // API call
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Backend State Management

Django's ORM handles backend state management with database transactions:

```python
from django.db import transaction

@transaction.atomic
def create_work_order(data):
    """Create work order with related records"""
    wo = WorkOrder.objects.create(**data['work_order'])
    for item in data['items']:
        WorkOrderItem.objects.create(work_order=wo, **item)
    return wo
```

---

## API Specifications

### REST API Endpoints

#### Authentication

```yaml
POST /api/auth/login/
Description: User authentication
Request Body:
  {
    "username": "string",
    "password": "string"
  }
Response:
  {
    "token": "string",
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string"
    }
  }
```

#### KPI Endpoints

```yaml
GET /api/financial/kpi/all_kpis/
Description: Get all financial KPIs
Parameters:
  - target_date: string (date)
Response:
  {
    "target_date": "string",
    "total_kpis": "integer",
    "kpis": [
      {
        "code": "string",
        "name": "string",
        "value": "number",
        "target": "number",
        "unit": "string",
        "achievement_rate": "number",
        "status": "good|warning|critical"
      }
    ]
  }

GET /api/production/kpi/all_kpis/
Description: Get all production KPIs

GET /api/quality/kpi/all_kpis/
Description: Get all quality KPIs

GET /api/sales/kpi/all_kpis/
Description: Get all sales KPIs
```

#### AI Assistant Endpoints

```yaml
POST /api/ai/chat/
Description: Send message to AI assistant
Request Body:
  {
    "message": "string",
    "context": "object"
  }
Response:
  {
    "response": "string",
    "sql_query": "string",
    "data": "array",
    "confidence": "number"
  }

POST /api/ai/analyze/
Description: Analyze data using AI
Request Body:
  {
    "analysis_type": "causal|predictive|descriptive",
    "parameters": "object"
  }
```

---

## Deployment Strategy

### Development Environment

```bash
# Backend
cd claros-mis-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd claros-mis-frontend
npm install
npm run dev
```

### Production Deployment

#### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./claros-mis-backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./claros-mis-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=claros_mis
      - POSTGRES_USER=claros_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

#### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claros-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: claros-backend
  template:
    metadata:
      labels:
        app: claros-backend
    spec:
      containers:
      - name: backend
        image: claros/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DEBUG
          value: "False"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## Monitoring & Observability

### Logging

```python
# utils/logging_config.py
import logging
import json
from datetime import datetime

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        return json.dumps(log_data)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.FileHandler('/var/log/claros/app.log'),
        logging.StreamHandler()
    ]
)
```

### Metrics Collection

```python
# utils/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'request_duration_seconds',
    'Request duration',
    ['endpoint']
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)
```

---

## Security

### Authentication

JWT-based authentication:

```python
# services/auth.py
import jwt
from datetime import datetime, timedelta

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
```

### Authorization

Role-based access control:

```python
# permissions.py
from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_admin

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
```

---

## Performance Optimization

### Caching Strategy

```python
# Using Redis for caching
from django.core.cache import cache

def get_kpi_data(date):
    cache_key = f'kpi_{date}'
    data = cache.get(cache_key)

    if data is None:
        data = calculate_kpi(date)
        cache.set(cache_key, data, timeout=3600)  # 1 hour

    return data
```

### Database Optimization

```python
# Query optimization
from django.db.models import prefetch_related_objects

def get_work_orders_with_items():
    return WorkOrder.objects.select_related(
        'product', 'line'
    ).prefetch_related(
        'items__material'
    ).all()
```

---

## Development Workflow

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/new-kpi-calculation
# Make changes
git add .
git commit -m "Add new KPI calculation method"
git push origin feature/new-kpi-calculation
# Create pull request
```

### Code Quality

```bash
# Backend linting
pylint claros_mis/
black claros_mis/

# Frontend linting
npm run lint
npm run type-check
```

### Testing

```python
# tests.py
from django.test import TestCase
from rest_framework.test import APIClient

class KPIAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_financial_kpis(self):
        response = self.client.get('/api/financial/kpi/all_kpis/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('kpis', response.data)
```

---

## Conclusion

This technical documentation provides a comprehensive overview of the Claros MIS-AI Dashboard system architecture, components, and development practices. For more specific information, refer to the individual module documentation.

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-31
**Maintained By**: Claros Development Team
