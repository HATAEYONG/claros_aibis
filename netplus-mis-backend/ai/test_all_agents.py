# -*- coding: utf-8 -*-
"""
전체 에이전트 동작 테스트
20개 에이전트 개별 및 통합 테스트
"""
import os
import sys
import django
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from ai.agents.base.agent import AgentInput, AgentOutput
from ai.agents.base.registry import registry, get_agent

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentTester:
    """에이전트 테스터"""

    def __init__(self):
        self.test_results = []
        self.start_time = datetime.now()

    def test_agent(self, agent_name: str, agent_input: AgentInput) -> Dict[str, Any]:
        """
        단일 에이전트 테스트

        Args:
            agent_name: 에이전트 이름
            agent_input: 에이전트 입력

        Returns:
            테스트 결과
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"테스트 시작: {agent_name}")
        logger.info(f"{'='*60}")

        result = {
            'agent_name': agent_name,
            'success': False,
            'execution_time_ms': 0,
            'status': '',
            'error': None,
            'output': None,
        }

        try:
            # 에이전트 조회
            agent = get_agent(agent_name)
            if not agent:
                raise ValueError(f"에이전트를 찾을 수 없습니다: {agent_name}")

            logger.info(f"에이전트 정보: {agent.description}")

            # 실행
            start = datetime.now()
            output = agent.run(agent_input)
            end = datetime.now()

            result['execution_time_ms'] = int((end - start).total_seconds() * 1000)
            result['status'] = output.status
            result['success'] = output.status == 'success'
            result['output'] = output

            # 결과 출력
            logger.info(f"실행 상태: {output.status}")
            logger.info(f"실행 시간: {result['execution_time_ms']}ms")
            logger.info(f"신뢰도: {output.confidence:.2f}")
            logger.info(f"추천 수: {len(output.recommendations)}")
            logger.info(f"근거 수: {len(output.evidence_refs)}")

            # 상세 결과 출력 (요약)
            if output.result:
                for key, value in output.result.items():
                    if isinstance(value, dict) and 'summary' in value:
                        logger.info(f"  {key}: {value['summary']}")
                    elif isinstance(value, list) and value:
                        logger.info(f"  {key}: {len(value)} items")

        except Exception as e:
            logger.error(f"에이전트 실행 실패: {e}")
            result['error'] = str(e)

        self.test_results.append(result)
        return result

    def generate_test_input(self, agent_name: str) -> AgentInput:
        """
        에이전트별 테스트 입력 생성

        Args:
            agent_name: 에이전트 이름

        Returns:
            테스트용 AgentInput
        """
        # 기본 파라미터
        period_from = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
        period_to = datetime.now().strftime('%Y-%m-%d')

        # 에이전트별 파라미터
        agent_params = {
            # L3: Domain Intelligence
            'CostIntelligenceAgent': {
                'plant': 'P1',
                'period_from': period_from,
                'period_to': period_to,
            },
            'FinanceIntelligenceAgent': {
                'department': 'FINANCE',
                'period_from': period_from,
                'period_to': period_to,
            },
            'PurchasingIntelligenceAgent': {
                'plant': 'P1',
                'period_from': period_from,
                'period_to': period_to,
            },
            'ProductionIntelligenceAgent': {
                'plant': 'P1',
                'line': 'L1',
                'period_from': period_from,
                'period_to': period_to,
            },
            'QualityIntelligenceAgent': {
                'plant': 'P1',
                'period_from': period_from,
                'period_to': period_to,
            },
            # L2: Monitoring
            'KPIAgent': {
                'kpi_codes': ['production_output', 'defect_rate'],
                'period_from': period_from,
                'period_to': period_to,
            },
            'RiskAgent': {
                'risk_categories': ['operational', 'financial'],
                'period_from': period_from,
                'period_to': period_to,
            },
            'EventDetectionAgent': {
                'event_types': ['KPI_DEVIATION', 'COST_VARIANCE_BREACH'],
                'period_from': period_from,
                'period_to': period_to,
            },
            'ProcessMonitoringAgent': {
                'process_codes': ['approval', 'production'],
                'period_from': period_from,
                'period_to': period_to,
            },
            # L4: Analysis
            'ForecastAgent': {
                'target_metrics': ['production_output', 'sales_revenue'],
                'forecast_horizon': 30,
            },
            'VarianceAgent': {
                'variance_types': ['budget', 'production'],
                'period_from': period_from,
                'period_to': period_to,
            },
            'RootCauseAgent': {
                'issue_type': 'production_shortfall',
                'issue_id': 'test_001',
            },
            'ScenarioAgent': {
                'scenario_type': 'demand_change',
                'parameters': {'demand_change_pct': 20},
            },
            # L5: Decision
            'RecommendationAgent': {
                'recommendation_type': 'cost_reduction',
                'target_domain': 'cost',
            },
            'ApprovalAdvisorAgent': {
                'request_type': 'budget_change',
                'amount': 1000000,
            },
            'AlertAgent': {
                'alert_types': ['threshold_breach', 'anomaly'],
                'severity': 'high',
            },
            # L6: Learning
            'EvaluationAgent': {
                'agent_names': ['CostIntelligenceAgent', 'ProductionIntelligenceAgent'],
                'evaluation_period_days': 30,
            },
            'ReflectionAgent': {
                'agent_name': 'CostIntelligenceAgent',
                'run_ids': [],
            },
            'MemoryCuratorAgent': {
                'memory_types': ['experience', 'pattern'],
                'curator_action': 'extract',
            },
            'KnowledgeUpdateAgent': {
                'update_type': 'pattern_discovery',
                'source_domain': 'production',
            },
        }

        params = agent_params.get(agent_name, {})

        return AgentInput(
            query=f"Test {agent_name}",
            context={'test_mode': True},
            parameters=params,
            requested_by='system',
        )

    def run_all_tests(self) -> Dict[str, Any]:
        """
        전체 에이전트 테스트 실행

        Returns:
            테스트 결과 요약
        """
        logger.info("\n" + "="*80)
        logger.info("NetPlus MIS-AI Dashboard 전체 에이전트 동작 테스트")
        logger.info("="*80)

        # 등록된 에이전트 목록 조회
        agents = registry.list_agents()
        total_agents = len(agents)

        logger.info(f"\n등록된 에이전트: {total_agents}개")
        logger.info("-"*80)

        # 계층별 그룹화
        agents_by_layer = {}
        for agent in agents:
            layer = agent['layer']
            if layer not in agents_by_layer:
                agents_by_layer[layer] = []
            agents_by_layer[layer].append(agent)

        # 계층 순서대로 테스트
        layer_order = ['intelligence', 'monitoring', 'analysis', 'decision', 'learning']
        tested_count = 0

        for layer in layer_order:
            if layer not in agents_by_layer:
                continue

            logger.info(f"\n{'='*80}")
            logger.info(f"{layer.upper()} LAYER 테스트")
            logger.info(f"{'='*80}")

            for agent in agents_by_layer[layer]:
                agent_name = agent['name']
                test_input = self.generate_test_input(agent_name)

                result = self.test_agent(agent_name, test_input)
                if result['success']:
                    tested_count += 1

        # 테스트 결과 요약
        end_time = datetime.now()
        total_duration = (end_time - self.start_time).total_seconds()

        summary = self._generate_summary(tested_count, total_agents, total_duration)

        # 결과 출력
        self._print_summary(summary)

        return summary

    def _generate_summary(self, tested_count: int, total_agents: int, duration: float) -> Dict[str, Any]:
        """
        테스트 결과 요약 생성
        """
        success_count = sum(1 for r in self.test_results if r['success'])
        error_count = len(self.test_results) - success_count

        # 성공한 에이전트
        successful_agents = [r['agent_name'] for r in self.test_results if r['success']]
        failed_agents = [(r['agent_name'], r['error']) for r in self.test_results if not r['success']]

        # 평균 실행 시간
        avg_execution_time = (
            sum(r['execution_time_ms'] for r in self.test_results if r['execution_time_ms'] > 0) /
            len(self.test_results)
            if self.test_results else 0
        )

        return {
            'total_agents': total_agents,
            'tested_count': tested_count,
            'success_count': success_count,
            'error_count': error_count,
            'success_rate': (success_count / total_agents * 100) if total_agents > 0 else 0,
            'total_duration_seconds': duration,
            'avg_execution_time_ms': avg_execution_time,
            'successful_agents': successful_agents,
            'failed_agents': failed_agents,
        }

    def _print_summary(self, summary: Dict[str, Any]):
        """
        테스트 결과 요약 출력
        """
        logger.info("\n" + "="*80)
        logger.info("테스트 결과 요약")
        logger.info("="*80)

        logger.info(f"\n전체 에이전트: {summary['total_agents']}개")
        logger.info(f"테스트 완료: {summary['tested_count']}개")
        logger.info(f"성공: {summary['success_count']}개")
        logger.info(f"실패: {summary['error_count']}개")
        logger.info(f"성공률: {summary['success_rate']:.1f}%")
        logger.info(f"총 소요 시간: {summary['total_duration_seconds']:.2f}초")
        logger.info(f"평균 실행 시간: {summary['avg_execution_time_ms']:.0f}ms")

        if summary['successful_agents']:
            logger.info(f"\n✅ 성공한 에이전트 ({len(summary['successful_agents'])}개):")
            for agent_name in sorted(summary['successful_agents']):
                logger.info(f"  - {agent_name}")

        if summary['failed_agents']:
            logger.info(f"\n❌ 실패한 에이전트 ({len(summary['failed_agents'])}개):")
            for agent_name, error in summary['failed_agents']:
                logger.info(f"  - {agent_name}: {error}")

        logger.info("\n" + "="*80)

        # 성공률에 따른 최종 메시지
        if summary['success_rate'] >= 90:
            logger.info("🎉 테스트 결과: 우수 (90% 이상 성공)")
        elif summary['success_rate'] >= 70:
            logger.info("✅ 테스트 결과: 양호 (70% 이상 성공)")
        elif summary['success_rate'] >= 50:
            logger.info("⚠️  테스트 결과: 보통 (50% 이상 성공)")
        else:
            logger.info("❌ 테스트 결과: 개선 필요 (50% 미만 성공)")

        logger.info("="*80)


def main():
    """메인 함수"""
    tester = AgentTester()
    summary = tester.run_all_tests()
    return summary


if __name__ == '__main__':
    main()
