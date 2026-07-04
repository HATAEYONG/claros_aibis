"""
리스크 모니터링 에이전트
다양한 리스크 지표를 모니터링하고 경고
"""
import logging
from typing import Dict, Any, List
from decimal import Decimal

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services import EventDetectionService

logger = logging.getLogger(__name__)


class RiskAgent(BaseAgent):
    """
    리스크 모니터링 에이전트
    다양한 리스크 지표를 모니터링하고 경고

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 모니터링 레이어
    """

    name = "RiskAgent"
    description = "리스크 지표 모니터링 및 경고"
    version = "1.0.0"
    domain = "general"
    layer = "monitoring"
    requires_human_approval = False

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        리스크 모니터링 실행

        Args:
            agent_input: 입력 데이터
                - risk_type: 리스크 유형 (supplier, quality, budget, cashflow, etc.)
                - ... (리스크 유형별 파라미터)

        Returns:
            AgentOutput: 실행 결과
        """
        params = agent_input.parameters
        risk_type = params.get("risk_type", "")

        if not risk_type:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=["risk_type 파라미터가 필요합니다"],
            )

        # 리스크 유형별 처리
        handler_map = {
            "supplier": self._handle_supplier_risk,
            "quality": self._handle_quality_risk,
            "budget": self._handle_budget_risk,
            "cashflow": self._handle_cashflow_risk,
            "production": self._handle_production_risk,
        }

        handler = handler_map.get(risk_type)
        if not handler:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"지원하지 않는 리스크 유형: {risk_type}"],
            )

        try:
            return handler(agent_input)
        except Exception as e:
            logger.exception(f"리스크 모니터링 실패 ({risk_type}): {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"리스크 모니터링 실패: {str(e)}"],
            )

    def _handle_supplier_risk(self, agent_input: AgentInput) -> AgentOutput:
        """공급자 리스크 처리"""
        params = agent_input.parameters

        # 필수 파라미터 확인
        required_params = ["supplier_code", "supplier_name", "risk_score"]
        missing_params = [p for p in required_params if p not in params]

        if missing_params:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"필수 파라미터 누락: {', '.join(missing_params)}"],
            )

        # 공급자 리스크 감지
        event = EventDetectionService.detect_supplier_risk(
            supplier_code=params["supplier_code"],
            supplier_name=params["supplier_name"],
            risk_score=float(params["risk_score"]),
            risk_factors=params.get("risk_factors", []),
            threshold=params.get("threshold", 70.0)
        )

        if event is None:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "risk_type": "supplier",
                    "supplier_code": params["supplier_code"],
                    "risk_detected": False,
                    "message": "공급자 리스크 없음"
                },
                confidence=1.0,
            )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "risk_type": "supplier",
                "supplier_code": params["supplier_code"],
                "risk_detected": True,
                "event_id": str(event.event_id),
                "risk_score": params["risk_score"],
            },
            evidence_refs=[
                self.create_evidence_ref(
                    evidence_type="risk_assessment",
                    source="Supplier_Monitor",
                    source_id=params["supplier_code"],
                    description=f"공급자 리스크 감지: {params['supplier_name']}",
                )
            ],
            confidence=0.85,
        )

    def _handle_quality_risk(self, agent_input: AgentInput) -> AgentOutput:
        """품질 리스크 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_quality_issue(
            product_code=params.get("product_code", ""),
            product_name=params.get("product_name", ""),
            defect_rate=float(params.get("defect_rate", 0)),
            threshold_rate=float(params.get("threshold_rate", 5.0)),
            defect_count=int(params.get("defect_count", 0)),
            total_count=int(params.get("total_count", 1))
        )

        if event is None:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "risk_type": "quality",
                    "risk_detected": False,
                    "message": "품질 리스크 없음"
                },
                confidence=1.0,
            )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "risk_type": "quality",
                "risk_detected": True,
                "event_id": str(event.event_id),
                "defect_rate": params.get("defect_rate"),
            },
            confidence=0.9,
        )

    def _handle_budget_risk(self, agent_input: AgentInput) -> AgentOutput:
        """예산 리스크 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_budget_overrun(
            department=params.get("department", ""),
            department_name=params.get("department_name", ""),
            actual_spend=Decimal(str(params.get("actual_spend", 0))),
            budget_amount=Decimal(str(params.get("budget_amount", 0))),
            overrun_pct=Decimal(str(params.get("overrun_pct", 0))),
            threshold_pct=Decimal(str(params.get("threshold_pct", 5.0)))
        )

        if event is None:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "risk_type": "budget",
                    "risk_detected": False,
                    "message": "예산 리스크 없음"
                },
                confidence=1.0,
            )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "risk_type": "budget",
                "risk_detected": True,
                "event_id": str(event.event_id),
                "overrun_pct": params.get("overrun_pct"),
            },
            confidence=0.9,
        )

    def _handle_cashflow_risk(self, agent_input: AgentInput) -> AgentOutput:
        """현금흐름 리스크 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_cashflow_stress(
            cash_flow=Decimal(str(params.get("cash_flow", 0))),
            minimum_threshold=Decimal(str(params.get("minimum_threshold", 0))),
            forecast_days=int(params.get("forecast_days", 7))
        )

        if event is None:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "risk_type": "cashflow",
                    "risk_detected": False,
                    "message": "현금흐름 리스크 없음"
                },
                confidence=1.0,
            )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "risk_type": "cashflow",
                "risk_detected": True,
                "event_id": str(event.event_id),
                "cash_flow": params.get("cash_flow"),
            },
            confidence=0.9,
        )

    def _handle_production_risk(self, agent_input: AgentInput) -> AgentOutput:
        """생산 리스크 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_production_shortfall(
            production_line=params.get("production_line", ""),
            line_name=params.get("line_name", ""),
            actual_output=Decimal(str(params.get("actual_output", 0))),
            planned_output=Decimal(str(params.get("planned_output", 0))),
            shortfall_pct=Decimal(str(params.get("shortfall_pct", 0))),
            threshold_pct=Decimal(str(params.get("threshold_pct", 10.0)))
        )

        if event is None:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "risk_type": "production",
                    "risk_detected": False,
                    "message": "생산 리스크 없음"
                },
                confidence=1.0,
            )

        return AgentOutput(
            request_id=agent_input.request_id,
            agent_name=self.name,
            status="success",
            result={
                "risk_type": "production",
                "risk_detected": True,
                "event_id": str(event.event_id),
                "shortfall_pct": params.get("shortfall_pct"),
            },
            confidence=0.9,
        )
