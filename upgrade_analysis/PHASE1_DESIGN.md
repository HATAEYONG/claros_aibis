# Phase 1: 핵심 아키텍처 강화 상세 설계

## 1. 개요

Phase 1에서는 대상 플랫폼의 핵심 아키텍처를 강화하여 참조 플랫폼의 기능을 수용할 수 있도록 합니다.

**예상 기간**: 1-2주
**주요 목표**:
1. Copilot 구현
2. Data Hub 확장
3. 이벤트 택소노미 도입

---

## 2. Copilot 구현

### 2.1 설계 개요

참조 플랫폼의 `apps/copilot/` 구조를 참조하여 자연어 질의응답 인터페이스를 구현합니다.

### 2.2 파일 구조

```
claros-mis-backend/
├── ai/
│   ├── copilot/                    # 새로 추가
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py               # 대화 기록 모델
│   │   ├── serializers.py
│   │   ├── views.py                # 채팅 API
│   │   ├── urls.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── chat_service.py     # 채팅 서비스
│   │   │   ├── context_manager.py  # 컨텍스트 관리
│   │   │   └── response_formatter.py
│   │   └── agents/
│   │       ├── __init__.py
│   │       └── copilot_agent.py    # Copilot 전용 에이전트
│   └── agents/
│       └── orchestration/
│           └── chief_orchestrator.py  # ChiefOrchestratorAgent 추가
```

### 2.3 데이터 모델

```python
# ai/copilot/models.py
from django.db import models
from django.contrib.auth.models import User

class Conversation(models.Model):
    """대화 세션"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

class Message(models.Model):
    """대화 메시지"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class ConversationContext(models.Model):
    """대화 컨텍스트"""
    conversation = models.OneToOneField(Conversation, on_delete=models.CASCADE, related_name='context')
    domain = models.CharField(max_length=50, blank=True)
    query_type = models.CharField(max_length=50, blank=True)
    entities = models.JSONField(default=dict, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2.4 API 설계

```python
# ai/copilot/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class ConversationViewSet(viewsets.ModelViewSet):
    """대화 관리 API"""
    permission_classes = [IsAuthenticated]

    def create(self, request):
        """새 대화 시작"""
        pass

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """메시지 전송 및 응답"""
        pass

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """대화 기록 조회"""
        pass

    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """피드백 제공"""
        pass
```

### 2.5 CopilotAgent 구현

```python
# ai/copilot/agents/copilot_agent.py
from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

class CopilotAgent(BaseAgent):
    """AI Copilot 전용 에이전트"""
    name = "CopilotAgent"
    description = "자연어 질의응답, drill-down, 요약 설명"
    version = "1.0.0"
    domain = "general"
    layer = "interface"

    def validate_input(self, agent_input: AgentInput) -> bool:
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        자연어 질문을 처리하여 답변 생성

        Args:
            agent_input: 질문과 컨텍스트

        Returns:
            AgentOutput: 답변, 근거, 관련 질문
        """
        query = agent_input.query
        context = agent_input.context

        # 기존 AgentOrchestrator 활용
        from ai.agent_orchestration_service import AgentOrchestrator
        orchestrator = AgentOrchestrator()

        response = orchestrator.process_query(
            message=query,
            context=context,
            user=agent_input.requested_by
        )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status=response.get('status', 'success'),
            result={
                'answer': response.get('answer', ''),
                'related_queries': response.get('related_queries', []),
            },
            evidence_refs=response.get('evidence', []),
            confidence=response.get('confidence', 0.0),
            recommendations=response.get('recommendations', []),
            warnings=response.get('warnings', []),
            metadata={
                'agent_trace': response.get('agent_trace', []),
                'query_analysis': response.get('metadata', {}).get('query_analysis', {}),
            }
        )
```

### 2.6 ChiefOrchestratorAgent 구현

```python
# ai/agents/orchestration/chief_orchestrator.py
from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.agents.base.registry import registry
from ai.copilot.services.context_manager import ContextManager

class ChiefOrchestratorAgent(BaseAgent):
    """전체 요청/이벤트를 받아 실행계획을 조립하고 에이전트 체인을 실행"""
    name = "ChiefOrchestratorAgent"
    description = "전체 요청/이벤트를 받아 실행계획을 조립하고 에이전트 체인을 실행"
    version = "1.0.0"
    domain = "general"
    layer = "orchestration"

    # 이벤트 유형별 에이전트 매핑
    EVENT_AGENT_MAP = {
        "KPI_DEVIATION": ["KPIAgent", "RootCauseAgent", "RecommendationAgent"],
        "COST_VARIANCE_BREACH": ["VarianceAgent", "RootCauseAgent", "ScenarioAgent", "RecommendationAgent"],
        "MATERIAL_PRICE_SPIKE": ["RootCauseAgent", "ScenarioAgent", "RecommendationAgent"],
        "BUDGET_OVERRUN": ["VarianceAgent", "ForecastAgent", "RecommendationAgent"],
        "CASHFLOW_STRESS": ["ForecastAgent", "ScenarioAgent", "RecommendationAgent"],
        "DEFECT_CLUSTER": ["RootCauseAgent", "RecommendationAgent"],
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        요청을 분석하고 실행 계획을 수립하여 에이전트 체인을 실행

        Args:
            agent_input: 요청과 파라미터

        Returns:
            AgentOutput: 실행 결과 및 계획
        """
        params = agent_input.parameters
        query = agent_input.query
        request_id = agent_input.request_id

        # 1. 요청 유형 판단
        request_type = self._classify_request(query, params)

        # 2. 실행 계획 수립
        plan_steps = self._build_plan(request_type, params)

        # 3. 순차 실행
        results = []
        accumulated_context = dict(params)

        for step in plan_steps:
            agent = registry.get(step["agent"])
            if not agent:
                continue

            step_input = AgentInput(
                request_id=str(uuid.uuid4()),
                query=query,
                parameters={**accumulated_context, **step.get("params", {})},
                parent_run_id=request_id,
            )

            output = agent.run(step_input)
            results.append({
                "agent": step["agent"],
                "status": output.status,
                "confidence": output.confidence,
            })

            # 결과를 다음 단계 컨텍스트에 전달
            accumulated_context["prev_result"] = output.result
            accumulated_context["prev_evidence"] = output.evidence_refs

        return AgentOutput(
            request_id=request_id,
            agent_name=self.name,
            status="success",
            result={
                "plan_type": request_type,
                "steps_executed": len(results),
                "step_results": results,
            },
            evidence_refs=[],
            confidence=min([r["confidence"] for r in results] or [0]),
        )

    def _classify_request(self, query: str, params: dict) -> str:
        """요청 분류 — 조회/분석/예측/시뮬레이션/보고서"""
        if params.get("event_type"):
            return "event_analysis"
        if "예측" in query or "forecast" in query.lower():
            return "forecast"
        if "시나리오" in query or "what-if" in query.lower():
            return "simulation"
        if "보고서" in query or "report" in query.lower():
            return "report"
        if "원인" in query or "why" in query.lower():
            return "root_cause"
        return "analysis"

    def _build_plan(self, request_type: str, params: dict) -> list:
        """요청 유형에 따른 실행 계획 수립"""
        event_type = params.get("event_type", "")

        # 이벤트 기반 매핑
        if event_type in self.EVENT_AGENT_MAP:
            return [
                {"step": i + 1, "agent": agent, "params": {}}
                for i, agent in enumerate(self.EVENT_AGENT_MAP[event_type])
            ]

        # 요청 유형별 기본 계획
        plans = {
            "forecast": [
                {"step": 1, "agent": "ForecastAgent", "params": {}},
                {"step": 2, "agent": "RiskAgent", "params": {}},
            ],
            "simulation": [
                {"step": 1, "agent": "ScenarioAgent", "params": {}},
                {"step": 2, "agent": "RecommendationAgent", "params": {}},
            ],
            "root_cause": [
                {"step": 1, "agent": "RootCauseAgent", "params": {}},
                {"step": 2, "agent": "RecommendationAgent", "params": {}},
            ],
            "analysis": [
                {"step": 1, "agent": "VarianceAgent", "params": {}},
                {"step": 2, "agent": "RootCauseAgent", "params": {}},
                {"step": 3, "agent": "RecommendationAgent", "params": {}},
            ],
        }
        return plans.get(request_type, plans["analysis"])
```

---

## 3. Data Hub 확장

### 3.1 설계 개요

기존 `erp_sync/`를 `data_hub/`로 확장하여 데이터 통합 계층을 강화합니다.

### 3.2 파일 구조

```
claros-mis-backend/
├── data_hub/                          # 새로 추가 (erp_sync 확장)
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ingestion_service.py       # 데이터 수집
│   │   ├── normalization_service.py   # 데이터 정규화
│   │   ├── mart_service.py            # 데이터 마트
│   │   └── sync_service.py            # 실시간 동기화
│   ├── connectors/
│   │   ├── __init__.py
│   │   ├── base_connector.py          # 커넥터 기반 클래스
│   │   ├── mssql_connector.py         # MS SQL 커넥터
│   │   ├── postgres_connector.py      # PostgreSQL 커넥터
│   │   └── api_connector.py           # API 커넥터
│   ├── management/
│   │   └── commands/
│   │       ├── sync_all.py            # 전체 동기화
│   │       ├── sync_realtime.py       # 실시간 동기화
│   │       └── build_marts.py         # 마트 빌드
│   └── tests/
│       ├── test_ingestion.py
│       ├── test_normalization.py
│       └── test_marts.py
```

### 3.3 데이터 모델

```python
# data_hub/models.py
from django.db import models
from django.contrib.auth.models import User

class DataSource(models.Model):
    """데이터 소스 정의"""
    SOURCE_TYPE_CHOICES = [
        ('mssql', 'MS SQL Server'),
        ('postgresql', 'PostgreSQL'),
        ('api', 'REST API'),
        ('file', 'File'),
    ]

    SYNC_SCHEDULE_CHOICES = [
        ('realtime', 'Realtime (15min)'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    connection_params = models.JSONField()  # 호스트, 포트, 사용자 등
    sync_schedule = models.CharField(max_length=20, choices=SYNC_SCHEDULE_CHOICES, default='daily')
    is_active = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

class DataSyncLog(models.Model):
    """데이터 동기화 로그"""
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='sync_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    records_processed = models.IntegerField(default=0)
    records_succeeded = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-started_at']

class DataMart(models.Model):
    """데이터 마트 정의"""
    MART_TYPE_CHOICES = [
        ('fact', 'Fact Table'),
        ('dimension', 'Dimension Table'),
        ('aggregate', 'Aggregate Table'),
    ]

    REFRESH_SCHEDULE_CHOICES = [
        ('realtime', 'Realtime'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    mart_type = models.CharField(max_length=20, choices=MART_TYPE_CHOICES)
    target_table = models.CharField(max_length=100)  # 실제 테이블명
    source_query = models.TextField()  # 소스 쿼리
    refresh_schedule = models.CharField(max_length=20, choices=REFRESH_SCHEDULE_CHOICES)
    is_active = models.BooleanField(default=True)
    last_refresh_at = models.DateTimeField(null=True, blank=True)
    row_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

class DataQualityRule(models.Model):
    """데이터 품질 규칙"""
    RULE_TYPE_CHOICES = [
        ('not_null', 'Not Null'),
        ('unique', 'Unique'),
        ('range', 'Range'),
        ('pattern', 'Pattern'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    target_table = models.CharField(max_length=100)
    target_column = models.CharField(max_length=100)
    rule_params = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 3.4 ingestion_service.py

```python
# data_hub/services/ingestion_service.py
from typing import Dict, Any, List
import logging
from datetime import datetime

from data_hub.models import DataSource, DataSyncLog
from data_hub.connectors.mssql_connector import MSSQLConnector
from data_hub.connectors.postgres_connector import PostgreSQLConnector
from data_hub.connectors.api_connector import APIConnector

logger = logging.getLogger(__name__)

class IngestionService:
    """데이터 수집 서비스"""

    CONNECTOR_MAP = {
        'mssql': MSSQLConnector,
        'postgresql': PostgreSQLConnector,
        'api': APIConnector,
    }

    def __init__(self):
        self.connectors = {}

    def sync_data_source(self, source_id: str) -> DataSyncLog:
        """
        데이터 소스 동기화

        Args:
            source_id: 데이터 소스 ID

        Returns:
            DataSyncLog: 동기화 로그
        """
        source = DataSource.objects.get(id=source_id)

        # 동기화 로그 생성
        sync_log = DataSyncLog.objects.create(
            data_source=source,
            status='running'
        )

        try:
            # 커넥터 가져오기
            connector = self._get_connector(source)
            data = connector.fetch_data()

            # 데이터 저장
            processed = self._process_data(source, data)

            # 동기화 완료
            sync_log.status = 'success'
            sync_log.completed_at = datetime.now()
            sync_log.records_processed = len(data)
            sync_log.records_succeeded = processed
            sync_log.records_failed = len(data) - processed
            sync_log.save()

            # 데이터 소스 업데이트
            source.last_sync_at = datetime.now()
            source.last_sync_status = 'success'
            source.save()

        except Exception as e:
            logger.error(f"Sync failed for {source.name}: {e}")
            sync_log.status = 'failed'
            sync_log.completed_at = datetime.now()
            sync_log.error_message = str(e)
            sync_log.save()

            source.last_sync_status = 'failed'
            source.save()

        return sync_log

    def sync_all_active_sources(self) -> List[DataSyncLog]:
        """모든 활성 데이터 소스 동기화"""
        active_sources = DataSource.objects.filter(is_active=True)
        logs = []

        for source in active_sources:
            log = self.sync_data_source(source.id)
            logs.append(log)

        return logs

    def _get_connector(self, source: DataSource):
        """커넥터 인스턴스 가져오기"""
        connector_class = self.CONNECTOR_MAP.get(source.source_type)
        if not connector_class:
            raise ValueError(f"Unsupported source type: {source.source_type}")

        return connector_class(source.connection_params)

    def _process_data(self, source: DataSource, data: List[Dict]) -> int:
        """데이터 처리 및 저장"""
        # 데이터 정규화 서비스 호출
        from data_hub.services.normalization_service import NormalizationService
        normalizer = NormalizationService()

        return normalizer.normalize_and_store(source, data)
```

---

## 4. 이벤트 택소노미 도입

### 4.1 설계 개요

참조 플랫폼의 `events/taxonomy.py`를 참조하여 이벤트 유형을 정의하고 감지 서비스를 강화합니다.

### 4.2 이벤트 택소노미 정의

```python
# events/taxonomy.py (새로 추가)
from enum import Enum
from typing import Dict, List, Optional

class EventType(Enum):
    """이벤트 유형 정의"""
    # KPI 관련
    KPI_DEVIATION = "KPI_DEVIATION"
    KPI_TARGET_ACHIEVED = "KPI_TARGET_ACHIEVED"

    # 원가 관련
    COST_VARIANCE_BREACH = "COST_VARIANCE_BREACH"
    MATERIAL_PRICE_SPIKE = "MATERIAL_PRICE_SPIKE"
    LABOR_COST_INCREASE = "LABOR_COST_INCREASE"

    # 구매/공급망
    SUPPLIER_RISK_ALERT = "SUPPLIER_RISK_ALERT"
    SUPPLIER_DELIVERY_DELAY = "SUPPLIER_DELIVERY_DELAY"
    INVENTORY_SHORTAGE = "INVENTORY_SHORTAGE"
    INVENTORY_EXCESS = "INVENTORY_EXCESS"

    # 생산
    OUTPUT_SHORTFALL = "OUTPUT_SHORTFALL"
    CAPACITY_OVERLOAD = "CAPACITY_OVERLOAD"
    EQUIPMENT_DOWNTIME = "EQUIPMENT_DOWNTIME"
    PRODUCTION_QUALITY_DECLINE = "PRODUCTION_QUALITY_DECLINE"

    # 품질
    DEFECT_CLUSTER = "DEFECT_CLUSTER"
    CAPA_OVERDUE = "CAPA_OVERDUE"
    QUALITY_TREND_DECLINE = "QUALITY_TREND_DECLINE"
    CUSTOMER_COMPLAINT_SURGE = "CUSTOMER_COMPLAINT_SURGE"

    # 재무
    CASHFLOW_STRESS = "CASHFLOW_STRESS"
    BUDGET_OVERRUN = "BUDGET_OVERRUN"
    ABNORMAL_JOURNAL_PATTERN = "ABNORMAL_JOURNAL_PATTERN"
    RECEIVABLES_OVERDUE = "RECEIVABLES_OVERDUE"

    # 인사
    OVERTIME_SURGE = "OVERTIME_SURGE"
    TURNOVER spike = "TURNOVER_SURGE"
    TRAINING_COMPLIANCE_LOW = "TRAINING_COMPLIANCE_LOW"

    # 거버넌스
    SOP_NONCOMPLIANCE = "SOP_NONCOMPLIANCE"
    APPROVAL_BYPASS = "APPROVAL_BYPASS"
    POLICY_VIOLATION = "POLICY_VIOLATION"

class EventSeverity(Enum):
    """이벤트 심각도"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class EventScope(Enum):
    """이벤트 범위"""
    GLOBAL = "global"
    DEPARTMENT = "department"
    TEAM = "team"
    INDIVIDUAL = "individual"

# 이벤트 유형별 기본 메타데이터
EVENT_METADATA: Dict[EventType, Dict] = {
    EventType.KPI_DEVIATION: {
        "description": "KPI 목표 편차",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["KPIAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
    },
    EventType.COST_VARIANCE_BREACH: {
        "description": "원가 편차 기준 초과",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["VarianceAgent"],
        "response_agents": ["RootCauseAgent", "ScenarioAgent", "RecommendationAgent"],
    },
    EventType.MATERIAL_PRICE_SPIKE: {
        "description": "자재 단가 급등",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["PurchasingIntelligenceAgent"],
        "response_agents": ["ScenarioAgent", "RecommendationAgent"],
    },
    # ... 나머지 이벤트 유형 정의
}

class EventTaxonomy:
    """이벤트 택소노미 유틸리티"""

    @staticmethod
    def get_event_type(event_type_str: str) -> Optional[EventType]:
        """문자열로 이벤트 유형 조회"""
        try:
            return EventType[event_type_str]
        except KeyError:
            return None

    @staticmethod
    def get_event_metadata(event_type: EventType) -> Dict:
        """이벤트 유형별 메타데이터 조회"""
        return EVENT_METADATA.get(event_type, {})

    @staticmethod
    def get_detection_agents(event_type: EventType) -> List[str]:
        """이벤트 감지 에이전트 목록"""
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("detection_agents", [])

    @staticmethod
    def get_response_agents(event_type: EventType) -> List[str]:
        """이벤트 대응 에이전트 목록"""
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("response_agents", [])

    @staticmethod
    def get_default_severity(event_type: EventType) -> EventSeverity:
        """기본 심각도"""
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("default_severity", EventSeverity.MEDIUM)

    @staticmethod
    def get_default_scope(event_type: EventType) -> EventScope:
        """기본 범위"""
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("default_scope", EventScope.DEPARTMENT)
```

### 4.3 이벤트 감지 서비스 강화

```python
# events/services/detection_service.py (기존 파일 확장)
from events.taxonomy import EventType, EventSeverity, EventScope, EventTaxonomy
from events.models import Event
import logging

logger = logging.getLogger(__name__)

class EventDetectionService:
    """이벤트 감지 서비스 (강화 버전)"""

    def detect_event(
        self,
        event_type: EventType,
        scope_type: EventScope,
        scope_id: str,
        observed_value: float,
        threshold_value: float,
        metadata: dict = None
    ) -> Event:
        """
        이벤트 감지 및 생성

        Args:
            event_type: 이벤트 유형
            scope_type: 이벤트 범위
            scope_id: 범위 ID (부서 코드, 팀 ID 등)
            observed_value: 관측값
            threshold_value: 임계값
            metadata: 추가 메타데이터

        Returns:
            Event: 생성된 이벤트
        """
        # 중복 이벤트 확인
        existing = Event.objects.filter(
            event_type=event_type.value,
            scope_type=scope_type.value,
            scope_id=scope_id,
            status='open'
        ).first()

        if existing:
            logger.info(f"Event {event_type.value} already exists for {scope_id}")
            return existing

        # 이벤트 생성
        event = Event.objects.create(
            event_type=event_type.value,
            severity=EventTaxonomy.get_default_severity(event_type).value,
            scope_type=scope_type.value,
            scope_id=scope_id,
            observed_value=observed_value,
            threshold_value=threshold_value,
            metadata=metadata or {}
        )

        logger.info(f"Event detected: {event_type.value} for {scope_id}")

        # 자동 에이전트 실행 트리거
        self._trigger_agents(event)

        return event

    def _trigger_agents(self, event: Event):
        """이벤트 관련 에이전트 자동 실행"""
        event_type = EventTaxonomy.get_event_type(event.event_type)
        if not event_type:
            return

        # 감지 에이전트 실행 (이미 실행되었으므로 대응 에이전트만 실행)
        response_agents = EventTaxonomy.get_response_agents(event_type)

        for agent_name in response_agents:
            # 비동기 실행을 위해 Celery 태스크로 전송
            from events.tasks import execute_agent_for_event
            execute_agent_for_event.delay(event.id, agent_name)
```

---

## 5. 구현 일정

### Week 1

**Day 1-2: Copilot 구현**
- [ ] 데이터 모델 생성 및 마이그레이션
- [ ] ChatService 구현
- [ ] ContextManager 구현
- [ ] CopilotAgent 구현

**Day 3-4: ChiefOrchestratorAgent 구현**
- [ ] ChiefOrchestratorAgent 구현
- [ ] 이벤트 기반 오케스트레이션 로직
- [ ] 에이전트 체인 실행

**Day 5: Copilot API 구현**
- [ ] ConversationViewSet 구현
- [ ] 채팅 API 엔드포인트
- [ ] 피드백 API

### Week 2

**Day 1-3: Data Hub 확장**
- [ ] 데이터 모델 생성
- [ ] 커넥터 구현 (MSSQL, PostgreSQL)
- [ ] IngestionService 구현
- [ ] NormalizationService 구현

**Day 4-5: 이벤트 택소노미**
- [ ] 이벤트 택소노미 정의
- [ ] EventDetectionService 강화
- [ ] 에이전트 자동 실행 트리거

---

## 6. 테스트 계획

### 6.1 Copilot 테스트

```python
# ai/copilot/tests/test_chat_service.py
from django.test import TestCase
from ai.copilot.services.chat_service import ChatService
from ai.copilot.models import Conversation, Message

class ChatServiceTest(TestCase):
    def test_create_conversation(self):
        """대화 생성 테스트"""
        pass

    def test_send_message(self):
        """메시지 전송 테스트"""
        pass

    def test_context_persistence(self):
        """컨텍스트 유지 테스트"""
        pass
```

### 6.2 Data Hub 테스트

```python
# data_hub/tests/test_ingestion.py
from django.test import TestCase
from data_hub.services.ingestion_service import IngestionService

class IngestionServiceTest(TestCase):
    def test_sync_data_source(self):
        """데이터 소스 동기화 테스트"""
        pass

    def test_normalize_data(self):
        """데이터 정규화 테스트"""
        pass
```

### 6.3 이벤트 감지 테스트

```python
# events/tests/test_detection.py
from django.test import TestCase
from events.services.detection_service import EventDetectionService
from events.taxonomy import EventType

class EventDetectionServiceTest(TestCase):
    def test_detect_kpi_deviation(self):
        """KPI 편차 감지 테스트"""
        pass

    def test_agent_triggering(self):
        """에이전트 트리거 테스트"""
        pass
```

---

## 7. 배포 계획

### 7.1 개발 환경
1. 브랜치: feature/phase1-copilot-datahub-events
2. 커밋 메시지 규약:
   - feat: 새 기능
   - fix: 버그 수정
   - refactor: 리팩토링
   - test: 테스트 추가

### 7.2 테스트 환경
1. 마이그레이션 스크립트 실행
2. 테스트 데이터 생성
3. API 테스트
4. 성능 테스트

### 7.3 운영 환경
1. 백업
2. 마이그레이션
3. 기능 테스트
4. 모니터링

---

## 8. 롤백 계획

1. 데이터베이스 마이그레이션 롤백
2. 코드 롤백
3. 설정 롤백

---

**작성자**: Claude Code
**승인자**: [승인 필요]
**버전**: 1.0
