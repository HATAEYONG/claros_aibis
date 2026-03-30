"""
이벤트 감지 서비스
KPI, 리스크, 프로세스 모니터링으로부터 이벤트를 감지
"""
import uuid
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from events.models import (
    Event, EventType, EventSeverity, EventStatus,
    DomainChoices, ProcessChoices
)

logger = logging.getLogger(__name__)


class EventDetectionService:
    """이벤트 감지 서비스"""

    @staticmethod
    def detect_kpi_deviation(
        kpi_code: str,
        kpi_name: str,
        observed_value: Decimal,
        target_value: Decimal,
        threshold_pct: Decimal,
        domain: str,
        scope_type: str = "kpi",
        scope_id: str = "",
        severity: str = None
    ) -> Optional[Event]:
        """
        KPI 편차 감지

        Args:
            kpi_code: KPI 코드
            kpi_name: KPI 명칭
            observed_value: 관측값
            target_value: 목표값
            threshold_pct: 편차 임계값 (%)
            domain: 도메인
            scope_type: 범위 유형
            scope_id: 범위 ID
            severity: 심각도 (자동 계산됨)

        Returns:
            Event: 생성된 이벤트 또는 None
        """
        # 편차 계산
        if target_value == 0:
            deviation_pct = Decimal(0)
        else:
            deviation_pct = abs((observed_value - target_value) / target_value * 100)

        # 임계값 확인
        if deviation_pct < threshold_pct:
            return None

        # 심각도 자동 결정
        if severity is None:
            if deviation_pct >= threshold_pct * 2:
                severity = EventSeverity.CRITICAL
            elif deviation_pct >= threshold_pct * 1.5:
                severity = EventSeverity.HIGH
            elif deviation_pct >= threshold_pct:
                severity = EventSeverity.MEDIUM
            else:
                severity = EventSeverity.LOW

        # 이벤트 생성
        event = Event(
            event_type=EventType.KPI_DEVIATION,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type=scope_type,
            scope_id=scope_id or kpi_code,
            scope_name=kpi_name,
            domain=domain,
            title=f"KPI 편차: {kpi_name}",
            description=f"{kpi_name}이(가) 목표값 {target_value} 대비 {deviation_pct:.1f}% 편차 발생",
            observed_value=observed_value,
            threshold_value=target_value,
            deviation_pct=deviation_pct,
            kpi_code=kpi_code,
            source="KPI_Monitor",
            event_time=timezone.now(),
            detected_by_agent="KPIMonitor"
        )

        event.save()
        logger.info(f"KPI 편차 이벤트 생성: {kpi_code} ({deviation_pct:.1f}%)")
        return event

    @staticmethod
    def detect_cost_variance_breach(
        cost_center: str,
        cost_center_name: str,
        actual_cost: Decimal,
        standard_cost: Decimal,
        variance_pct: Decimal,
        threshold_pct: Decimal
    ) -> Optional[Event]:
        """원가 차이 초과 감지"""
        if abs(variance_pct) < threshold_pct:
            return None

        severity = EventSeverity.HIGH if abs(variance_pct) >= threshold_pct * 1.5 else EventSeverity.MEDIUM

        event = Event(
            event_type=EventType.COST_VARIANCE_BREACH,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="cost_center",
            scope_id=cost_center,
            scope_name=cost_center_name,
            domain=DomainChoices.COST,
            title=f"원가 차이 초과: {cost_center_name}",
            description=f"표준 원가 대비 {variance_pct:.1f}% 차이 발생 (실제: {actual_cost}, 표준: {standard_cost})",
            observed_value=actual_cost,
            threshold_value=standard_cost,
            deviation_pct=variance_pct,
            source="Cost_Monitor",
            event_time=timezone.now(),
            detected_by_agent="CostIntelligenceAgent"
        )
        event.save()
        logger.info(f"원가 차이 이벤트 생성: {cost_center} ({variance_pct:.1f}%)")
        return event

    @staticmethod
    def detect_supplier_risk(
        supplier_code: str,
        supplier_name: str,
        risk_score: float,
        risk_factors: List[str],
        threshold: float = 70.0
    ) -> Optional[Event]:
        """공급자 위험 감지"""
        if risk_score < threshold:
            return None

        severity = EventSeverity.CRITICAL if risk_score >= 90 else EventSeverity.HIGH

        event = Event(
            event_type=EventType.SUPPLIER_RISK_ALERT,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="supplier",
            scope_id=supplier_code,
            scope_name=supplier_name,
            domain=DomainChoices.PURCHASING,
            process_code=ProcessChoices.P2P,
            title=f"공급자 위험 경고: {supplier_name}",
            description=f"위험 점수 {risk_score:.1f}점 ({', '.join(risk_factors)})",
            observed_value=Decimal(str(risk_score)),
            threshold_value=Decimal(str(threshold)),
            deviation_pct=Decimal(str(risk_score - threshold)),
            source="Supplier_Monitor",
            source_detail={"risk_factors": risk_factors},
            event_time=timezone.now(),
            detected_by_agent="PurchasingIntelligenceAgent"
        )
        event.save()
        logger.info(f"공급자 위험 이벤트 생성: {supplier_code} ({risk_score:.1f})")
        return event

    @staticmethod
    def detect_production_shortfall(
        production_line: str,
        line_name: str,
        actual_output: Decimal,
        planned_output: Decimal,
        shortfall_pct: Decimal,
        threshold_pct: Decimal = 10.0
    ) -> Optional[Event]:
        """생산 실적 미달 감지"""
        if shortfall_pct < threshold_pct:
            return None

        severity = EventSeverity.CRITICAL if shortfall_pct >= threshold_pct * 2 else EventSeverity.HIGH

        event = Event(
            event_type=EventType.OUTPUT_SHORTFALL,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="production_line",
            scope_id=production_line,
            scope_name=line_name,
            domain=DomainChoices.PRODUCTION,
            process_code=ProcessChoices.P2PROD,
            title=f"생산 실적 미달: {line_name}",
            description=f"계획 대비 {shortfall_pct:.1f}% 미달 (계획: {planned_output}, 실적: {actual_output})",
            observed_value=actual_output,
            threshold_value=planned_output,
            deviation_pct=shortfall_pct,
            source="Production_Monitor",
            event_time=timezone.now(),
            detected_by_agent="ProductionIntelligenceAgent"
        )
        event.save()
        logger.info(f"생산 실적 미달 이벤트 생성: {production_line} ({shortfall_pct:.1f}%)")
        return event

    @staticmethod
    def detect_quality_issue(
        product_code: str,
        product_name: str,
        defect_rate: float,
        threshold_rate: float,
        defect_count: int,
        total_count: int
    ) -> Optional[Event]:
        """품질 이슈 감지"""
        if defect_rate < threshold_rate:
            return None

        severity = EventSeverity.CRITICAL if defect_rate >= threshold_rate * 2 else EventSeverity.HIGH

        event = Event(
            event_type=EventType.DEFECT_CLUSTER,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="product",
            scope_id=product_code,
            scope_name=product_name,
            domain=DomainChoices.QUALITY,
            process_code=ProcessChoices.Q2R,
            title=f"불량률 증가: {product_name}",
            description=f"불합격률 {defect_rate:.2f}% 발생 (불량: {defect_count}/{total_count}개)",
            observed_value=Decimal(str(defect_rate)),
            threshold_value=Decimal(str(threshold_rate)),
            deviation_pct=Decimal(str(defect_rate - threshold_rate)),
            source_detail={"defect_count": defect_count, "total_count": total_count},
            source="Quality_Monitor",
            event_time=timezone.now(),
            detected_by_agent="QualityIntelligenceAgent"
        )
        event.save()
        logger.info(f"품질 이슈 이벤트 생성: {product_code} ({defect_rate:.2f}%)")
        return event

    @staticmethod
    def detect_budget_overrun(
        department: str,
        department_name: str,
        actual_spend: Decimal,
        budget_amount: Decimal,
        overrun_pct: Decimal,
        threshold_pct: Decimal = 5.0
    ) -> Optional[Event]:
        """예산 초과 감지"""
        if overrun_pct < threshold_pct:
            return None

        severity = EventSeverity.CRITICAL if overrun_pct >= threshold_pct * 2 else EventSeverity.HIGH

        event = Event(
            event_type=EventType.BUDGET_OVERRUN,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="department",
            scope_id=department,
            scope_name=department_name,
            domain=DomainChoices.FINANCE,
            process_code=ProcessChoices.R2R,
            title=f"예산 초과: {department_name}",
            description=f"예산 대비 {overrun_pct:.1f}% 초과 (예산: {budget_amount}, 집행: {actual_spend})",
            observed_value=actual_spend,
            threshold_value=budget_amount,
            deviation_pct=overrun_pct,
            source="Budget_Monitor",
            event_time=timezone.now(),
            detected_by_agent="FinanceIntelligenceAgent"
        )
        event.save()
        logger.info(f"예산 초과 이벤트 생성: {department} ({overrun_pct:.1f}%)")
        return event

    @staticmethod
    def detect_capa_overdue(
        capa_id: str,
        capa_title: str,
        due_date: datetime,
        responsible_dept: str
    ) -> Optional[Event]:
        """CAPA 기한 초과 감지"""
        if timezone.now().date() <= due_date.date():
            return None

        overdue_days = (timezone.now().date() - due_date.date()).days
        severity = EventSeverity.CRITICAL if overdue_days >= 7 else EventSeverity.HIGH

        event = Event(
            event_type=EventType.CAPA_OVERDUE,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="capa",
            scope_id=capa_id,
            scope_name=capa_title,
            domain=DomainChoices.QUALITY,
            process_code=ProcessChoices.Q2R,
            title=f"CAPA 기한 초과: {capa_title}",
            description=f"{capa_id}번 CAPA가 {overdue_days}일 지연됨 (기한: {due_date})",
            source="CAPA_Monitor",
            source_detail={"due_date": due_date.isoformat(), "overdue_days": overdue_days},
            event_time=timezone.now(),
            detected_by_agent="QualityIntelligenceAgent"
        )
        event.save()
        logger.info(f"CAPA 기한 초과 이벤트 생성: {capa_id} ({overdue_days}일 지연)")
        return event

    @staticmethod
    def detect_cashflow_stress(
        cash_flow: Decimal,
        minimum_threshold: Decimal,
        forecast_days: int = 7
    ) -> Optional[Event]:
        """현금흐름 압박 감지"""
        if cash_flow >= minimum_threshold:
            return None

        deficit_pct = abs((cash_flow - minimum_threshold) / minimum_threshold * 100)
        severity = EventSeverity.CRITICAL if deficit_pct >= 50 else EventSeverity.HIGH

        event = Event(
            event_type=EventType.CASHFLOW_STRESS,
            severity=severity,
            status=EventStatus.OPEN,
            scope_type="cashflow",
            scope_id=f"forecast_{forecast_days}d",
            scope_name=f"{forecast_days}일 예상 현금흐름",
            domain=DomainChoices.FINANCE,
            process_code=ProcessChoices.R2R,
            title="현금흐름 압박 경고",
            description=f"{forecast_days}일 내 현금흐름이 최소 기준 {minimum_threshold:,.0f}원 미달 예정",
            observed_value=cash_flow,
            threshold_value=minimum_threshold,
            deviation_pct=deficit_pct,
            source_detail={"forecast_days": forecast_days},
            source="Cashflow_Monitor",
            event_time=timezone.now(),
            detected_by_agent="FinanceIntelligenceAgent"
        )
        event.save()
        logger.info(f"현금흐름 압박 이벤트 생성: {forecast_days}일 예측 ({cash_flow:,.0f}원)")
        return event
