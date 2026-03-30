"""
이벤트 감지 에이전트
다양한 이벤트 유형을 감지하고 생성
"""
import logging
from typing import Dict, Any, List
from decimal import Decimal
from datetime import datetime

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services import EventDetectionService
from events.models import EventType

logger = logging.getLogger(__name__)


class EventDetectionAgent(BaseAgent):
    """
    이벤트 감지 에이전트
    다양한 이벤트 유형을 감지하고 생성

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 모니터링 레이어
    """

    name = "EventDetectionAgent"
    description = "이벤트 감지 및 생성"
    version = "1.0.0"
    domain = "general"
    layer = "monitoring"
    requires_human_approval = False

    # 지원하는 이벤트 유형
    SUPPORTED_EVENT_TYPES = [
        EventType.KPI_DEVIATION,
        EventType.COST_VARIANCE_BREACH,
        EventType.SUPPLIER_RISK_ALERT,
        EventType.OUTPUT_SHORTFALL,
        EventType.DEFECT_CLUSTER,
        EventType.CAPA_OVERDUE,
        EventType.BUDGET_OVERRUN,
        EventType.CASHFLOW_STRESS,
    ]

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        이벤트 감지 실행

        Args:
            agent_input: 입력 데이터
                - event_type: 이벤트 유형
                - ... (이벤트 유형별 파라미터)

        Returns:
            AgentOutput: 실행 결과
        """
        params = agent_input.parameters
        event_type = params.get("event_type", "")

        if not event_type:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=["event_type 파라미터가 필요합니다"],
            )

        # 이벤트 유형별 처리
        handler_map = {
            EventType.KPI_DEVIATION: self._handle_kpi_deviation,
            EventType.COST_VARIANCE_BREACH: self._handle_cost_variance,
            EventType.SUPPLIER_RISK_ALERT: self._handle_supplier_risk,
            EventType.OUTPUT_SHORTFALL: self._handle_output_shortfall,
            EventType.DEFECT_CLUSTER: self._handle_defect_cluster,
            EventType.CAPA_OVERDUE: self._handle_capa_overdue,
            EventType.BUDGET_OVERRUN: self._handle_budget_overrun,
            EventType.CASHFLOW_STRESS: self._handle_cashflow_stress,
        }

        handler = handler_map.get(event_type)
        if not handler:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"지원하지 않는 이벤트 유형: {event_type}"],
            )

        try:
            return handler(agent_input)
        except Exception as e:
            logger.exception(f"이벤트 감지 실패 ({event_type}): {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"이벤트 감지 실패: {str(e)}"],
            )

    def _handle_kpi_deviation(self, agent_input: AgentInput) -> AgentOutput:
        """KPI 편차 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_kpi_deviation(
            kpi_code=params.get("kpi_code", ""),
            kpi_name=params.get("kpi_name", ""),
            observed_value=Decimal(str(params.get("observed_value", 0))),
            target_value=Decimal(str(params.get("target_value", 0))),
            threshold_pct=Decimal(str(params.get("threshold_pct", 10))),
            domain=params.get("domain", ""),
            scope_type=params.get("scope_type", "kpi"),
            scope_id=params.get("scope_id", ""),
            severity=params.get("severity")
        )

        return self._create_event_output(event, EventType.KPI_DEVIATION, params)

    def _handle_cost_variance(self, agent_input: AgentInput) -> AgentOutput:
        """원가 차이 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_cost_variance_breach(
            cost_center=params.get("cost_center", ""),
            cost_center_name=params.get("cost_center_name", ""),
            actual_cost=Decimal(str(params.get("actual_cost", 0))),
            standard_cost=Decimal(str(params.get("standard_cost", 0))),
            variance_pct=Decimal(str(params.get("variance_pct", 0))),
            threshold_pct=Decimal(str(params.get("threshold_pct", 5)))
        )

        return self._create_event_output(event, EventType.COST_VARIANCE_BREACH, params)

    def _handle_supplier_risk(self, agent_input: AgentInput) -> AgentOutput:
        """공급자 위험 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_supplier_risk(
            supplier_code=params.get("supplier_code", ""),
            supplier_name=params.get("supplier_name", ""),
            risk_score=float(params.get("risk_score", 0)),
            risk_factors=params.get("risk_factors", []),
            threshold=params.get("threshold", 70.0)
        )

        return self._create_event_output(event, EventType.SUPPLIER_RISK_ALERT, params)

    def _handle_output_shortfall(self, agent_input: AgentInput) -> AgentOutput:
        """생산 실적 미달 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_production_shortfall(
            production_line=params.get("production_line", ""),
            line_name=params.get("line_name", ""),
            actual_output=Decimal(str(params.get("actual_output", 0))),
            planned_output=Decimal(str(params.get("planned_output", 0))),
            shortfall_pct=Decimal(str(params.get("shortfall_pct", 0))),
            threshold_pct=Decimal(str(params.get("threshold_pct", 10)))
        )

        return self._create_event_output(event, EventType.OUTPUT_SHORTFALL, params)

    def _handle_defect_cluster(self, agent_input: AgentInput) -> AgentOutput:
        """불량 군집 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_quality_issue(
            product_code=params.get("product_code", ""),
            product_name=params.get("product_name", ""),
            defect_rate=float(params.get("defect_rate", 0)),
            threshold_rate=float(params.get("threshold_rate", 5)),
            defect_count=int(params.get("defect_count", 0)),
            total_count=int(params.get("total_count", 1))
        )

        return self._create_event_output(event, EventType.DEFECT_CLUSTER, params)

    def _handle_capa_overdue(self, agent_input: AgentInput) -> AgentOutput:
        """CAPA 기한 초과 이벤트 처리"""
        params = agent_input.parameters

        due_date_str = params.get("due_date")
        due_date = datetime.fromisoformat(due_date_str) if due_date_str else datetime.now()

        event = EventDetectionService.detect_capa_overdue(
            capa_id=params.get("capa_id", ""),
            capa_title=params.get("capa_title", ""),
            due_date=due_date,
            responsible_dept=params.get("responsible_dept", "")
        )

        return self._create_event_output(event, EventType.CAPA_OVERDUE, params)

    def _handle_budget_overrun(self, agent_input: AgentInput) -> AgentOutput:
        """예산 초과 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_budget_overrun(
            department=params.get("department", ""),
            department_name=params.get("department_name", ""),
            actual_spend=Decimal(str(params.get("actual_spend", 0))),
            budget_amount=Decimal(str(params.get("budget_amount", 0))),
            overrun_pct=Decimal(str(params.get("overrun_pct", 0))),
            threshold_pct=Decimal(str(params.get("threshold_pct", 5)))
        )

        return self._create_event_output(event, EventType.BUDGET_OVERRUN, params)

    def _handle_cashflow_stress(self, agent_input: AgentInput) -> AgentOutput:
        """현금흐름 압박 이벤트 처리"""
        params = agent_input.parameters

        event = EventDetectionService.detect_cashflow_stress(
            cash_flow=Decimal(str(params.get("cash_flow", 0))),
            minimum_threshold=Decimal(str(params.get("minimum_threshold", 0))),
            forecast_days=int(params.get("forecast_days", 7))
        )

        return self._create_event_output(event, EventType.CASHFLOW_STRESS, params)

    def _create_event_output(
        self,
        event: Any,
        event_type: str,
        params: Dict[str, Any]
    ) -> AgentOutput:
        """이벤트 출력 생성 헬퍼"""
        if event is None:
            return AgentOutput(
                request_id=params.get("request_id", ""),
                agent_name=self.name,
                status="success",
                result={
                    "event_type": event_type,
                    "event_detected": False,
                    "message": "이벤트 감지 조건 미충족"
                },
                confidence=1.0,
            )

        return AgentOutput(
            request_id=params.get("request_id", ""),
            agent_name=self.name,
            status="success",
            result={
                "event_type": event_type,
                "event_detected": True,
                "event_id": str(event.event_id),
                "severity": event.severity,
                "title": event.title,
            },
            evidence_refs=[
                self.create_evidence_ref(
                    evidence_type="event_detection",
                    source=event.detected_by_agent or self.name,
                    source_id=str(event.event_id),
                    description=event.title,
                )
            ],
            confidence=0.9,
        )
