"""
에이전트 프레임워크
AIBIS Enterprise AI Platform 기반 에이전트 시스템
"""
import logging
from .base.agent import BaseAgent, AgentInput, AgentOutput
from .base.registry import AgentRegistry, registry

logger = logging.getLogger(__name__)

__all__ = [
    "BaseAgent",
    "AgentInput",
    "AgentOutput",
    "AgentRegistry",
    "registry",
    "register_domain_agents",
    "register_all_agents",
]


def register_domain_agents():
    """
    도메인 지능형 에이전트 등록
    Phase 2: Domain Intelligence Agents (L3)
    """
    try:
        # Cost 도메인
        from ai.agents.domain.cost_intelligence import CostIntelligenceAgent
        registry.register(CostIntelligenceAgent())
        logger.info("CostIntelligenceAgent registered")

        # Financial 도메인
        from ai.agents.domain.finance_intelligence import FinanceIntelligenceAgent
        registry.register(FinanceIntelligenceAgent())
        logger.info("FinanceIntelligenceAgent registered")

        # Purchase 도메인
        from ai.agents.domain.purchasing_intelligence import PurchasingIntelligenceAgent
        registry.register(PurchasingIntelligenceAgent())
        logger.info("PurchasingIntelligenceAgent registered")

        # Production 도메인
        from ai.agents.domain.production_intelligence import ProductionIntelligenceAgent
        registry.register(ProductionIntelligenceAgent())
        logger.info("ProductionIntelligenceAgent registered")

        # Quality 도메인
        from ai.agents.domain.quality_intelligence import QualityIntelligenceAgent
        registry.register(QualityIntelligenceAgent())
        logger.info("QualityIntelligenceAgent registered")

    except Exception as e:
        logger.error(f"Failed to register domain agents: {str(e)}")


def register_monitoring_agents():
    """모니터링 레이어 에이전트 등록 (L2)"""
    try:
        from ai.agents.monitoring.kpi_agent import KPIAgent
        from ai.agents.monitoring.risk_agent import RiskAgent
        from ai.agents.monitoring.event_detection_agent import EventDetectionAgent
        from ai.agents.monitoring.process_monitoring_agent import ProcessMonitoringAgent

        registry.register(KPIAgent())
        registry.register(RiskAgent())
        registry.register(EventDetectionAgent())
        registry.register(ProcessMonitoringAgent())

        logger.info("Monitoring agents (L2) registered")
    except Exception as e:
        logger.error(f"Failed to register monitoring agents: {str(e)}")


def register_analysis_agents():
    """분석 레이어 에이전트 등록 (L4)"""
    try:
        from ai.agents.analysis.forecast_agent import ForecastAgent
        from ai.agents.analysis.variance_agent import VarianceAgent
        from ai.agents.analysis.root_cause_agent import RootCauseAgent
        from ai.agents.analysis.scenario_agent import ScenarioAgent

        registry.register(ForecastAgent())
        registry.register(VarianceAgent())
        registry.register(RootCauseAgent())
        registry.register(ScenarioAgent())

        logger.info("Analysis agents (L4) registered")
    except Exception as e:
        logger.error(f"Failed to register analysis agents: {str(e)}")


def register_decision_agents():
    """의사결정 레이어 에이전트 등록 (L5)"""
    try:
        from ai.agents.decision.recommendation_agent import RecommendationAgent
        from ai.agents.decision.approval_advisor_agent import ApprovalAdvisorAgent
        from ai.agents.decision.alert_agent import AlertAgent

        registry.register(RecommendationAgent())
        registry.register(ApprovalAdvisorAgent())
        registry.register(AlertAgent())

        logger.info("Decision agents (L5) registered")
    except Exception as e:
        logger.error(f"Failed to register decision agents: {str(e)}")


def register_learning_agents():
    """학습 레이어 에이전트 등록 (L6)"""
    try:
        from ai.agents.learning.evaluation_agent import EvaluationAgent
        from ai.agents.learning.reflection_agent import ReflectionAgent
        from ai.agents.learning.memory_curator_agent import MemoryCuratorAgent
        from ai.agents.learning.knowledge_update_agent import KnowledgeUpdateAgent

        registry.register(EvaluationAgent())
        registry.register(ReflectionAgent())
        registry.register(MemoryCuratorAgent())
        registry.register(KnowledgeUpdateAgent())

        logger.info("Learning agents (L6) registered")
    except Exception as e:
        logger.error(f"Failed to register learning agents: {str(e)}")


def register_all_agents():
    """
    모든 에이전트 등록
    """
    logger.info("Registering all agents...")

    # 모니터링 레이어 (L2)
    register_monitoring_agents()

    # 도메인 지능형 레이어 (L3)
    register_domain_agents()

    # 분석 레이어 (L4)
    register_analysis_agents()

    # 의사결정 레이어 (L5)
    register_decision_agents()

    # 학습 레이어 (L6)
    register_learning_agents()

    logger.info(f"Total agents registered: {registry.count()}")


# Django 앱 시작 시 자동 등록을 위한 ready() 함수
def agent_ready():
    """에이전트 시스템 초기화"""
    logger.info("Initializing Agent System...")
    register_all_agents()
    logger.info("Agent System initialization complete")


# 앱이 로드될 때 자동으로 에이전트 등록
try:
    agent_ready()
except Exception as e:
    logger.warning(f"Agent auto-registration deferred: {str(e)}")
