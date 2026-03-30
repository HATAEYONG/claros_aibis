"""
시나리오 분석 에이전트 (Scenario Agent)
What-if 분석 및 시나리오 시뮬레이션
"""
import uuid
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput


class ScenarioAgent(BaseAgent):
    """
    시나리오 분석 에이전트
    - What-if 시나리오 분석
    - 민감도 분석 (Sensitivity Analysis)
    - 시나리오 비교
    - 최적 시나리오 추천
    """

    # 에이전트 메타데이터
    agent_type = "scenario_analysis"
    agent_name = "ScenarioAgent"
    agent_description = "What-if 분석 및 시나리오 시뮬레이션을 위한 지능형 에이전트"
    agent_domain = "analysis"
    agent_layer = "analysis"  # L4: Analysis

    # 시나리오 분석 파라미터
    SCENARIO_TYPES = [
        'best_case',       # 최상 시나리오
        'base_case',       # 기준 시나리오
        'worst_case',      # 최악 시나리오
        'custom',          # 사용자 정의 시나리오
    ]

    # 분석 차원
    ANALYSIS_DIMENSIONS = [
        'cost',           # 원가
        'revenue',        # 매출
        'production',     # 생산
        'quality',        # 품질
        'cashflow',       # 현금흐름
        'profitability',  # 수익성
    ]

    def pre_execute(self, input_data: AgentInput) -> None:
        """실행 전 검증"""
        if not input_data.parameters.get('scenarios'):
            raise ValueError("scenarios parameter is required for scenario analysis")

    def execute(self, input_data: AgentInput) -> AgentOutput:
        """
        시나리오 분석 실행

        Args:
            input_data: {
                'context': {
                    'fiscal_year': int,
                    'fiscal_month': int,
                    'analysis_dimension': str,  # cost, revenue, production, etc.
                },
                'parameters': {
                    'scenarios': List[Dict],  # 시나리오 정의
                    'base_metrics': Dict,     # 기준 지표
                }
            }
        """
        context = input_data.context
        parameters = input_data.parameters

        fiscal_year = context.get('fiscal_year', date.today().year)
        fiscal_month = context.get('fiscal_month', date.today().month)
        analysis_dimension = context.get('analysis_dimension', 'profitability')

        scenarios = parameters.get('scenarios', [])
        base_metrics = parameters.get('base_metrics', {})

        results = {
            'fiscal_year': fiscal_year,
            'fiscal_month': fiscal_month,
            'analysis_dimension': analysis_dimension,
            'scenarios': [],
            'comparison': {},
            'recommendations': [],
        }

        # 1. 각 시나리오 분석
        for scenario in scenarios:
            scenario_result = self._analyze_scenario(
                scenario, base_metrics, analysis_dimension
            )
            results['scenarios'].append(scenario_result)

        # 2. 시나리오 비교 분석
        if len(results['scenarios']) >= 2:
            results['comparison'] = self._compare_scenarios(results['scenarios'])

        # 3. 최적 시나리오 추천
        results['recommendations'] = self._recommend_optimal_scenario(
            results['scenarios'], analysis_dimension
        )

        # 증거 생성
        evidence_refs = [
            self.create_evidence_ref(
                source_type='ScenarioAnalysis',
                source_id=f'{fiscal_year}-{fiscal_month}-{analysis_dimension}',
                description=f'{fiscal_year}년 {fiscal_month}월 {analysis_dimension} 시나리오 분석'
            )
        ]

        return AgentOutput(
            status='success',
            data=results,
            confidence_score=self._calculate_confidence(results),
            message=f"시나리오 분석 완료: {len(results['scenarios'])}개 시나리오 분석",
            evidence_refs=evidence_refs,
        )

    def _analyze_scenario(
        self,
        scenario: Dict[str, Any],
        base_metrics: Dict[str, Any],
        dimension: str
    ) -> Dict[str, Any]:
        """
        개별 시나리오 분석

        Args:
            scenario: 시나리오 정의
            base_metrics: 기준 지표
            dimension: 분석 차원

        Returns:
            시나리오 분석 결과
        """
        scenario_name = scenario.get('name', 'unnamed')
        scenario_type = scenario.get('type', 'custom')
        assumptions = scenario.get('assumptions', {})

        # 기준 지표 로드
        base_revenue = base_metrics.get('revenue', Decimal('0'))
        base_cost = base_metrics.get('cost', Decimal('0'))
        base_production = base_metrics.get('production', Decimal('0'))
        base_defect_rate = base_metrics.get('defect_rate', Decimal('0'))

        # 시나리오별 가정 적용
        if scenario_type == 'best_case':
            # 최상: 매출 +20%, 원가 -10%, 생산 +15%, 불량률 -50%
            revenue_multiplier = Decimal('1.20')
            cost_multiplier = Decimal('0.90')
            production_multiplier = Decimal('1.15')
            defect_rate_multiplier = Decimal('0.50')

        elif scenario_type == 'worst_case':
            # 최악: 매출 -20%, 원가 +15%, 생산 -10%, 불량률 +100%
            revenue_multiplier = Decimal('0.80')
            cost_multiplier = Decimal('1.15')
            production_multiplier = Decimal('0.90')
            defect_rate_multiplier = Decimal('2.00')

        elif scenario_type == 'base_case':
            # 기준: 변화 없음
            revenue_multiplier = Decimal('1.00')
            cost_multiplier = Decimal('1.00')
            production_multiplier = Decimal('1.00')
            defect_rate_multiplier = Decimal('1.00')

        else:
            # 사용자 정의: assumptions에서 직접 가져오기
            revenue_multiplier = Decimal(str(assumptions.get('revenue_multiplier', 1.0)))
            cost_multiplier = Decimal(str(assumptions.get('cost_multiplier', 1.0)))
            production_multiplier = Decimal(str(assumptions.get('production_multiplier', 1.0)))
            defect_rate_multiplier = Decimal(str(assumptions.get('defect_rate_multiplier', 1.0)))

        # 시나리오별 지표 계산
        scenario_revenue = base_revenue * revenue_multiplier
        scenario_cost = base_cost * cost_multiplier
        scenario_production = base_production * production_multiplier
        scenario_defect_rate = base_defect_rate * defect_rate_multiplier

        # 수익성 계산
        scenario_profit = scenario_revenue - scenario_cost
        base_profit = base_revenue - base_cost
        profit_change = scenario_profit - base_profit
        profit_margin = (scenario_profit / scenario_revenue * 100) if scenario_revenue > 0 else 0

        # 결과 생성
        result = {
            'name': scenario_name,
            'type': scenario_type,
            'assumptions': assumptions,
            'metrics': {
                'revenue': float(scenario_revenue),
                'cost': float(scenario_cost),
                'production': float(scenario_production),
                'defect_rate': float(scenario_defect_rate),
                'profit': float(scenario_profit),
                'profit_margin': float(profit_margin),
            },
            'changes': {
                'revenue_change_pct': float((revenue_multiplier - 1) * 100),
                'cost_change_pct': float((cost_multiplier - 1) * 100),
                'production_change_pct': float((production_multiplier - 1) * 100),
                'defect_rate_change_pct': float((defect_rate_multiplier - 1) * 100),
                'profit_change': float(profit_change),
                'profit_change_pct': float((profit_change / base_profit * 100) if base_profit != 0 else 0),
            },
        }

        # 위험 평가
        result['risk_assessment'] = self._assess_scenario_risk(result, base_metrics)

        return result

    def _compare_scenarios(self, scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        시나리오 비교 분석

        Args:
            scenarios: 시나리오 결과 목록

        Returns:
            비교 분석 결과
        """
        if not scenarios:
            return {}

        # 수익 기준 정렬
        sorted_by_profit = sorted(scenarios, key=lambda x: x['metrics']['profit'], reverse=True)

        best_scenario = sorted_by_profit[0]
        worst_scenario = sorted_by_profit[-1]

        profit_range = best_scenario['metrics']['profit'] - worst_scenario['metrics']['profit']

        # 민감도 분석
        sensitivity = {}
        if len(scenarios) >= 2:
            # 매출 변동에 따른 이익 민감도
            revenue_changes = [s['changes']['revenue_change_pct'] for s in scenarios]
            profit_changes = [s['changes']['profit_change_pct'] for s in scenarios]

            # 간단한 상관관계 대신 최대/최소 비율 사용
            max_profit_change = max(profit_changes) if profit_changes else 0
            min_profit_change = min(profit_changes) if profit_changes else 0

            sensitivity['profit_to_revenue'] = {
                'max_profit_change_pct': max_profit_change,
                'min_profit_change_pct': min_profit_change,
                'volatility': abs(max_profit_change - min_profit_change),
            }

        return {
            'best_scenario': best_scenario['name'],
            'worst_scenario': worst_scenario['name'],
            'profit_range': float(profit_range),
            'best_profit': float(best_scenario['metrics']['profit']),
            'worst_profit': float(worst_scenario['metrics']['profit']),
            'sensitivity_analysis': sensitivity,
        }

    def _recommend_optimal_scenario(
        self,
        scenarios: List[Dict[str, Any]],
        dimension: str
    ) -> List[Dict[str, Any]]:
        """
        최적 시나리오 추천

        Args:
            scenarios: 시나리오 결과 목록
            dimension: 분석 차원

        Returns:
            추천사항 목록
        """
        recommendations = []

        if not scenarios:
            return recommendations

        # 수익성 기준 최적 시나리오 선정
        sorted_by_profit = sorted(scenarios, key=lambda x: x['metrics']['profit'], reverse=True)
        optimal = sorted_by_profit[0]

        # 위험 조정 수익률 (단순 구현)
        best_risk_adjusted = sorted(
            [s for s in scenarios if s.get('risk_assessment', {}).get('level') != 'CRITICAL'],
            key=lambda x: x['metrics']['profit'] / max(x.get('risk_assessment', {}).get('score', 1), 0.1),
            reverse=True
        )

        if best_risk_adjusted:
            recommendation = {
                'optimal_scenario': best_risk_adjusted[0]['name'],
                'reason': f'최고 이익 ({best_risk_adjusted[0]["metrics"]["profit"]:.0f})와 적정 위험 수준의 균형',
                'expected_profit': float(best_risk_adjusted[0]['metrics']['profit']),
                'profit_margin': float(best_risk_adjusted[0]['metrics']['profit_margin']),
                'risk_level': best_risk_adjusted[0].get('risk_assessment', {}).get('level', 'UNKNOWN'),
                'action_items': [
                    f'시나리오 "{best_risk_adjusted[0]["name"]}" 기반 의사결정 고려',
                    '주요 리스크 관리 계획 수립',
                    '정기적 시나리오 재검토',
                ],
            }
            recommendations.append(recommendation)

        # 대안 시나리오 추천 (위험 헷지)
        if len(scenarios) >= 2:
            conservative = min(
                [s for s in scenarios if s.get('risk_assessment', {}).get('level') in ['LOW', 'MEDIUM']],
                key=lambda x: x.get('risk_assessment', {}).get('score', 1),
                default=None
            )

            if conservative:
                recommendation = {
                    'alternative_scenario': conservative['name'],
                    'reason': '보수적인 접근 (안정성 우선)',
                    'expected_profit': float(conservative['metrics']['profit']),
                    'risk_level': conservative.get('risk_assessment', {}).get('level', 'UNKNOWN'),
                    'action_items': [
                        f'시나리오 "{conservative["name"]}"을 위험 헷지 옵션으로 활용',
                        '시장 상황에 따라 유연한 전략 전개',
                    ],
                }
                recommendations.append(recommendation)

        return recommendations

    def _assess_scenario_risk(
        self,
        scenario_result: Dict[str, Any],
        base_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        시나리오 위험 평가

        Args:
            scenario_result: 시나리오 분석 결과
            base_metrics: 기준 지표

        Returns:
            위험 평가 결과
        """
        metrics = scenario_result['metrics']
        changes = scenario_result['changes']

        risk_factors = []
        risk_score = 1.0  # 1.0 = 기본, 낮을수록 위험도 높음

        # 수익성 위험
        if metrics['profit'] < 0:
            risk_factors.append({
                'factor': 'negative_profit',
                'severity': 'CRITICAL',
                'description': '시나리오에서 손실 발생',
            })
            risk_score -= 0.3

        elif changes['profit_change_pct'] < -30:
            risk_factors.append({
                'factor': 'significant_profit_decline',
                'severity': 'HIGH',
                'description': f'이익 {changes["profit_change_pct"]:.1f}% 감소',
            })
            risk_score -= 0.2

        # 현금흐름 위험 (간접적 평가)
        if changes['revenue_change_pct'] < -20:
            risk_factors.append({
                'factor': 'cashflow_pressure',
                'severity': 'HIGH',
                'description': f'매출 {changes["revenue_change_pct"]:.1f}% 감소로 현금흐름 압박 우려',
            })
            risk_score -= 0.15

        # 품질 위험
        if changes['defect_rate_change_pct'] > 50:
            risk_factors.append({
                'factor': 'quality_deterioration',
                'severity': 'HIGH',
                'description': f'불량률 {changes["defect_rate_change_pct"]:.1f}% 증가',
            })
            risk_score -= 0.15

        # 종합 위험 등급
        if risk_score >= 0.8:
            level = 'LOW'
        elif risk_score >= 0.5:
            level = 'MEDIUM'
        elif risk_score >= 0.2:
            level = 'HIGH'
        else:
            level = 'CRITICAL'

        return {
            'score': max(0, risk_score),
            'level': level,
            'factors': risk_factors,
        }

    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        """결과 신뢰도 계산"""
        scenario_count = len(results.get('scenarios', []))

        if scenario_count == 0:
            return 0.3
        elif scenario_count >= 4:
            return 0.85
        elif scenario_count >= 3:
            return 0.8
        else:
            return 0.7

    def post_execute(self, input_data: AgentInput, output_data: AgentOutput) -> None:
        """실행 후 처리"""
        pass


# 시나리오 생성 헬퍼 함수
def create_standard_scenarios() -> List[Dict[str, Any]]:
    """
    표준 시나리오 생성

    Returns:
        표준 시나리오 목록
    """
    return [
        {
            'name': '최상 시나리오',
            'type': 'best_case',
            'description': '매출 증가, 원가 감소, 품질 개선 동시 달성',
            'assumptions': {
                'revenue_multiplier': 1.20,
                'cost_multiplier': 0.90,
                'production_multiplier': 1.15,
                'defect_rate_multiplier': 0.50,
            }
        },
        {
            'name': '기준 시나리오',
            'type': 'base_case',
            'description': '현재 추세 유지',
            'assumptions': {
                'revenue_multiplier': 1.00,
                'cost_multiplier': 1.00,
                'production_multiplier': 1.00,
                'defect_rate_multiplier': 1.00,
            }
        },
        {
            'name': '최악 시나리오',
            'type': 'worst_case',
            'description': '매출 감소, 원가 증가, 품질 악화 동시 발생',
            'assumptions': {
                'revenue_multiplier': 0.80,
                'cost_multiplier': 1.15,
                'production_multiplier': 0.90,
                'defect_rate_multiplier': 2.00,
            }
        },
    ]


def get_dimension_kpi_mappings() -> Dict[str, List[str]]:
    """
    분석 차원별 KPI 매핑

    Returns:
        차원별 KPI 목록
    """
    return {
        'cost': ['material_cost', 'labor_cost', 'overhead_cost', 'total_cost'],
        'revenue': ['sales_revenue', 'service_revenue', 'total_revenue'],
        'production': ['production_volume', 'capacity_utilization', 'yield_rate'],
        'quality': ['defect_rate', 'first_pass_yield', 'customer_returns'],
        'cashflow': ['operating_cashflow', 'free_cashflow', 'cash_conversion_cycle'],
        'profitability': ['gross_profit', 'operating_profit', 'net_profit', 'profit_margin'],
    }
