# -*- coding: utf-8 -*-
"""
Event Taxonomy - 이벤트 유형 정의 및 분류
참조 플랫폼: events/taxonomy.py
"""
from enum import Enum
from typing import Dict, List, Optional, Any


class EventType(Enum):
    """
    이벤트 유형 정의

    참조 플랫폼의 EVENT_FAMILIES를 기반으로 14가지 이벤트 유형 정의
    """
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
    TURNOVER_SURGE = "TURNOVER_SURGE"
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
EVENT_METADATA: Dict[EventType, Dict[str, Any]] = {
    # KPI 관련
    EventType.KPI_DEVIATION: {
        "description": "KPI 목표 편차",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["KPIAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"deviation_pct": 10},
    },
    EventType.KPI_TARGET_ACHIEVED: {
        "description": "KPI 목표 달성",
        "default_severity": EventSeverity.LOW,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["KPIAgent"],
        "response_agents": [],
        "threshold_params": {"achievement_pct": 100},
    },

    # 원가 관련
    EventType.COST_VARIANCE_BREACH: {
        "description": "원가 편차 기준 초과",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["VarianceAgent"],
        "response_agents": ["RootCauseAgent", "ScenarioAgent", "RecommendationAgent"],
        "threshold_params": {"variance_pct": 15},
    },
    EventType.MATERIAL_PRICE_SPIKE: {
        "description": "자재 단가 급등",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["PurchasingIntelligenceAgent"],
        "response_agents": ["ScenarioAgent", "RecommendationAgent"],
        "threshold_params": {"price_increase_pct": 20},
    },
    EventType.LABOR_COST_INCREASE: {
        "description": "인건비 상승",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["HRIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"cost_increase_pct": 10},
    },

    # 구매/공급망
    EventType.SUPPLIER_RISK_ALERT: {
        "description": "공급처 리스크 경고",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["PurchasingIntelligenceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"risk_score": 70},
    },
    EventType.SUPPLIER_DELIVERY_DELAY: {
        "description": "공급처 납기 지연",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["PurchasingIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"delay_days": 3},
    },
    EventType.INVENTORY_SHORTAGE: {
        "description": "재고 부족",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["PurchasingIntelligenceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"inventory_ratio": 0.2},
    },
    EventType.INVENTORY_EXCESS: {
        "description": "재고 과다",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["PurchasingIntelligenceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"inventory_ratio": 2.0},
    },

    # 생산
    EventType.OUTPUT_SHORTFALL: {
        "description": "생산량 부족",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["ProductionIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"output_ratio": 0.8},
    },
    EventType.CAPACITY_OVERLOAD: {
        "description": "생산 능력 초과",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["ProductionIntelligenceAgent"],
        "response_agents": ["ScenarioAgent", "RecommendationAgent"],
        "threshold_params": {"capacity_ratio": 0.95},
    },
    EventType.EQUIPMENT_DOWNTIME: {
        "description": "설비 다운타임",
        "default_severity": EventSeverity.CRITICAL,
        "default_scope": EventScope.TEAM,
        "detection_agents": ["ProductionIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"downtime_minutes": 60},
    },
    EventType.PRODUCTION_QUALITY_DECLINE: {
        "description": "생산 품질 저하",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["QualityIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"quality_defect_rate": 0.05},
    },

    # 품질
    EventType.DEFECT_CLUSTER: {
        "description": "불량군집 발생",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["QualityIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"defect_concentration": 3},
    },
    EventType.CAPA_OVERDUE: {
        "description": "CAPA 기한 초과",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.TEAM,
        "detection_agents": ["QualityIntelligenceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"overdue_days": 1},
    },
    EventType.QUALITY_TREND_DECLINE: {
        "description": "품질 추세 저하",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["QualityIntelligenceAgent"],
        "response_agents": ["RootCauseAgent"],
        "threshold_params": {"trend_decline_pct": 5},
    },
    EventType.CUSTOMER_COMPLAINT_SURGE: {
        "description": "고객 클레임 급증",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["QualityIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"complaint_increase_pct": 50},
    },

    # 재무
    EventType.CASHFLOW_STRESS: {
        "description": "현금흐름 압박",
        "default_severity": EventSeverity.CRITICAL,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["FinanceIntelligenceAgent"],
        "response_agents": ["ScenarioAgent", "RecommendationAgent"],
        "threshold_params": {"cashflow_ratio": 1.0},
    },
    EventType.BUDGET_OVERRUN: {
        "description": "예산 초과",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["VarianceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"budget_usage_pct": 100},
    },
    EventType.ABNORMAL_JOURNAL_PATTERN: {
        "description": "전표 이상 패턴",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["FinanceIntelligenceAgent"],
        "response_agents": ["RootCauseAgent"],
        "threshold_params": {"anomaly_score": 0.7},
    },
    EventType.RECEIVABLES_OVERDUE: {
        "description": "미수금 연체",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.GLOBAL,
        "detection_agents": ["FinanceIntelligenceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"overdue_days": 30},
    },

    # 인사
    EventType.OVERTIME_SURGE: {
        "description": "잔업 급증",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["HRIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"overtime_increase_pct": 30},
    },
    EventType.TURNOVER_SURGE: {
        "description": "이직률 급증",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["HRIntelligenceAgent"],
        "response_agents": ["RootCauseAgent", "RecommendationAgent"],
        "threshold_params": {"turnover_rate": 0.05},
    },
    EventType.TRAINING_COMPLIANCE_LOW: {
        "description": "교육 이수율 저조",
        "default_severity": EventSeverity.MEDIUM,
        "default_scope": EventScope.DEPARTMENT,
        "detection_agents": ["HRIntelligenceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"training_completion_rate": 0.7},
    },

    # 거버넌스
    EventType.SOP_NONCOMPLIANCE: {
        "description": "SOP 미준수",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.TEAM,
        "detection_agents": ["GovernanceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"compliance_rate": 0.8},
    },
    EventType.APPROVAL_BYPASS: {
        "description": "승인 우회",
        "default_severity": EventSeverity.CRITICAL,
        "default_scope": EventScope.INDIVIDUAL,
        "detection_agents": ["GovernanceAgent"],
        "response_agents": ["AuditAgent"],
        "threshold_params": {"bypass_count": 1},
    },
    EventType.POLICY_VIOLATION: {
        "description": "정책 위반",
        "default_severity": EventSeverity.HIGH,
        "default_scope": EventScope.INDIVIDUAL,
        "detection_agents": ["GovernanceAgent"],
        "response_agents": ["RecommendationAgent"],
        "threshold_params": {"violation_severity": "medium"},
    },
}


class EventTaxonomy:
    """
    이벤트 택소노미 유틸리티

    이벤트 유형별 메타데이터 조회, 에이전트 매핑 등을 제공합니다.
    """

    @staticmethod
    def get_event_type(event_type_str: str) -> Optional[EventType]:
        """
        문자열로 이벤트 유형 조회

        Args:
            event_type_str: 이벤트 유형 문자열

        Returns:
            EventType: 이벤트 유형 (없으면 None)
        """
        try:
            return EventType[event_type_str]
        except KeyError:
            return None

    @staticmethod
    def get_event_metadata(event_type: EventType) -> Dict[str, Any]:
        """
        이벤트 유형별 메타데이터 조회

        Args:
            event_type: 이벤트 유형

        Returns:
            Dict: 메타데이터
        """
        return EVENT_METADATA.get(event_type, {})

    @staticmethod
    def get_detection_agents(event_type: EventType) -> List[str]:
        """
        이벤트 감지 에이전트 목록

        Args:
            event_type: 이벤트 유형

        Returns:
            List[str]: 에이전트명 목록
        """
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("detection_agents", [])

    @staticmethod
    def get_response_agents(event_type: EventType) -> List[str]:
        """
        이벤트 대응 에이전트 목록

        Args:
            event_type: 이벤트 유형

        Returns:
            List[str]: 에이전트명 목록
        """
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("response_agents", [])

    @staticmethod
    def get_default_severity(event_type: EventType) -> EventSeverity:
        """
        기본 심각도

        Args:
            event_type: 이벤트 유형

        Returns:
            EventSeverity: 심각도
        """
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("default_severity", EventSeverity.MEDIUM)

    @staticmethod
    def get_default_scope(event_type: EventType) -> EventScope:
        """
        기본 범위

        Args:
            event_type: 이벤트 유형

        Returns:
            EventScope: 범위
        """
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("default_scope", EventScope.DEPARTMENT)

    @staticmethod
    def get_threshold_params(event_type: EventType) -> Dict[str, Any]:
        """
        임계값 파라미터

        Args:
            event_type: 이벤트 유형

        Returns:
            Dict: 임계값 파라미터
        """
        metadata = EventTaxonomy.get_event_metadata(event_type)
        return metadata.get("threshold_params", {})

    @staticmethod
    def get_all_event_types() -> List[EventType]:
        """
        모든 이벤트 유형 목록

        Returns:
            List[EventType]: 이벤트 유형 목록
        """
        return list(EventType)

    @staticmethod
    def get_event_types_by_domain(domain: str) -> List[EventType]:
        """
        도메인별 이벤트 유형 목록

        Args:
            domain: 도메인 (cost, quality, production 등)

        Returns:
            List[EventType]: 이벤트 유형 목록
        """
        # 도메인별 이벤트 유형 매핑
        domain_events = {
            "cost": [
                EventType.COST_VARIANCE_BREACH,
                EventType.MATERIAL_PRICE_SPIKE,
                EventType.LABOR_COST_INCREASE,
            ],
            "quality": [
                EventType.DEFECT_CLUSTER,
                EventType.CAPA_OVERDUE,
                EventType.QUALITY_TREND_DECLINE,
                EventType.CUSTOMER_COMPLAINT_SURGE,
            ],
            "production": [
                EventType.OUTPUT_SHORTFALL,
                EventType.CAPACITY_OVERLOAD,
                EventType.EQUIPMENT_DOWNTIME,
                EventType.PRODUCTION_QUALITY_DECLINE,
            ],
            "purchasing": [
                EventType.SUPPLIER_RISK_ALERT,
                EventType.SUPPLIER_DELIVERY_DELAY,
                EventType.INVENTORY_SHORTAGE,
                EventType.INVENTORY_EXCESS,
            ],
            "financial": [
                EventType.CASHFLOW_STRESS,
                EventType.BUDGET_OVERRUN,
                EventType.ABNORMAL_JOURNAL_PATTERN,
                EventType.RECEIVABLES_OVERDUE,
            ],
            "hr": [
                EventType.OVERTIME_SURGE,
                EventType.TURNOVER_SURGE,
                EventType.TRAINING_COMPLIANCE_LOW,
            ],
            "governance": [
                EventType.SOP_NONCOMPLIANCE,
                EventType.APPROVAL_BYPASS,
                EventType.POLICY_VIOLATION,
            ],
        }

        return domain_events.get(domain, [])

    @staticmethod
    def calculate_severity(
        event_type: EventType,
        observed_value: float,
        threshold_value: float
    ) -> EventSeverity:
        """
        관측값과 임계값 기반 심각도 계산

        Args:
            event_type: 이벤트 유형
            observed_value: 관측값
            threshold_value: 임계값

        Returns:
            EventSeverity: 계산된 심각도
        """
        default_severity = EventTaxonomy.get_default_severity(event_type)

        # 편차 비율 계산
        if threshold_value != 0:
            deviation_ratio = abs((observed_value - threshold_value) / threshold_value)
        else:
            deviation_ratio = 0

        # 편차에 따른 심각도 조정
        if deviation_ratio >= 2.0:
            return EventSeverity.CRITICAL
        elif deviation_ratio >= 1.0:
            return EventSeverity.HIGH
        elif deviation_ratio >= 0.5:
            return EventSeverity.MEDIUM
        else:
            return EventSeverity.LOW


class EventSeverityLevel:
    """
    이벤트 심각도 레벨 상수

    심각도별 우선순위와 점수를 정의합니다.
    """

    SEVERITY_PRIORITY = {
        EventSeverity.CRITICAL: 1,
        EventSeverity.HIGH: 2,
        EventSeverity.MEDIUM: 3,
        EventSeverity.LOW: 4,
    }

    SEVERITY_SCORE = {
        EventSeverity.CRITICAL: 100,
        EventSeverity.HIGH: 75,
        EventSeverity.MEDIUM: 50,
        EventSeverity.LOW: 25,
    }

    @staticmethod
    def get_priority(severity: EventSeverity) -> int:
        """심각도별 우선순위"""
        return EventSeverityLevel.SEVERITY_PRIORITY.get(severity, 99)

    @staticmethod
    def get_score(severity: EventSeverity) -> int:
        """심각도별 점수"""
        return EventSeverityLevel.SEVERITY_SCORE.get(severity, 0)

    @staticmethod
    def compare_severity(severity1: EventSeverity, severity2: EventSeverity) -> int:
        """
        심각도 비교

        Returns:
            int: -1 (severity1이 높음), 0 (동일), 1 (severity2가 높음)
        """
        priority1 = EventSeverityLevel.get_priority(severity1)
        priority2 = EventSeverityLevel.get_priority(severity2)

        if priority1 < priority2:
            return -1
        elif priority1 > priority2:
            return 1
        else:
            return 0
