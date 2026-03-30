"""
KPI 모니터링 에이전트
KPI 편차를 감지하고 이벤트를 생성
"""
import logging
from typing import Dict, Any, List
from decimal import Decimal

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput
from events.services import EventDetectionService
from events.models import Event

logger = logging.getLogger(__name__)


class KPIAgent(BaseAgent):
    """
    KPI 모니터링 에이전트
    KPI 편차를 감지하고 이벤트를 생성

    Attributes:
        name: 에이전트 이름
        description: 에이전트 설명
        domain: 도메인 (모든 도메인 지원)
        layer: 모니터링 레이어
    """

    name = "KPIAgent"
    description = "KPI 편차 감지 및 이벤트 생성"
    version = "1.0.0"
    domain = "general"
    layer = "monitoring"
    requires_human_approval = False

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """
        KPI 모니터링 실행

        Args:
            agent_input: 입력 데이터
                - kpi_code: KPI 코드
                - kpi_name: KPI 명칭
                - observed_value: 관측값
                - target_value: 목표값
                - threshold_pct: 편차 임계값 (%)
                - domain: 도메인
                - scope_type: 범위 유형
                - scope_id: 범위 ID

        Returns:
            AgentOutput: 실행 결과
        """
        params = agent_input.parameters

        # 필수 파라미터 확인
        required_params = ["kpi_code", "kpi_name", "observed_value", "target_value", "threshold_pct"]
        missing_params = [p for p in required_params if p not in params]

        if missing_params:
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"필수 파라미터 누락: {', '.join(missing_params)}"],
            )

        # 파라미터 추출
        kpi_code = params["kpi_code"]
        kpi_name = params["kpi_name"]
        observed_value = Decimal(str(params["observed_value"]))
        target_value = Decimal(str(params["target_value"]))
        threshold_pct = Decimal(str(params["threshold_pct"]))
        domain = params.get("domain", "general")
        scope_type = params.get("scope_type", "kpi")
        scope_id = params.get("scope_id", kpi_code)
        severity = params.get("severity")

        try:
            # KPI 편차 감지
            event = EventDetectionService.detect_kpi_deviation(
                kpi_code=kpi_code,
                kpi_name=kpi_name,
                observed_value=observed_value,
                target_value=target_value,
                threshold_pct=threshold_pct,
                domain=domain,
                scope_type=scope_type,
                scope_id=scope_id,
                severity=severity
            )

            if event is None:
                # 편차 없음
                return AgentOutput(
                    request_id=agent_input.request_id,
                    agent_name=self.name,
                    status="success",
                    result={
                        "kpi_code": kpi_code,
                        "kpi_name": kpi_name,
                        "deviation_detected": False,
                        "message": "KPI 편차 없음 (임계값 미달)"
                    },
                    confidence=1.0,
                )

            # 이벤트 생성됨
            evidence_refs = [
                self.create_evidence_ref(
                    evidence_type="kpi_measurement",
                    source="KPI_Monitor",
                    source_id=kpi_code,
                    description=f"KPI 편차 감지: {kpi_name}",
                    data={
                        "kpi_code": kpi_code,
                        "observed_value": str(observed_value),
                        "target_value": str(target_value),
                        "deviation_pct": str(event.deviation_pct),
                    }
                )
            ]

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result={
                    "kpi_code": kpi_code,
                    "kpi_name": kpi_name,
                    "deviation_detected": True,
                    "event_id": str(event.event_id),
                    "event_type": event.event_type,
                    "severity": event.severity,
                    "deviation_pct": str(event.deviation_pct),
                },
                evidence_refs=evidence_refs,
                confidence=0.9,
            )

        except Exception as e:
            logger.exception(f"KPI 모니터링 실패: {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[f"KPI 모니터링 실패: {str(e)}"],
            )
