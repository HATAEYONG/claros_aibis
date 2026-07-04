# -*- coding: utf-8 -*-
"""
ChiefOrchestratorAgent - 전체 요청/이벤트를 받아 실행계획을 조립하고 에이전트 체인을 실행

참조 플랫폼: apps/agents/orchestrator/chief.py
"""
import logging
import uuid
from typing import Dict, Any, List, Optional

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from ai.agents.base.registry import registry

logger = logging.getLogger(__name__)


class ChiefOrchestratorAgent(BaseAgent):
    """
    ChiefOrchestratorAgent - 전체 요청/이벤트를 받아 실행계획을 조립하고 에이전트 체인을 실행

    이벤트 기반 오케스트레이션을 담당합니다.
    """
    name = "ChiefOrchestratorAgent"
    description = "전체 요청/이벤트를 받아 실행계획을 조립하고 에이전트 체인을 실행"
    version = "1.0.0"
    domain = "general"
    layer = "orchestration"
    requires_human_approval = False

    # 이벤트 유형별 에이전트 매핑
    EVENT_AGENT_MAP = {
        "KPI_DEVIATION": ["KPIAgent", "RootCauseAgent", "RecommendationAgent"],
        "COST_VARIANCE_BREACH": ["VarianceAgent", "RootCauseAgent", "ScenarioAgent", "RecommendationAgent"],
        "MATERIAL_PRICE_SPIKE": ["RootCauseAgent", "ScenarioAgent", "RecommendationAgent"],
        "BUDGET_OVERRUN": ["VarianceAgent", "ForecastAgent", "RecommendationAgent"],
        "CASHFLOW_STRESS": ["ForecastAgent", "ScenarioAgent", "RecommendationAgent"],
        "DEFECT_CLUSTER": ["RootCauseAgent", "RecommendationAgent"],
        "SUPPLIER_RISK_ALERT": ["PurchasingIntelligenceAgent", "RecommendationAgent"],
        "OUTPUT_SHORTFALL": ["ProductionIntelligenceAgent", "RootCauseAgent", "RecommendationAgent"],
        "CAPACITY_OVERLOAD": ["ProductionIntelligenceAgent", "ScenarioAgent", "RecommendationAgent"],
        "CAPA_OVERDUE": ["QualityIntelligenceAgent", "RootCauseAgent", "RecommendationAgent"],
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        요청을 분석하고 실행 계획을 수립하여 에이전트 체인을 실행

        Args:
            agent_input:
                - query: 요청 질문
                - parameters: 파라미터 (event_type 포함 가능)

        Returns:
            AgentOutput: 실행 결과 및 계획
        """
        params = agent_input.parameters or {}
        query = agent_input.query
        request_id = agent_input.request_id

        logger.info(f"[ChiefOrchestratorAgent] Processing request: {request_id}")

        # 1. 요청 유형 판단
        request_type = self._classify_request(query, params)
        logger.info(f"[ChiefOrchestratorAgent] Request type: {request_type}")

        # 2. 실행 계획 수립
        plan_steps = self._build_plan(request_type, params)
        logger.info(f"[ChiefOrchestratorAgent] Plan steps: {len(plan_steps)}")

        # 3. 순차 실행
        results = []
        accumulated_context = dict(params)

        for i, step in enumerate(plan_steps):
            agent_name = step["agent"]
            step_params = step.get("params", {})

            logger.info(f"[ChiefOrchestratorAgent] Step {i+1}: {agent_name}")

            agent = registry.get(agent_name)
            if not agent:
                logger.warning(f"[ChiefOrchestratorAgent] Agent not found: {agent_name}")
                results.append({
                    "agent": agent_name,
                    "status": "skipped",
                    "confidence": 0.0,
                })
                continue

            step_input = AgentInput(
                request_id=str(uuid.uuid4()),
                query=query,
                parameters={**accumulated_context, **step_params},
                parent_run_id=request_id,
            )

            output = agent.run(step_input)

            results.append({
                "agent": agent_name,
                "status": output.status,
                "confidence": output.confidence,
                "execution_time_ms": output.execution_time_ms,
            })

            # 결과를 다음 단계 컨텍스트에 전달
            accumulated_context["prev_result"] = output.result
            accumulated_context["prev_evidence"] = output.evidence_refs
            accumulated_context["prev_recommendations"] = output.recommendations

            # 에러 발생 시 중단 여부 결정
            if output.status == "error" and step.get("stop_on_error", True):
                logger.error(f"[ChiefOrchestratorAgent] Agent {agent_name} failed, stopping")
                break

        # 결과 집계
        return AgentOutput(
            request_id=request_id,
            agent_name=self.name,
            status="success" if all(r["status"] in ["success", "skipped"] for r in results) else "partial",
            result={
                "plan_type": request_type,
                "steps_executed": len(results),
                "total_steps": len(plan_steps),
                "step_results": results,
                "final_context": accumulated_context,
            },
            evidence_refs=[{
                "evidence_type": "orchestration",
                "source": "chief_orchestrator",
                "description": f"{request_type} - {len(results)}단계 실행 완료",
            }],
            confidence=min([r["confidence"] for r in results if r["confidence"] > 0] or [0]),
            recommendations=self._collect_recommendations(results, accumulated_context),
        )

    def _classify_request(self, query: str, params: dict) -> str:
        """
        요청 분류 - 조회/분석/예측/시뮬레이션/보고서

        Args:
            query: 요청 질문
            params: 파라미터

        Returns:
            str: 요청 유형
        """
        # 이벤트 기반 분류
        if params.get("event_type"):
            return "event_analysis"

        # 키워드 기반 분류
        query_lower = query.lower()

        if "예측" in query or "forecast" in query_lower:
            return "forecast"
        if "시나리오" in query or "what-if" in query_lower:
            return "simulation"
        if "보고서" in query or "report" in query_lower:
            return "report"
        if "원인" in query or "why" in query_lower:
            return "root_cause"
        if "편차" in query or "variance" in query_lower:
            return "variance"
        if "최적화" in query or "optimize" in query_lower:
            return "optimization"

        return "analysis"

    def _build_plan(self, request_type: str, params: dict) -> List[Dict[str, Any]]:
        """
        요청 유형에 따른 실행 계획 수립

        Args:
            request_type: 요청 유형
            params: 파라미터

        Returns:
            List[Dict]: 실행 계획 스텝
        """
        event_type = params.get("event_type", "")

        # 이벤트 기반 매핑
        if event_type in self.EVENT_AGENT_MAP:
            return [
                {
                    "step": i + 1,
                    "agent": agent,
                    "params": {"event_type": event_type, **params},
                    "stop_on_error": False,  # 실패해도 계속 진행
                }
                for i, agent in enumerate(self.EVENT_AGENT_MAP[event_type])
            ]

        # 요청 유형별 기본 계획
        plans = {
            "forecast": [
                {"step": 1, "agent": "ForecastAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "RiskAgent", "params": params, "stop_on_error": False},
            ],
            "simulation": [
                {"step": 1, "agent": "ScenarioAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "OptimizationAgent", "params": params, "stop_on_error": False},
                {"step": 3, "agent": "RecommendationAgent", "params": params, "stop_on_error": False},
            ],
            "root_cause": [
                {"step": 1, "agent": "RootCauseAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "RecommendationAgent", "params": params, "stop_on_error": False},
            ],
            "variance": [
                {"step": 1, "agent": "VarianceAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "RootCauseAgent", "params": params, "stop_on_error": False},
                {"step": 3, "agent": "RecommendationAgent", "params": params, "stop_on_error": False},
            ],
            "optimization": [
                {"step": 1, "agent": "OptimizationAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "ScenarioAgent", "params": params, "stop_on_error": False},
                {"step": 3, "agent": "RecommendationAgent", "params": params, "stop_on_error": False},
            ],
            "report": [
                {"step": 1, "agent": "ReportComposerAgent", "params": params, "stop_on_error": False},
            ],
            "event_analysis": [
                {"step": 1, "agent": "EventDetectionAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "RootCauseAgent", "params": params, "stop_on_error": False},
                {"step": 3, "agent": "RecommendationAgent", "params": params, "stop_on_error": False},
            ],
            "analysis": [
                {"step": 1, "agent": "VarianceAgent", "params": params, "stop_on_error": False},
                {"step": 2, "agent": "RootCauseAgent", "params": params, "stop_on_error": False},
                {"step": 3, "agent": "RecommendationAgent", "params": params, "stop_on_error": False},
            ],
        }

        return plans.get(request_type, plans["analysis"])

    def _collect_recommendations(
        self,
        results: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        에이전트 실행 결과에서 추천사항 수집

        Args:
            results: 에이전트 실행 결과
            context: 최종 컨텍스트

        Returns:
            List[Dict]: 추천사항 목록
        """
        recommendations = []

        # 컨텍스트의 이전 추천사항 추가
        if "prev_recommendations" in context:
            recommendations.extend(context["prev_recommendations"])

        # 결과에서 추가 추천사항 추출
        for result in results:
            if result["status"] == "success":
                agent = registry.get(result["agent"])
                if agent and hasattr(agent, "get_recommendations"):
                    agent_recs = agent.get_recommendations(context)
                    recommendations.extend(agent_recs)

        # 중복 제거 및 우선순위 정렬
        seen = set()
        unique_recs = []
        for rec in recommendations:
            if isinstance(rec, dict):
                title = rec.get("title", "")
                if title and title not in seen:
                    seen.add(title)
                    unique_recs.append(rec)

        # 우선순위 정렬
        priority_order = {"urgent": 1, "high": 2, "medium": 3, "low": 4}
        unique_recs.sort(key=lambda r: priority_order.get(r.get("priority", "low"), 99))

        return unique_recs[:5]  # 최대 5개


class AnalysisPlannerAgent(BaseAgent):
    """
    AnalysisPlannerAgent - 이슈를 조회형/분석형/예측형/시뮬레이션형/보고서형으로 분류

    참조 플랫폼: CLAUDE.md 참조
    """
    name = "AnalysisPlannerAgent"
    description = "이슈를 조회형/분석형/예측형/시뮬레이션형/보고서형으로 분류"
    version = "1.0.0"
    domain = "general"
    layer = "orchestration"

    # 쿼리 유형별 패턴
    QUERY_TYPE_PATTERNS = {
        "query": [r"\?", "보여줘", "알려줘", "what", "show", "tell me"],
        "analysis": ["분석", "analysis", "비교", "compare", "현황"],
        "forecast": ["예측", "forecast", "전망", "projection", "예상"],
        "simulation": ["시나리오", "scenario", "what-if", "가정", "만약"],
        "report": ["보고서", "report", "요약", "summary"],
        "root_cause": ["원인", "root cause", "왜", "why"],
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        쿼리 유형 분석 및 실행 계획 제안

        Args:
            agent_input: 쿼리와 컨텍스트

        Returns:
            AgentOutput: 분석 결과 및 실행 계획
        """
        query = agent_input.query
        params = agent_input.parameters or {}

        # 쿼리 유형 분류
        query_type = self._classify_query_type(query)
        logger.info(f"[AnalysisPlannerAgent] Query type: {query_type}")

        # 실행 계획 제안
        plan = self._suggest_plan(query_type, params)

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "query_type": query_type,
                "suggested_plan": plan,
                "confidence": self._calculate_confidence(query, query_type),
            },
            evidence_refs=[],
            confidence=0.8,
        )

    def _classify_query_type(self, query: str) -> str:
        """쿼리 유형 분류"""
        query_lower = query.lower()

        for query_type, patterns in self.QUERY_TYPE_PATTERNS.items():
            for pattern in patterns:
                if pattern in query_lower:
                    return query_type

        return "analysis"

    def _suggest_plan(self, query_type: str, params: dict) -> List[Dict[str, Any]]:
        """쿼리 유형별 실행 계획 제안"""
        plans = {
            "query": [
                {"step": 1, "agent": "KPIAgent", "description": "KPI 조회"},
            ],
            "analysis": [
                {"step": 1, "agent": "VarianceAgent", "description": "편차 분석"},
                {"step": 2, "agent": "RootCauseAgent", "description": "원인 분석"},
            ],
            "forecast": [
                {"step": 1, "agent": "ForecastAgent", "description": "예측"},
                {"step": 2, "agent": "RiskAgent", "description": "리스크 평가"},
            ],
            "simulation": [
                {"step": 1, "agent": "ScenarioAgent", "description": "시나리오 분석"},
                {"step": 2, "agent": "OptimizationAgent", "description": "최적화"},
            ],
            "report": [
                {"step": 1, "agent": "ReportComposerAgent", "description": "보고서 생성"},
            ],
            "root_cause": [
                {"step": 1, "agent": "RootCauseAgent", "description": "원인 분석"},
                {"step": 2, "agent": "RecommendationAgent", "description": "권고안 생성"},
            ],
        }

        return plans.get(query_type, plans["analysis"])

    def _calculate_confidence(self, query: str, query_type: str) -> float:
        """분류 신뢰도 계산"""
        # 간단한 신뢰도 계산 (실제로는 더 복잡한 로직 필요)
        if query_type == "analysis":
            return 0.7  # 기본값
        return 0.8  # 명확한 패턴이 있는 경우


class IntentAgent(BaseAgent):
    """
    IntentAgent - 사용자 의도 파악

    참조 플랫폼: CLAUDE.md 참조
    """
    name = "IntentAgent"
    description = "사용자 의도 파악 (조회/분석/의사결정/실행)"
    version = "1.0.0"
    domain = "general"
    layer = "orchestration"

    INTENT_PATTERNS = {
        "query": ["?", "어떻게", "얼마", "몇", "보여줘", "알려줘", "what", "how", "show"],
        "analysis": ["분석", "analysis", "비교", "compare", "왜", "why"],
        "decision": ["결정", "decide", "선택", "choose", "승인", "approve"],
        "monitor": ["모니터", "monitor", "확인", "check", "감시"],
        "action": ["실행", "execute", "처리", "process", "진행"],
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """의도 파악"""
        query = agent_input.query
        intent = self._detect_intent(query)

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "intent": intent,
                "confidence": self._calculate_confidence(query, intent),
            },
            evidence_refs=[],
            confidence=0.75,
        )

    def _detect_intent(self, query: str) -> str:
        """의도 감지"""
        query_lower = query.lower()

        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if pattern in query_lower:
                    return intent

        return "query"

    def _calculate_confidence(self, query: str, intent: str) -> float:
        """신뢰도 계산"""
        if intent == "query":
            return 0.7  # 기본값
        return 0.8  # 명확한 패턴이 있는 경우


class ToolRouterAgent(BaseAgent):
    """
    ToolRouterAgent - SQL, 룰, ML, RAG, KG 중 적절한 실행도구 선택

    참조 플랫폼: CLAUDE.md 참조
    """
    name = "ToolRouterAgent"
    description = "SQL, 룰, ML, RAG, KG 중 적절한 실행도구 선택"
    version = "1.0.0"
    domain = "general"
    layer = "orchestration"

    TOOL_CAPABILITIES = {
        "sql": ["numeric", "aggregate", "filter", "join"],
        "rule": ["validation", "compliance", "policy"],
        "ml": ["forecast", "anomaly", "classification", "clustering"],
        "rag": ["document", "policy", "sop", "explanation"],
        "kg": ["relationship", "path", "impact", "dependency"],
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """도구 라우팅"""
        query = agent_input.query
        params = agent_input.parameters or {}

        # 쿼리 분석
        query_type = self._analyze_query_type(query)

        # 적절한 도구 선택
        recommended_tools = self._select_tools(query_type, params)

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "query_type": query_type,
                "recommended_tools": recommended_tools,
                "primary_tool": recommended_tools[0] if recommended_tools else "sql",
            },
            evidence_refs=[],
            confidence=0.8,
        )

    def _analyze_query_type(self, query: str) -> str:
        """쿼리 유형 분석"""
        query_lower = query.lower()

        if any(word in query_lower for word in ["정책", "policy", "sop", "문서", "document"]):
            return "document"
        if any(word in query_lower for word in ["관계", "relationship", "영향", "impact", "경로"]):
            return "graph"
        if any(word in query_lower for word in ["예측", "forecast", "이상", "anomaly"]):
            return "ml"
        if any(word in query_lower for word in ["규칙", "rule", "준수", "compliance"]):
            return "rule"

        return "numeric"

    def _select_tools(self, query_type: str, params: dict) -> List[str]:
        """쿼리 유형별 도구 선택"""
        tool_map = {
            "numeric": ["sql", "ml"],
            "document": ["rag", "sql"],
            "graph": ["kg", "sql"],
            "ml": ["ml", "sql"],
            "rule": ["rule", "sql"],
        }

        return tool_map.get(query_type, ["sql"])
