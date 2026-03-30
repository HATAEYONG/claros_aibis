"""
차이 분석 에이전트
예산 대비 실적, 표준 원가 대비 실제 원가 등 차이 분석
"""
import logging
from typing import Dict, Any, List
from decimal import Decimal

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class VarianceAgent(BaseAgent):
    """
    차이 분석 에이전트
    예산 대비 실적, 표준 원가 대비 실제 원가 등 차이 분석

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (원가, 재무 등)
        layer: 분석 레이어
    """

    name = "VarianceAgent"
    description = "차이 분석 (예산/실적, 표준/실제)"
    version = "1.0.0"
    domain = "cost"
    layer = "analysis"
    requires_human_approval = False

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        차이 분석 실행

        Args:
            agent_input: 입력 데이터
                - analysis_type: 분석 유형 (budget, cost, etc.)
                - actual: 실제값
                - target: 목표값/표준값
                - dimensions: 분석 차원

        Returns:
            AgentOutput: 실행 결과
        """
        params = agent_input.parameters
        analysis_type = params.get("analysis_type", "budget")

        try:
            # 차이 분석 수행
            variance_result = self._analyze_variance(
                analysis_type=analysis_type,
                params=params
            )

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result=variance_result,
                evidence_refs=[
                    self.create_evidence_ref(
                        evidence_type="variance_analysis",
                        source="VarianceAgent",
                        source_id=f"{analysis_type}_variance",
                        description=f"{analysis_type} 차이 분석",
                        data=variance_result
                    )
                ],
                confidence=0.85,
            )

        except Exception as e:
            logger.exception(f"차이 분석 실패: {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"차이 분석 실패: {str(e)}"],
            )

    def _analyze_variance(
        self,
        analysis_type: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        차이 분석 수행

        Args:
            analysis_type: 분석 유형
            params: 분석 파라미터

        Returns:
            차이 분석 결과
        """
        actual = Decimal(str(params.get("actual", 0)))
        target = Decimal(str(params.get("target", 0)))

        # 차이 계산
        variance = actual - target
        variance_pct = (variance / target * 100) if target != 0 else Decimal(0)

        # 유리/불리 판정
        is_favorable = self._is_favorable_variance(analysis_type, variance)

        # 차이 원인 분석 (간단 구현)
        variance_causes = self._identify_variance_causes(
            analysis_type=analysis_type,
            variance=variance,
            params=params
        )

        return {
            "analysis_type": analysis_type,
            "actual": str(actual),
            "target": str(target),
            "variance": str(variance),
            "variance_pct": str(variance_pct),
            "is_favorable": is_favorable,
            "causes": variance_causes,
            "recommendations": self._generate_variance_recommendations(
                analysis_type=analysis_type,
                variance=variance,
                is_favorable=is_favorable
            )
        }

    def _is_favorable_variance(self, analysis_type: str, variance: Decimal) -> bool:
        """유리한 차이인지 판정"""
        # 수익: 양(+)이 유리, 비용: 음(-)이 유리
        favorable_types = ["revenue", "sales", "production_output"]
        unfavorable_types = ["cost", "expense", "budget_overrun"]

        if analysis_type in favorable_types:
            return variance > 0
        elif analysis_type in unfavorable_types:
            return variance < 0
        else:
            return variance >= 0  # 기본

    def _identify_variance_causes(
        self,
        analysis_type: str,
        variance: Decimal,
        params: Dict[str, Any]
    ) -> List[str]:
        """차이 원인 식별"""
        causes = []

        # 간단한 규칙 기반 원인 식별
        # 실제로는 더 복잡한 분석 로직 필요

        if analysis_type == "cost":
            if variance > 0:
                causes.append("자재 가격 상승")
                causes.append("생산 효율 저하")
            else:
                causes.append("자재 가격 하락")
                causes.append("생산 효율 개선")

        elif analysis_type == "revenue":
            if variance < 0:
                causes.append("판매량 감소")
                causes.append("판매 단가 하락")
            else:
                causes.append("판매량 증가")
                causes.append("판매 단가 상승")

        elif analysis_type == "production":
            if variance < 0:
                causes.append("설비 가동률 저하")
                causes.append("원자재 부족")
            else:
                causes.append("설비 가동률 개선")
                causes.append("생산 최적화")

        return causes

    def _generate_variance_recommendations(
        self,
        analysis_type: str,
        variance: Decimal,
        is_favorable: bool
    ) -> List[str]:
        """차이 개선 권고사항 생성"""
        recommendations = []

        if not is_favorable:
            if analysis_type == "cost":
                recommendations.append("원가 구조 분석 및 최적화")
                recommendations.append("대체 공급원 검토")
                recommendations.append("생산 프로세스 개선")

            elif analysis_type == "revenue":
                recommendations.append("판매 전략 재검토")
                recommendations.append("시장 확장 기회 탐색")
                recommendations.append("고객 유지 강화")

            elif analysis_type == "production":
                recommendations.append("설비 가용률 점검")
                recommendations.append("생산 계획 최적화")
                recommendations.append("작업자 교육 강화")

        return recommendations
