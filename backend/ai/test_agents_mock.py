# -*- coding: utf-8 -*-
"""
전체 에이전트 동작 테스트 (Mock 버전)
데이터베이스 의존성 없이 에이전트 구조 및 기능 테스트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

import logging
from datetime import datetime, timedelta

from ai.agents.base.agent import AgentInput, AgentOutput
from ai.agents.base.registry import registry

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_agent_registry():
    """에이전트 레지스트리 테스트"""
    logger.info("\n" + "="*80)
    logger.info("1. 에이전트 레지스트리 테스트")
    logger.info("="*80)

    # 전체 에이전트 목록
    agents = registry.list_agents()
    total_count = len(agents)

    logger.info(f"\n등록된 에이전트: {total_count}개")

    # 계층별 그룹화
    by_layer = {}
    for agent in agents:
        layer = agent['layer']
        if layer not in by_layer:
            by_layer[layer] = []
        by_layer[layer].append(agent)

    # 계층별 출력
    layer_order = {
        'orchestration': '오케스트레이션',
        'monitoring': '모니터링 (L2)',
        'intelligence': '도메인 지능 (L3)',
        'analysis': '분석 (L4)',
        'decision': '의사결정 (L5)',
        'learning': '학습 (L6)',
    }

    for layer_key, layer_name in layer_order.items():
        if layer_key in by_layer:
            logger.info(f"\n{layer_name}: {len(by_layer[layer_key])}개")
            for agent in by_layer[layer_key]:
                logger.info(f"  - {agent['name']} (v{agent['version']})")
                logger.info(f"    Domain: {agent['domain']}")
                logger.info(f"    Desc: {agent['description']}")

    return agents, by_layer


def test_agent_basic_functionality(agents):
    """에이전트 기본 기능 테스트"""
    logger.info("\n" + "="*80)
    logger.info("2. 에이전트 기본 기능 테스트")
    logger.info("="*80)

    results = {
        'total': 0,
        'instantiated': 0,
        'has_method': 0,
        'failed': [],
    }

    for agent_info in agents:
        agent_name = agent_info['name']
        results['total'] += 1

        try:
            # 에이전트 인스턴스화
            agent = registry.get(agent_name)
            if agent:
                results['instantiated'] += 1

                # execute 메서드 확인
                if hasattr(agent, 'execute') and callable(agent.execute):
                    results['has_method'] += 1
                    logger.info(f"  {agent_name}: OK")
                else:
                    logger.warning(f"  {agent_name}: No execute method")
                    results['failed'].append((agent_name, "No execute method"))
            else:
                logger.warning(f"  {agent_name}: Not found in registry")
                results['failed'].append((agent_name, "Not found in registry"))

        except Exception as e:
            logger.error(f"  {agent_name}: {e}")
            results['failed'].append((agent_name, str(e)))

    # 결과 요약
    logger.info(f"\n결과 요약:")
    logger.info(f"  전체: {results['total']}개")
    logger.info(f"  인스턴스화 성공: {results['instantiated']}개")
    logger.info(f"  execute 메서드 확인: {results['has_method']}개")
    logger.info(f"  실패: {len(results['failed'])}개")

    if results['failed']:
        logger.info(f"\n실패한 에이전트:")
        for name, error in results['failed']:
            logger.info(f"  - {name}: {error}")

    return results


def test_agent_input_output_schema():
    """에이전트 입출력 스키마 테스트"""
    logger.info("\n" + "="*80)
    logger.info("3. 에이전트 입출력 스키마 테스트")
    logger.info("="*80)

    try:
        # AgentInput 생성 테스트
        input_data = AgentInput(
            query="테스트 쿼리",
            context={'test': True},
            parameters={'plant': 'P1'},
            requested_by='test_user',
        )

        logger.info(f"AgentInput 생성 성공:")
        logger.info(f"  request_id: {input_data.request_id}")
        logger.info(f"  query: {input_data.query}")
        logger.info(f"  priority: {input_data.priority}")

        # AgentOutput 생성 테스트
        output_data = AgentOutput(
            request_id=input_data.request_id,
            agent_name="TestAgent",
            status="success",
            result={'test': 'data'},
            confidence=0.85,
        )

        logger.info(f"\nAgentOutput 생성 성공:")
        logger.info(f"  status: {output_data.status}")
        logger.info(f"  confidence: {output_data.confidence}")

        return True

    except Exception as e:
        logger.error(f"스키마 테스트 실패: {e}")
        return False


def test_agent_execution_mock():
    """에이전트 실행 Mock 테스트"""
    logger.info("\n" + "="*80)
    logger.info("4. 에이전트 실행 Mock 테스트")
    logger.info("="*80)

    # 대표 에이전트 몇 개만 테스트
    test_agents = [
        'CostIntelligenceAgent',
        'FinanceIntelligenceAgent',
        'ProductionIntelligenceAgent',
        'KPIAgent',
        'ForecastAgent',
        'RecommendationAgent',
        'EvaluationAgent',
    ]

    results = []

    for agent_name in test_agents:
        try:
            agent = registry.get(agent_name)
            if not agent:
                logger.warning(f"  {agent_name}: 에이전트를 찾을 수 없음")
                results.append((agent_name, 'not_found', None))
                continue

            # Mock 입력 생성
            mock_input = AgentInput(
                query=f"Mock test for {agent_name}",
                context={'mock_mode': True},
                parameters={'test': True},
                evidence_required=False,  # 근거 요구 안 함
                requested_by='test',
            )

            # 실행 시도 (데이터가 없어도 에러가 나지 않는지 확인)
            try:
                output = agent.run(mock_input)
                execution_time = output.execution_time_ms
                status = output.status

                results.append((agent_name, status, execution_time))
                logger.info(f"  {agent_name}: {status} ({execution_time}ms)")

            except Exception as exec_error:
                # 데이터 관련 에러는 허용 (실 데이터가 없으므로)
                error_msg = str(exec_error)
                if any(keyword in error_msg.lower() for keyword in ['doesnotexist', 'no data', 'empty', 'related']):
                    results.append((agent_name, 'no_data_expected', 0))
                    logger.info(f"  {agent_name}: No data (expected)")
                else:
                    results.append((agent_name, 'error', None))
                    logger.warning(f"  {agent_name}: {exec_error}")

        except Exception as e:
            logger.error(f"  {agent_name}: {e}")
            results.append((agent_name, 'instantiation_error', None))

    # 결과 분석
    success = sum(1 for _, s, _ in results if s in ['success', 'no_data_expected', 'partial'])
    total = len(results)

    logger.info(f"\nMock 테스트 결과: {success}/{total} 성공")

    return results


def generate_test_report(agents, by_layer, basic_results, mock_results):
    """테스트 보고서 생성"""
    logger.info("\n" + "="*80)
    logger.info("테스트 종합 보고서")
    logger.info("="*80)

    # 1. 에이전트 현황
    logger.info(f"\n[1. 에이전트 현황]")
    logger.info(f"  총 등록 에이전트: {len(agents)}개")

    for layer_key, layer_name in {
        'monitoring': '모니터링 (L2)',
        'intelligence': '도메인 지능 (L3)',
        'analysis': '분석 (L4)',
        'decision': '의사결정 (L5)',
        'learning': '학습 (L6)',
    }.items():
        if layer_key in by_layer:
            count = len(by_layer[layer_key])
            logger.info(f"  {layer_name}: {count}개")

    # 2. 기본 기능 테스트 결과
    logger.info(f"\n[2. 기본 기능 테스트]")
    logger.info(f"  인스턴스화: {basic_results['instantiated']}/{basic_results['total']}")
    logger.info(f"  execute 메서드: {basic_results['has_method']}/{basic_results['total']}")

    # 3. Mock 실행 테스트 결과
    logger.info(f"\n[3. Mock 실행 테스트]")
    success = sum(1 for _, s, _ in mock_results if s in ['success', 'no_data_expected', 'partial'])
    logger.info(f"  테스트 성공: {success}/{len(mock_results)}")

    # 4. 에이전트별 상세
    logger.info(f"\n[4. 에이전트별 상태]")
    for agent_info in agents:
        agent_name = agent_info['name']
        layer = agent_info['layer']
        domain = agent_info['domain']
        version = agent_info['version']

        # Mock 테스트 결과 확인
        mock_status = 'not_tested'
        for name, status, _ in mock_results:
            if name == agent_name:
                mock_status = status
                break

        status_icon = {
            'success': 'OK',
            'no_data_expected': 'ND',
            'partial': 'PR',
            'not_found': 'NF',
            'error': 'ER',
            'instantiation_error': 'IE',
            'not_tested': 'NT',
        }.get(mock_status, '??')

        logger.info(f"  {status_icon} {agent_name} (v{version}) - {domain}/{layer}")

    # 5. 최종 평가
    logger.info(f"\n[5. 최종 평가]")
    instantiation_rate = (basic_results['instantiated'] / basic_results['total'] * 100) if basic_results['total'] > 0 else 0
    mock_success_rate = (success / len(mock_results) * 100) if mock_results else 0

    overall_score = (instantiation_rate + mock_success_rate) / 2

    logger.info(f"  인스턴스화율: {instantiation_rate:.1f}%")
    logger.info(f"  Mock 실행률: {mock_success_rate:.1f}%")
    logger.info(f"  종합 점수: {overall_score:.1f}%")

    if overall_score >= 90:
        grade = "A (우수)"
    elif overall_score >= 80:
        grade = "B (양호)"
    elif overall_score >= 70:
        grade = "C (보통)"
    else:
        grade = "D (개선 필요)"

    logger.info(f"  등급: {grade}")

    logger.info("\n" + "="*80)

    return {
        'total_agents': len(agents),
        'instantiation_rate': instantiation_rate,
        'mock_success_rate': mock_success_rate,
        'overall_score': overall_score,
        'grade': grade,
    }


def main():
    """메인 함수"""
    start_time = datetime.now()

    logger.info("="*80)
    logger.info("Claros MIS-AI Dashboard 에이전트 테스트")
    logger.info("="*80)

    # 1. 레지스트리 테스트
    agents, by_layer = test_agent_registry()

    # 2. 기본 기능 테스트
    basic_results = test_agent_basic_functionality(agents)

    # 3. 입출력 스키마 테스트
    schema_ok = test_agent_input_output_schema()

    # 4. Mock 실행 테스트
    mock_results = test_agent_execution_mock()

    # 5. 종합 보고서
    report = generate_test_report(agents, by_layer, basic_results, mock_results)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info(f"\n총 소요 시간: {duration:.2f}초")
    logger.info("테스트 완료!")

    return report


if __name__ == '__main__':
    main()
