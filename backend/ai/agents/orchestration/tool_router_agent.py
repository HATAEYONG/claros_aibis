# -*- coding: utf-8 -*-
"""
ToolRouterAgent — 실행 방법 선택 에이전트 (Orchestration Layer)

요청을 분석하여 최적의 실행 방법을 선택하고 경로를 지정합니다.

실행 방법:
1. Direct SQL: 단순 데이터 조회
2. Agent Chain: 복잡한 분석 작업
3. External API: 외부 서비스 연동
4. Cache: 캐시된 결과 재사용
5. Local Processing: 간단한 계산

선택 기준:
- 요청 복잡도
- 데이터 크기
- 시간 제약
- 리소스 가용성
- 이전 실행 결과
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class ExecutionMethod(BaseAgent):
    """실행 방법 정의"""

    def __init__(
        self,
        name: str,
        description: str,
        complexity_score: float,
        estimated_time_ms: int,
        required_resources: List[str],
        success_rate: float,
        can_cache: bool = True
    ):
        self.name = name
        self.description = description
        self.complexity_score = complexity_score
        self.estimated_time_ms = estimated_time_ms
        self.required_resources = required_resources
        self.success_rate = success_rate
        self.can_cache = can_cache


class ToolRouterAgent(BaseAgent):
    """
    Tool Router Agent

    요청을 분석하여 최적의 실행 방법을 선택합니다.
    """

    name = "ToolRouterAgent"
    description = "실행 방법 선택 및 경로 지정"
    version = "1.0.0"
    domain = "orchestration"
    layer = "orchestration"
    requires_human_approval = False

    # 실행 방법 정의
    EXECUTION_METHODS = {
        "direct_sql": ExecutionMethod(
            name="direct_sql",
            description="직접 SQL 쿼리 실행",
            complexity_score=0.2,
            estimated_time_ms=100,
            required_resources=["database"],
            success_rate=0.98,
            can_cache=True
        ),
        "agent_chain": ExecutionMethod(
            name="agent_chain",
            description="에이전트 체인 실행",
            complexity_score=0.8,
            estimated_time_ms=5000,
            required_resources=["agents", "llm"],
            success_rate=0.85,
            can_cache=False
        ),
        "external_api": ExecutionMethod(
            name="external_api",
            description="외부 API 호출",
            complexity_score=0.5,
            estimated_time_ms=2000,
            required_resources=["api", "network"],
            success_rate=0.90,
            can_cache=True
        ),
        "cache": ExecutionMethod(
            name="cache",
            description="캐시된 결과 반환",
            complexity_score=0.1,
            estimated_time_ms=10,
            required_resources=["cache"],
            success_rate=0.99,
            can_cache=True
        ),
        "local_processing": ExecutionMethod(
            name="local_processing",
            description="로컬 계산 처리",
            complexity_score=0.3,
            estimated_time_ms=50,
            required_resources=["cpu"],
            success_rate=0.95,
            can_cache=False
        ),
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return bool(agent_input.query or agent_input.parameters)

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """실행 방법 선택 및 경로 지정"""
        params = agent_input.parameters

        # 1. 요청 분석
        request_analysis = self._analyze_request(agent_input)

        # 2. 캐시 확인
        cached_result = self._check_cache(agent_input)
        if cached_result and params.get("use_cache", True):
            logger.info(f"캐시 적중: {agent_input.request_id}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "selected_method": "cache",
                    "cached_result": cached_result,
                    "request_analysis": request_analysis,
                },
                evidence_refs=[
                    self.create_evidence_ref(
                        "cache",
                        "redis_cache",
                        agent_input.request_id,
                        "캐시된 결과 반환"
                    )
                ],
                confidence=0.99,
                metadata={
                    "cache_hit": True,
                    "bypassed_agents": True
                }
            )

        # 3. 실행 방법 선택
        selected_method = self._select_execution_method(
            agent_input,
            request_analysis
        )

        # 4. 실행 계획 생성
        execution_plan = self._create_execution_plan(
            agent_input,
            selected_method,
            request_analysis
        )

        # 5. 다음 에이전트 결정
        next_agents = self._determine_next_agents(
            agent_input,
            selected_method,
            execution_plan
        )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "selected_method": selected_method.name,
                "method_description": selected_method.description,
                "execution_plan": execution_plan,
                "request_analysis": request_analysis,
                "estimated_time_ms": selected_method.estimated_time_ms,
            },
            evidence_refs=[
                self.create_evidence_ref(
                    "routing_decision",
                    "tool_router",
                    f"route_{agent_input.request_id}",
                    f"실행 방법: {selected_method.name}",
                    {
                        "method": selected_method.name,
                        "complexity_score": selected_method.complexity_score,
                        "confidence": execution_plan.get("confidence", 0.8)
                    }
                )
            ],
            confidence=execution_plan.get("confidence", 0.8),
            next_agents=next_agents,
            recommendations=self._generate_routing_recommendations(
                agent_input,
                selected_method,
                execution_plan
            ),
            metadata={
                "complexity_score": request_analysis["complexity_score"],
                "data_size_estimate": request_analysis.get("data_size_estimate"),
                "time_constraint": params.get("time_constraint"),
            }
        )

    def _analyze_request(self, agent_input: AgentInput) -> Dict[str, Any]:
        """요청 특성 분석"""
        query = agent_input.query.lower()
        params = agent_input.parameters

        complexity_indicators = {
            "keywords": [],
            "operations": [],
            "complexity_score": 0.0,
            "data_size_estimate": "small",
        }

        # 복잡도 키워드 분석
        high_complexity_keywords = [
            "분석", "분석해", "분석해줘", "분석해주세요",
            "예측", "예측해", "예측해줘",
            "최적화", "최적화해",
            "시나리오", "what-if", "what if",
            "근본원인", "원인분석",
            "추천", "개선안",
            "비교", "비교해",
            "트렌드", "추세",
        ]

        medium_complexity_keywords = [
            "조회", "가져와", "보여줘",
            "통계", "요약",
            "목록", "리스트",
            "필터링", "검색",
        ]

        low_complexity_keywords = [
            "값", "갯수", "개수",
            "합계", "평균",
            "최대", "최소",
        ]

        # 키워드 매칭
        for keyword in high_complexity_keywords:
            if keyword in query:
                complexity_indicators["keywords"].append(keyword)
                complexity_indicators["complexity_score"] += 0.3

        for keyword in medium_complexity_keywords:
            if keyword in query:
                complexity_indicators["keywords"].append(keyword)
                complexity_indicators["complexity_score"] += 0.15

        for keyword in low_complexity_keywords:
            if keyword in query:
                complexity_indicators["keywords"].append(keyword)
                complexity_indicators["complexity_score"] += 0.05

        # 연산자 분석
        if "join" in params or "집계" in query or "그룹핑" in query:
            complexity_indicators["operations"].append("aggregation")
            complexity_indicators["complexity_score"] += 0.2

        if any(word in query for word in ["계산", "연산", "공식"]):
            complexity_indicators["operations"].append("calculation")
            complexity_indicators["complexity_score"] += 0.15

        # 복잡도 점수 정규화
        complexity_indicators["complexity_score"] = min(
            complexity_indicators["complexity_score"], 1.0
        )

        # 데이터 크기 추정
        time_range = params.get("time_range", params.get("days", 30))
        if isinstance(time_range, str):
            # 문자열인 경우 처리
            time_range = 30

        if time_range > 365:
            complexity_indicators["data_size_estimate"] = "large"
        elif time_range > 90:
            complexity_indicators["data_size_estimate"] = "medium"
        else:
            complexity_indicators["data_size_estimate"] = "small"

        return complexity_indicators

    def _check_cache(self, agent_input: AgentInput) -> Optional[Dict[str, Any]]:
        """캐시 확인"""
        try:
            from django.core.cache import cache

            cache_key = f"tool_router:{agent_input.query}:{agent_input.domain}"
            cached = cache.get(cache_key)

            if cached:
                return cached

        except Exception as e:
            logger.warning(f"캐시 확인 실패: {e}")

        return None

    def _select_execution_method(
        self,
        agent_input: AgentInput,
        request_analysis: Dict[str, Any]
    ) -> ExecutionMethod:
        """최적 실행 방법 선택"""

        complexity = request_analysis["complexity_score"]
        params = agent_input.parameters

        # 복잡도가 매우 낮은 경우: Direct SQL
        if complexity < 0.3:
            if self._is_simple_query(agent_input):
                return self.EXECUTION_METHODS["direct_sql"]
            else:
                return self.EXECUTION_METHODS["local_processing"]

        # 복잡도가 중간인 경우
        elif complexity < 0.6:
            # 데이터 크기 고려
            if request_analysis["data_size_estimate"] == "large":
                return self.EXECUTION_METHODS["direct_sql"]
            else:
                # 외부 API가 필요한지 확인
                if self._requires_external_api(agent_input):
                    return self.EXECUTION_METHODS["external_api"]
                else:
                    return self.EXECUTION_METHODS["agent_chain"]

        # 복잡도가 높은 경우: Agent Chain
        else:
            return self.EXECUTION_METHODS["agent_chain"]

    def _is_simple_query(self, agent_input: AgentInput) -> bool:
        """단순 쿼리인지 확인"""
        simple_patterns = [
            "갯수", "개수", "총", "합계", "평균",
            "count", "sum", "avg",
        ]

        query = agent_input.query.lower()
        return any(pattern in query for pattern in simple_patterns)

    def _requires_external_api(self, agent_input: AgentInput) -> bool:
        """외부 API 필요 여부 확인"""
        external_api_keywords = [
            "날씨", "환율", "주가", "외부",
            "weather", "exchange", "stock",
        ]

        query = agent_input.query.lower()
        return any(keyword in query for keyword in external_api_keywords)

    def _create_execution_plan(
        self,
        agent_input: AgentInput,
        selected_method: ExecutionMethod,
        request_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """실행 계획 생성"""

        plan = {
            "method": selected_method.name,
            "steps": [],
            "estimated_time_ms": selected_method.estimated_time_ms,
            "required_resources": selected_method.required_resources,
            "confidence": 0.8,
        }

        # 단계별 실행 계획
        if selected_method.name == "direct_sql":
            plan["steps"] = [
                {"step": 1, "action": "parse_query", "description": "쿼리 파싱"},
                {"step": 2, "action": "execute_sql", "description": "SQL 실행"},
                {"step": 3, "action": "format_results", "description": "결과 포맷팅"},
            ]

        elif selected_method.name == "agent_chain":
            plan["steps"] = [
                {"step": 1, "action": "route_agents", "description": "에이전트 라우팅"},
                {"step": 2, "action": "execute_agents", "description": "에이전트 실행"},
                {"step": 3, "action": "aggregate_results", "description": "결과 집계"},
            ]

            # 체인에 포함될 에이전트 결정
            chain_agents = self._determine_agent_chain(agent_input)
            plan["agent_chain"] = chain_agents

        elif selected_method.name == "external_api":
            plan["steps"] = [
                {"step": 1, "action": "prepare_request", "description": "API 요청 준비"},
                {"step": 2, "action": "call_external_api", "description": "외부 API 호출"},
                {"step": 3, "action": "process_response", "description": "응답 처리"},
            ]

        elif selected_method.name == "local_processing":
            plan["steps"] = [
                {"step": 1, "action": "parse_input", "description": "입력 파싱"},
                {"step": 2, "action": "compute", "description": "계산 실행"},
                {"step": 3, "action": "return_result", "description": "결과 반환"},
            ]

        return plan

    def _determine_agent_chain(self, agent_input: AgentInput) -> List[str]:
        """에이전트 체인 결정"""
        query = agent_input.query.lower()
        domain = agent_input.domain or "general"

        # 도메인별 에이전트 체인
        domain_chains = {
            "production": ["ProductionIntelligenceAgent", "ForecastAgent"],
            "quality": ["QualityIntelligenceAgent", "RootCauseAgent"],
            "financial": ["FinanceIntelligenceAgent", "VarianceAgent"],
            "sales": ["SalesIntelligenceAgent", "ForecastAgent"],
            "purchase": ["PurchasingIntelligenceAgent"],
            "cost": ["CostIntelligenceAgent"],
            "hr": ["HRIntelligenceAgent"],
            "inventory": ["InventoryIntelligenceAgent"],
        }

        # 분석 유형별 에이전트
        analysis_agents = {
            "예측": "ForecastAgent",
            "원인": "RootCauseAgent",
            "시나리오": "ScenarioAgent",
            "최적화": "OptimizationAgent",
        }

        chain = []

        # 도메인 에이전트 추가
        if domain in domain_chains:
            chain.extend(domain_chains[domain])

        # 분석 유형 에이전트 추가
        for keyword, agent in analysis_agents.items():
            if keyword in query:
                chain.append(agent)
                break

        # 중복 제거
        return list(dict.fromkeys(chain))

    def _determine_next_agents(
        self,
        agent_input: AgentInput,
        selected_method: ExecutionMethod,
        execution_plan: Dict[str, Any]
    ) -> List[str]:
        """다음 실행할 에이전트 목록 결정"""

        if selected_method.name == "agent_chain":
            return execution_plan.get("agent_chain", [])
        else:
            return []

    def _generate_routing_recommendations(
        self,
        agent_input: AgentInput,
        selected_method: ExecutionMethod,
        execution_plan: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """라우팅 권장사항 생성"""

        recommendations = []

        # 캐싱 권장
        if selected_method.can_cache:
            recommendations.append({
                "title": "결과 캐싱 권장",
                "description": f"{selected_method.name} 실행 결과를 캐싱하여 응답 시간 개선",
                "priority": "low",
                "action": "enable_cache",
            })

        # 복잡도에 따른 권장
        if execution_plan.get("estimated_time_ms", 0) > 5000:
            recommendations.append({
                "title": "비동기 실행 권장",
                "description": "예상 실행 시간이 5초를 초과하므로 비동기 실행 권장",
                "priority": "medium",
                "action": "async_execution",
            })

        return recommendations
