# Enterprise AI Platform 업그레이드 비교 분석 보고서

## 1. 개요

본 보고서는 참조 플랫폼(enterprise_ai_platform)과 대상 플랫폼(claros-mis-ai-dashboard)의 비교 분석 결과를 기반으로 업그레이드 방향성을 제시합니다.

**분석 일자**: 2026-03-31
**참조 플랫폼**: C:\work\claude_AIBIS\claros-mis-ai-upgrade\aibis_enterprise_ai_platform-2\enterprise_ai_platform
**대상 플랫폼**: C:\work\claude_AIBIS\claros-mis-ai-dashboard

---

## 2. 아키텍처 비교

### 2.1 전체 구조

| 구성요소 | 참조 플랫폼 | 대상 플랫폼 | 비고 |
|---------|-------------|-------------|------|
| 백엔드 프레임워크 | Django | Django | 동일 |
| AI 에이전트 | apps/agents/ | ai/agents/ | 구조 유사 |
| 도메인 에이전트 | domain_agents/ | ai/agents/domain/ | 구조 유사 |
| 컨트롤 타워 | apps/control_tower/ | control_tower/ | 동일 |
| 코파일럿 | apps/copilot/ | 미구현 | 필요 |
| 데이터 허브 | apps/data_hub/ | 미구현 | 필요 |
| 지식 그래프 | apps/ontology/ | ontology/ | 확장 필요 |
| RAG | apps/rag/ | ai/vector_store.py | 통합 필요 |
| 이벤트 시스템 | apps/events/ | events/ | 확장 필요 |
| 거버넌스 | apps/governance/ | governance/ | 확장 필요 |
| 에이전트 운영 | apps/agent_ops/ | 미구현 | 필요 |

### 2.2 에이전트 계층 구조

#### 참조 플랫폼의 계층 구조
```
1. Orchestration Layer: ChiefOrchestratorAgent, IntentAgent, AnalysisPlannerAgent
2. Monitoring Layer: KPIAgent, RiskAgent, EventDetectionAgent, PolicyMonitoringAgent
3. Intelligence Layer: DataIntegratorAgent, ContextBuilderAgent
4. Analysis Layer: ForecastAgent, VarianceAgent, RootCauseAgent, ScenarioAgent, OptimizationAgent
5. Decision Layer: RecommendationAgent, ApprovalAdvisorAgent, AlertAgent, ReportComposerAgent
6. Learning Layer: EvaluationAgent, ReflectionAgent, MemoryCuratorAgent, KnowledgeUpdateAgent
7. Governance Layer: GovernanceAgent, AuditAgent
```

#### 대상 플랫폼의 계층 구조
```
1. Orchestration Layer: AgentOrchestrator (서비스 형태)
2. Monitoring Layer: KPIAgent, RiskAgent, EventDetectionAgent, ProcessMonitoringAgent
3. Domain Intelligence: CostIntelligenceAgent, FinanceIntelligenceAgent, etc.
4. Analysis Layer: ForecastAgent, VarianceAgent, RootCauseAgent, ScenarioAgent, OptimizationAgent
5. Decision Layer: AlertAgent, ApprovalAdvisorAgent, RecommendationAgent
6. Learning Layer: EvaluationAgent, ReflectionAgent, MemoryCuratorAgent, KnowledgeUpdateAgent
```

---

## 3. 주요 차이점 분석

### 3.1 BaseAgent 프레임워크

#### 참조 플랫폼
```python
# apps/agents/base/agent.py
class BaseAgent(ABC):
    def execute(self, agent_input: AgentInput) -> AgentOutput
    def validate_input(self, agent_input: AgentInput) -> bool
    def pre_execute(self, agent_input: AgentInput) -> AgentInput
    def post_execute(self, output: AgentOutput) -> AgentOutput
    def run(self, agent_input: AgentInput) -> AgentOutput
```

#### 대상 플랫폼
```python
# ai/agents/base/agent.py
class BaseAgent(ABC):
    def execute(self, agent_input: AgentInput) -> AgentOutput
    def validate_input(self, agent_input: AgentInput) -> bool
    def pre_execute(self, agent_input: AgentInput) -> AgentInput
    def post_execute(self, output: AgentOutput) -> AgentOutput
    def run(self, agent_input: AgentInput) -> AgentOutput
```

**결론**: 구조적으로 동일함. 추가 작업 불필요.

### 3.2 AgentInput/AgentOutput 스키마

두 플랫폼 모두 Pydantic BaseModel을 사용하여 타입 안전성을 보장합니다.

#### 참조 플랫폼
```python
class AgentInput(BaseModel):
    request_id: str
    query: str
    context: dict
    parameters: dict
    evidence_required: bool
    requested_by: str
    parent_run_id: Optional[str]
```

#### 대상 플랫폼
```python
class AgentInput(BaseModel):
    request_id: str
    query: str
    context: dict
    parameters: dict
    evidence_required: bool
    requested_by: str
    parent_run_id: Optional[str]
```

**결론**: 스키마가 동일함. 추가 작업 불필요.

### 3.3 AgentRegistry

#### 참조 플랫폼
```python
class AgentRegistry:
    def register(self, agent: BaseAgent)
    def get(self, name: str) -> BaseAgent | None
    def list_agents(self) -> list[dict]
    def get_by_domain(self, domain: str) -> list[BaseAgent]
    def get_by_layer(self, layer: str) -> list[BaseAgent]
```

#### 대상 플랫폼
```python
class AgentRegistry:
    def register(self, agent: BaseAgent) -> None
    def get(self, name: str) -> Optional[BaseAgent]
    def list_agents(self) -> List[Dict[str, Any]]
    def get_by_domain(self, domain: str) -> List[BaseAgent]
    def get_by_layer(self, layer: str) -> List[BaseAgent]
    def get_by_name_pattern(self, pattern: str) -> List[BaseAgent]  # 추가됨
    def count(self) -> int  # 추가됨
```

**결론**: 대상 플랫폼이 더 확장됨. 추가 작업 불필요.

### 3.4 오케스트레이션

#### 참조 플랫폼
- ChiefOrchestratorAgent: 이벤트 기반 에이전트 체인 실행
- AnalysisPlan DB 저장
- EVENT_AGENT_MAP 기반 자동 라우팅

#### 대상 플랫폼
- AgentOrchestrator 서비스: 자연어 쿼리 기반 라우팅
- QueryAnalyzer: 쿼리 타입, 도메인, 의도 분석
- ResponseBuilder: 결과 통합 및 응답 생성

**결론**: 대상 플랫폼이 더 발전된 자연어 처리 기능 보유. 참조 플랫폼의 이벤트 기반 오케스트레이션 추가 필요.

---

## 4. 누락된 핵심 컴포넌트

### 4.1 Copilot (챗봇 인터페이스)

**참조 플랫폼**: apps/copilot/
- 자연어 질의응답 인터페이스
- drill-down 기능
- 근거 연결
- 보고서 생성

**대상 플랫폼**: 미구현

**업그레이드 필요**: ✅

### 4.2 Data Hub (데이터 통합 계층)

**참조 플랫폼**: apps/data_hub/
- ERP 데이터 수집
- 데이터 정규화
- 마트 생성
- 실시간 동기화

**대상 플랫폼**: erp_sync/ (부분적으로 존재)
- MS SQL ERP 연동
- 기본 동기화 기능

**업그레이드 필요**: ✅ (확장)

### 4.3 Ontology (지식 그래프)

**참조 플랫폼**: apps/ontology/
- 기업 온톨로지 정의
- 개체 관계 매핑
- 그래프 쿼리

**대상 플랫폼**: ontology/ (기본 모델만 존재)

**업그레이드 필요**: ✅ (확장)

### 4.4 RAG (문서 검색)

**참조 플랫폼**: apps/rag/
- 문서 청킹
- 벡터화
- 의미적 검색
- 근거 연결

**대상 플랫폼**: ai/vector_store.py (기본 벡터 저장소만 존재)

**업그레이드 필요**: ✅ (확장)

### 4.5 Agent Ops (에이전트 운영)

**참조 플랫폼**: apps/agent_ops/
- 에이전트 실행 모니터링
- 성능 메트릭
- 실패 추적
- 평가 대시보드

**대상 플랫폼**: 미구현

**업그레이드 필요**: ✅

---

## 5. 참조 플랫폼의 고급 기능

### 5.1 이벤트 택소노미 (events/taxonomy.py)

```python
# 이벤트 유형 정의
EVENT_FAMILIES = [
    "KPI_DEVIATION",
    "COST_VARIANCE_BREACH",
    "MATERIAL_PRICE_SPIKE",
    "SUPPLIER_RISK_ALERT",
    "OUTPUT_SHORTFALL",
    "CAPACITY_OVERLOAD",
    "DEFECT_CLUSTER",
    "CAPA_OVERDUE",
    "CASHFLOW_STRESS",
    "BUDGET_OVERRUN",
    "ABNORMAL_JOURNAL_PATTERN",
    "OVERTIME_SURGE",
    "SOP_NONCOMPLIANCE",
    "APPROVAL_BYPASS",
]
```

### 5.2 승인 정책 (governance/agents.py)

- ApprovalAdvisorAgent: 정책 및 위험도 기반 승인 레벨 권고
- 승인 레벨: Auto, Notify, Manager, Director, Executive, Board
- 금액 영향, 정책 위반 심각도, 고객 영향도 고려

### 5.3 학습 루프 (agents/learning/)

- EvaluationAgent: 예측, 경고, 추천 품질 측정
- ReflectionAgent: 학습 포인트 추출
- MemoryCuratorAgent: 장기 기억 저장
- KnowledgeUpdateAgent: 지베이스 업데이트

---

## 6. 업그레이드 우선순위

### Phase 1: 핵심 아키텍처 강화 (1-2주)

1. **Copilot 구현**
   - 자연어 질의응답 인터페이스
   - 기존 AgentOrchestrator와 연동
   - 근거 연결 및 drill-down

2. **Data Hub 확장**
   - 기존 erp_sync를 data_hub로 확장
   - 데이터 마트 생성
   - 실시간 동기화 강화

3. **이벤트 택소노미 도입**
   - 참조 플랫폼의 events/taxonomy.py 참조
   - 이벤트 감지 서비스 강화

### Phase 2: 지능 계층 확장 (2-3주)

1. **Ontology 확장**
   - 기업 온톨로지 정의
   - 개체 관계 매핑
   - 그래프 쿼리 지원

2. **RAG 시스템 구축**
   - 문서 청킹 및 벡터화
   - 의미적 검색
   - 근거 연결

3. **Control Tower 강화**
   - 경영관점 대시보드
   - KPI 통합
   - 알림 관리

### Phase 3: 거버넌스 및 운영 (2-3주)

1. **거버넌스 강화**
   - GovernanceAgent, AuditAgent 도입
   - 승인 정책 자동화
   - 컴플라이언스 모니터링

2. **Agent Ops 구현**
   - 에이전트 실행 모니터링
   - 성능 메트릭
   - 평가 대시보드

3. **학습 루프 완성**
   - EvaluationAgent 강화
   - ReflectionAgent 구현
   - MemoryCuratorAgent 구현

### Phase 4: 통합 및 최적화 (1-2주)

1. **ChiefOrchestratorAgent 도입**
   - 이벤트 기반 오케스트레이션
   - AnalysisPlan DB 저장

2. **프론트엔드 통합**
   - Copilot UI
   - Control Tower UI
   - Agent Ops UI

3. **성능 최적화**
   - 캐싱 전략
   - 배치 처리
   - 비동기 처리

---

## 7. 기술적 제약사항

### 7.1 참조 플랫폼 코드 직접 복사 금지
- 참조 플랫폼의 코드는 구조 참조만 가능
- 대상 플랫폼의 기존 구현을 존중하면서 확장

### 7.2 대상 플랫폼의 기존 구현 유지
- 기존 에이전트 구조 유지
- 기존 API 호환성 유지
- 점진적 업그레이드

### 7.3 데이터베이스 호환성
- 기존 스키마 유지
- 마이그레이션 스크립트 제공
- 롤백 계획 수립

---

## 8. 권장사항

### 8.1 아키텍처 원칙 준수

1. **Overlay, Not Replacement**: ERP 대체 아닌 인텔리전스 레이어 구축
2. **Process First, Module Second**: 프로세스 우선, 모듈은 나중에
3. **Structured First, LLM Second**: 구조화 데이터는 SQL/Rule/ML 우선
4. **Evidence Required**: 모든 결과에 근거 필수
5. **Human-in-the-Loop**: 사람 승인 전제

### 8.2 구현 전략

1. **점진적 구현**: Phase별로 나누어 구현
2. **테스트 주도**: 각 Phase별 테스트 작성
3. **문서화**: API 문서, 아키텍처 문서 작성
4. **코드 리뷰**: 참조 플랫폼과 비교하면서 리뷰

### 8.3 성능 고려사항

1. **캐싱 전략**: KPI 계산 결과 캐싱
2. **배치 처리**: 대량 데이터 처리는 배치로
3. **비동기 처리**: Celery를 활용한 백그라운드 작업
4. **메모리 관리**: 벡터 데이터 메모리 최적화

---

## 9. 다음 단계

1. 본 분석 보고서 승인 요청
2. Phase 1 상세 설계 작성
3. 개발 계획 수립
4. 팀 역할 분담

---

## 10. 참고 문헌

1. 참조 플랫폼 CLAUDE.md
2. 대상 플랫폼 settings.py
3. 참조 플랫폼 agents/base/agent.py
4. 대상 플랫폼 ai/agents/base/agent.py
5. 참조 플랫폼 governance/agents.py

---

**작성자**: Claude Code
**승인자**: [승인 필요]
**버전**: 1.0
