"""
근본 원인 분석 에이전트
이슈의 근본 원인을 분석하고 인과관계 도출
"""
import logging
from typing import Dict, Any, List
from decimal import Decimal

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.models import Event

logger = logging.getLogger(__name__)


class RootCauseAgent(BaseAgent):
    """
    근본 원인 분석 에이전트
    이슈의 근본 원인을 분석하고 인과관계 도출

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 분석 레이어
    """

    name = "RootCauseAgent"
    description = "근본 원인 분석 및 인과관계 도출"
    version = "1.0.0"
    domain = "general"
    layer = "analysis"
    requires_human_approval = False

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        근본 원인 분석 실행

        Args:
            agent_input: 입력 데이터
                - event_id: 분석할 이벤트 ID
                - issue_type: 이슈 유형
                - analysis_depth: 분석 깊이 (1-5)

        Returns:
            AgentOutput: 실행 결과
        """
        params = agent_input.parameters

        try:
            # 근본 원인 분석 수행
            root_cause_result = self._analyze_root_cause(
                params=params
            )

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result=root_cause_result,
                evidence_refs=[
                    self.create_evidence_ref(
                        evidence_type="root_cause_analysis",
                        source="RootCauseAgent",
                        source_id=params.get("event_id", "unknown"),
                        description="근본 원인 분석",
                        data=root_cause_result
                    )
                ],
                confidence=root_cause_result.get("confidence", 0.75),
                next_agents=self._get_next_agents(root_cause_result),
            )

        except Exception as e:
            logger.exception(f"근본 원인 분석 실패: {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"근본 원인 분석 실패: {str(e)}"],
            )

    def _analyze_root_cause(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        근본 원인 분석 수행

        Args:
            params: 분석 파라미터

        Returns:
            근본 원인 분석 결과
        """
        event_id = params.get("event_id")
        issue_type = params.get("issue_type", "unknown")
        analysis_depth = int(params.get("analysis_depth", 3))

        # 이벤트가 있으면 관련 정보 조회
        event_context = {}
        related_events = []

        if event_id:
            try:
                event = Event.objects.get(event_id=event_id)
                event_context = {
                    "event_id": str(event.event_id),
                    "event_type": event.event_type,
                    "severity": event.severity,
                    "domain": event.domain,
                    "scope_type": event.scope_type,
                    "scope_id": event.scope_id,
                }

                # 관련 이벤트 조회 (상관관계)
                from events.services import EventCorrelationService
                correlated = EventCorrelationService.find_correlated_events(
                    event, max_results=10
                )
                related_events = [
                    {
                        "event_id": str(e.event_id),
                        "event_type": e.event_type,
                        "title": e.title,
                    }
                    for e in correlated
                ]

            except Event.DoesNotExist:
                logger.warning(f"이벤트를 찾을 수 없음: {event_id}")

        # 6M/4M2E 기반 근본 원인 분석
        # 기존 온톨로지 기반 인과 분석 활용
        try:
            from ai.chat_services import CausalAnalysisService

            # 기존 인과 분석 서비스가 있다면 활용
            # causal_result = CausalAnalysisService.analyze(...)

            pass  # 실제 구현 시 연동

        except ImportError:
            logger.warning("CausalAnalysisService not available")

        # 근본 원인 식별 (간단 구현)
        root_causes = self._identify_root_causes(
            issue_type=issue_type,
            event_context=event_context,
            related_events=related_events,
            analysis_depth=analysis_depth
        )

        # 인과 체인 구성
        causal_chain = self._build_causal_chain(
            root_causes=root_causes,
            depth=analysis_depth
        )

        return {
            "issue_type": issue_type,
            "event_context": event_context,
            "related_events_count": len(related_events),
            "root_causes": root_causes,
            "causal_chain": causal_chain,
            "confidence": self._calculate_confidence(root_causes, related_events),
            "recommendations": self._generate_root_cause_recommendations(root_causes)
        }

    def _identify_root_causes(
        self,
        issue_type: str,
        event_context: Dict[str, Any],
        related_events: List[Dict[str, Any]],
        analysis_depth: int
    ) -> List[Dict[str, Any]]:
        """근본 원인 식별"""
        # 6M/4M2E 카테고리 기반 분석
        ontology_categories = [
            "Man",      # 사람/작업자
            "Machine",  # 설비/기계
            "Material", # 자재
            "Method",   # 방법/프로세스
            "Measurement", # 측정
            "Management", # 관리
        ]

        root_causes = []

        # 이슈 유형별 원인 후보
        cause_candidates = self._get_cause_candidates(issue_type)

        # 연관 이벤트 기반 원인 추론
        for related in related_events:
            related_type = related.get("event_type", "")
            if "QUALITY" in related_type or "DEFECT" in related_type:
                root_causes.append({
                    "category": "Method",
                    "cause": "품질 프로세스 이슈",
                    "confidence": 0.7,
                    "evidence": f"관련 이벤트: {related_type}",
                })
            elif "EQUIPMENT" in related_type or "CAPACITY" in related_type:
                root_causes.append({
                    "category": "Machine",
                    "cause": "설비 관련 이슈",
                    "confidence": 0.7,
                    "evidence": f"관련 이벤트: {related_type}",
                })
            elif "SUPPLIER" in related_type or "MATERIAL" in related_type:
                root_causes.append({
                    "category": "Material",
                    "cause": "자재 공급 이슈",
                    "confidence": 0.7,
                    "evidence": f"관련 이벤트: {related_type}",
                })

        # 기본 원인 추가
        for candidate in cause_candidates:
            if not any(rc["cause"] == candidate["cause"] for rc in root_causes):
                root_causes.append(candidate)

        # 신뢰도순 정렬
        root_causes.sort(key=lambda x: x["confidence"], reverse=True)

        return root_causes[:analysis_depth]

    def _get_cause_candidates(self, issue_type: str) -> List[Dict[str, Any]]:
        """이슈 유형별 원인 후보"""
        # 이슈 유형별 일반적인 원인
        candidates_map = {
            "quality_issue": [
                {"category": "Man", "cause": "작업자 숙련도 부족", "confidence": 0.6},
                {"category": "Machine", "cause": "설비 정밀도 저하", "confidence": 0.7},
                {"category": "Material", "cause": "원자재 품질 이슈", "confidence": 0.8},
                {"category": "Method", "cause": "작업 표준 미준수", "confidence": 0.7},
            ],
            "production_shortfall": [
                {"category": "Man", "cause": "인력 부족", "confidence": 0.6},
                {"category": "Machine", "cause": "설비 다운타임", "confidence": 0.8},
                {"category": "Material", "cause": "자재 부족", "confidence": 0.7},
                {"category": "Method", "cause": "생산 계획 미흡", "confidence": 0.6},
            ],
            "cost_variance": [
                {"category": "Material", "cause": "자재 가격 상승", "confidence": 0.8},
                {"category": "Method", "cause": "생산 효율 저하", "confidence": 0.7},
                {"category": "Machine", "cause": "설비 에너지 비용 증가", "confidence": 0.6},
            ],
        }

        return candidates_map.get(issue_type, [
            {"category": "Method", "cause": "프로세스 이슈", "confidence": 0.5},
            {"category": "Management", "cause": "관리 체계 이슈", "confidence": 0.5},
        ])

    def _build_causal_chain(
        self,
        root_causes: List[Dict[str, Any]],
        depth: int
    ) -> List[Dict[str, Any]]:
        """인과 체인 구성"""
        chain = []

        for i, cause in enumerate(root_causes):
            # 근본 원인 → 즉각 원인 → 이슈
            chain.append({
                "level": i + 1,
                "category": cause["category"],
                "cause": cause["cause"],
                "confidence": cause["confidence"],
                "type": "root_cause" if i == 0 else "contributing_factor",
            })

        return chain

    def _calculate_confidence(
        self,
        root_causes: List[Dict[str, Any]],
        related_events: List[Dict[str, Any]]
    ) -> float:
        """분석 신뢰도 계산"""
        if not root_causes:
            return 0.0

        # 근본 원인 신뢰도 평균
        avg_cause_confidence = sum(rc["confidence"] for rc in root_causes) / len(root_causes)

        # 관련 이벤트가 있으면 신뢰도 상향
        event_bonus = min(len(related_events) * 0.05, 0.2)

        return min(avg_cause_confidence + event_bonus, 1.0)

    def _generate_root_cause_recommendations(
        self,
        root_causes: List[Dict[str, Any]]
    ) -> List[str]:
        """근본 원인 기반 권고사항"""
        recommendations = []

        for cause in root_causes[:3]:  # 상위 3개 원인
            category = cause["category"]
            cause_desc = cause["cause"]

            if category == "Man":
                recommendations.append(f"작업자 교육 강화: {cause_desc}")
            elif category == "Machine":
                recommendations.append(f"설비 예방 정비 강화: {cause_desc}")
            elif category == "Material":
                recommendations.append(f"자재 품질 관리 강화: {cause_desc}")
            elif category == "Method":
                recommendations.append(f"표준 작업 절차 개정: {cause_desc}")
            elif category == "Measurement":
                recommendations.append(f"측정 시스템 개선: {cause_desc}")
            elif category == "Management":
                recommendations.append(f"관리 프로세스 개선: {cause_desc}")

        return recommendations

    def _get_next_agents(self, result: Dict[str, Any]) -> List[str]:
        """다음 실행할 에이전트 목록"""
        next_agents = []

        # 권고사항 생성 필요
        if result.get("recommendations"):
            next_agents.append("RecommendationAgent")

        # 추가 분석 필요
        if result.get("confidence", 0) < 0.8:
            next_agents.append("ReflectionAgent")

        return next_agents
