# -*- coding: utf-8 -*-
"""
Quick test to verify the model import fixes
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

import logging

# 로깅 설정 (UTF-8)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


def test_agent_models():
    """에이전트 모델 임포트 테스트"""
    from ai.agents.domain.cost_intelligence import CostIntelligenceAgent
    from ai.agents.domain.finance_intelligence import FinanceIntelligenceAgent
    from ai.agents.base.agent import AgentInput

    logger.info("=" * 80)
    logger.info("에이전트 모델 임포트 수정 확인 테스트")
    logger.info("=" * 80)

    # CostIntelligenceAgent 테스트
    logger.info("\n1. CostIntelligenceAgent 테스트")
    try:
        cost_agent = CostIntelligenceAgent()
        logger.info(f"   OK: CostIntelligenceAgent 인스턴스 생성")

        # 원가 분석 실행 (try-except로 감싸서 모델 확인)
        agent_input = AgentInput(
            query="원가 분석",
            context={},
            requested_by="test_user"
        )

        # execute 메서드 호출 (내부적으로 임포트 시도)
        result = cost_agent.execute(agent_input)
        logger.info(f"   OK: CostIntelligenceAgent 실행 성공")
        logger.info(f"   상태: {result.status}")

    except Exception as e:
        logger.error(f"   FAIL: {e}")

    # FinanceIntelligenceAgent 테스트
    logger.info("\n2. FinanceIntelligenceAgent 테스트")
    try:
        finance_agent = FinanceIntelligenceAgent()
        logger.info(f"   OK: FinanceIntelligenceAgent 인스턴스 생성")

        agent_input = AgentInput(
            query="재무 분석",
            context={},
            requested_by="test_user"
        )

        result = finance_agent.execute(agent_input)
        logger.info(f"   OK: FinanceIntelligenceAgent 실행 성공")
        logger.info(f"   상태: {result.status}")

    except Exception as e:
        logger.error(f"   FAIL: {e}")

    logger.info("\n" + "=" * 80)
    logger.info("테스트 완료")
    logger.info("=" * 80)


if __name__ == '__main__':
    test_agent_models()
