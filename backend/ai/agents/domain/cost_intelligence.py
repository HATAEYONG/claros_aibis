# -*- coding: utf-8 -*-
"""
CostIntelligenceAgent — 원가 지능형 에이전트
4M2E(Man, Machine, Material, Method, Measurement, Environment) 기반
원가 편차 탐지 및 원가 드라이버 분석
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
from django.db.models import Avg, Sum, Count, Q, F, ExpressionWrapper, FloatField
from django.db.models.functions import Abs

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class CostIntelligenceAgent(BaseAgent):
    """
    원가 지능형 에이전트

    기능:
    - 4M2E 기반 원가 편차 탐지
    - 원가 드라이버 분석
    - 표준 원가 vs 실제 원가 비교
    - 원가 절감 기회 추천
    """

    name = "CostIntelligenceAgent"
    description = "원가 분석 및 4M2E 원가 편차 탐지 에이전트"
    version = "1.0.0"
    domain = "cost"
    layer = "intelligence"
    requires_human_approval = False

    # 4M2E 카테고리
    COST_CATEGORIES = {
        'man': '인건비',
        'machine': '기계비',
        'material': '재료비',
        'method': '방법비',
        'measurement': '측정비',
        'environment': '환경비',
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        # 필수 파라미터 확인
        if 'product_id' not in agent_input.parameters and 'plant' not in agent_input.parameters:
            # 최소한 하나는 있어야 함
            return True  # 전체 분석 가능
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """원가 지능 분석 실행"""

        try:
            # 파라미터 추출
            product_id = agent_input.parameters.get('product_id')
            plant = agent_input.parameters.get('plant')
            period_from = agent_input.parameters.get('period_from')
            period_to = agent_input.parameters.get('period_to')
            category = agent_input.parameters.get('category')  # 4M2E 카테고리 필터

            # 기간 설정
            if not period_from:
                period_from = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            if not period_to:
                period_to = datetime.now().strftime('%Y-%m-%d')

            # 1. 표준 원가 vs 실제 원가 분석
            variance_analysis = self._analyze_cost_variance(
                product_id=product_id,
                plant=plant,
                period_from=period_from,
                period_to=period_to,
                category=category
            )

            # 2. 4M2E 원가 드라이버 분석
            driver_analysis = self._analyze_cost_drivers(
                product_id=product_id,
                plant=plant,
                period_from=period_from,
                period_to=period_to
            )

            # 3. 원가 추세 분석
            trend_analysis = self._analyze_cost_trends(
                product_id=product_id,
                plant=plant,
                period_from=period_from,
                period_to=period_to
            )

            # 4. 원가 절감 기회 추천
            recommendations = self._generate_cost_recommendations(
                variance_analysis=variance_analysis,
                driver_analysis=driver_analysis,
                trend_analysis=trend_analysis
            )

            # 결과 구성
            result = {
                'summary': self._create_summary(variance_analysis, driver_analysis),
                'variance_analysis': variance_analysis,
                'driver_analysis': driver_analysis,
                'trend_analysis': trend_analysis,
                'analysis_metadata': {
                    'product_id': product_id,
                    'plant': plant,
                    'period_from': period_from,
                    'period_to': period_to,
                    'category': category,
                }
            }

            # 신뢰도 계산
            confidence = self._calculate_confidence(result)

            # 근거 참조 생성
            evidence_refs = self._create_evidence_refs(result)

            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="success",
                result=result,
                evidence_refs=evidence_refs,
                confidence=confidence,
                recommendations=recommendations,
                metadata={
                    'analysis_type': 'cost_intelligence',
                    '4m2e_categories': list(self.COST_CATEGORIES.keys()),
                }
            )

        except Exception as e:
            logger.exception(f"[{self.name}] 실행 오류: {e}")
            return AgentOutput(
                request_id=agent_input.request_id,
                agent_name=self.name,
                status="error",
                errors=[str(e)],
            )

    def _analyze_cost_variance(
        self,
        product_id: str = None,
        plant: str = None,
        period_from: str = None,
        period_to: str = None,
        category: str = None
    ) -> Dict[str, Any]:
        """
        표준 원가 vs 실제 원가 편차 분석
        기존 MonthlyCost, ProductCost 모델 사용
        """
        try:
            from cost.models import MonthlyCost, ProductCost
            from datetime import datetime

            # 날짜 파싱
            try:
                date_from = datetime.strptime(period_from, '%Y-%m-%d').date()
                date_to = datetime.strptime(period_to, '%Y-%m-%d').date()
            except:
                date_from = datetime.now().date()
                date_to = datetime.now().date()

            # 월별 원가 조회
            queryset = MonthlyCost.objects.filter(
                fiscal_year__gte=date_from.year,
                fiscal_year__lte=date_to.year
            )

            if date_from.month > 1:
                queryset = queryset.exclude(
                    fiscal_year=date_from.year,
                    fiscal_month__lt=date_from.month
                )
            if date_to.month < 12:
                queryset = queryset.exclude(
                    fiscal_year=date_to.year,
                    fiscal_month__gt=date_to.month
                )

            monthly_costs = queryset

            # 제품별 원가 조회 (product_id가 있는 경우)
            product_costs = ProductCost.objects.all()
            if product_id:
                product_costs = product_costs.filter(product_code=product_id)

            # 편차 분석
            variances = []
            total_variance = 0
            variance_count = 0

            for monthly in monthly_costs:
                # 재료비, 노무비, 경비 편차 분석
                total_actual = monthly.total_cost
                unit_cost = monthly.unit_cost

                # 이전 달과 비교 (편차 계산)
                previous_month = MonthlyCost.objects.filter(
                    fiscal_year=monthly.fiscal_year,
                    fiscal_month=monthly.fiscal_month - 1
                ).first()

                variance = 0
                variance_pct = 0
                if previous_month and previous_month.total_cost > 0:
                    variance = total_actual - previous_month.total_cost
                    variance_pct = (variance / previous_month.total_cost * 100)

                total_variance += abs(variance)
                variance_count += 1

                variances.append({
                    'period': f"{monthly.fiscal_year}-{monthly.fiscal_month:02d}",
                    'product_id': 'ALL',
                    'plant': 'ALL',
                    'cost_category': 'total',
                    'actual_cost': float(total_actual),
                    'standard_cost': float(previous_month.total_cost) if previous_month else 0,
                    'variance': float(variance),
                    'variance_pct': round(variance_pct, 2),
                    'variance_type': 'favorable' if variance >= 0 else 'unfavorable'
                })

            # 전체 편차 평균
            avg_variance = float(total_variance / variance_count) if variance_count > 0 else 0

            return {
                'variances': variances,
                'summary': {
                    'total_items': len(variances),
                    'avg_variance': avg_variance,
                    'significant_variances': len([v for v in variances if abs(v['variance_pct']) > 10]),
                }
            }

        except Exception as e:
            logger.error(f"원가 편차 분석 오류: {e}")
            return {'variances': [], 'summary': {}}

    def _analyze_cost_drivers(
        self,
        product_id: str = None,
        plant: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        4M2E 원가 드라이버 분석
        기존 MonthlyCost 모델 사용
        """
        drivers = {}

        try:
            from cost.models import MonthlyCost
            from datetime import datetime

            # 날짜 파싱
            try:
                date_from = datetime.strptime(period_from, '%Y-%m-%d').date()
                date_to = datetime.strptime(period_to, '%Y-%m-%d').date()
            except:
                date_from = datetime.now().date()
                date_to = datetime.now().date()

            # 4M2E 카테고리 매핑 (MonthlyCost 필드에 매핑)
            category_mapping = {
                'man': ('labor_cost', '인건비'),
                'machine': ('overhead_cost', '기계비'),
                'material': ('material_cost', '재료비'),
                'method': ('overhead_cost', '방법비'),
                'measurement': ('overhead_cost', '측정비'),
                'environment': ('overhead_cost', '환경비'),
            }

            for category_code, category_name in self.COST_CATEGORIES.items():
                # 카테고리별 원가 집계
                field_name, field_label = category_mapping.get(category_code, ('total_cost', category_name))

                queryset = MonthlyCost.objects.filter(
                    fiscal_year__gte=date_from.year,
                    fiscal_year__lte=date_to.year
                )

                # 카테고리별 집계 (해당 필드 합계)
                if field_name == 'total_cost':
                    category_data = queryset.aggregate(
                        total_cost=Sum(field_name),
                        avg_cost=Avg(field_name),
                        record_count=Count('id')
                    )
                else:
                    category_data = queryset.aggregate(
                        total_cost=Sum(field_name),
                        avg_cost=Avg(field_name),
                        record_count=Count('id')
                    )

                # 원가 절감 프로젝트에서 드라이버 정보 추출 (대안)
                top_drivers = []
                try:
                    from cost.models import CostReductionProject
                    # 해당 카테고리와 관련된 프로젝트 찾기
                    category_to_project = {
                        'man': 'labor',
                        'machine': 'overhead',
                        'material': 'material',
                        'method': 'overhead',
                        'measurement': 'overhead',
                        'environment': 'overhead',
                    }
                    project_category = category_to_project.get(category_code, 'overhead')

                    projects = CostReductionProject.objects.filter(
                        category=project_category,
                        status__in=['in-progress', 'completed']
                    ).order_by('-actual_saving')[:5]

                    for project in projects:
                        top_drivers.append({
                            'driver_name': project.title,
                            'total_impact': float(project.actual_saving),
                        })
                except:
                    pass

                drivers[category_code] = {
                    'category_name': category_name,
                    'total_cost': float(category_data['total_cost'] or 0),
                    'avg_cost': float(category_data['avg_cost'] or 0),
                    'record_count': category_data['record_count'] or 0,
                    'top_drivers': top_drivers,
                }

        except Exception as e:
            logger.error(f"원가 드라이버 분석 오류: {e}")

        return drivers

    def _analyze_cost_trends(
        self,
        product_id: str = None,
        plant: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        원가 추세 분석
        기존 MonthlyCost 모델 사용
        """
        try:
            from cost.models import MonthlyCost
            from datetime import datetime

            # 날짜 파싱
            try:
                date_from = datetime.strptime(period_from, '%Y-%m-%d').date()
                date_to = datetime.strptime(period_to, '%Y-%m-%d').date()
            except:
                date_from = datetime.now().date()
                date_to = datetime.now().date()

            # 월별 원가 집계
            queryset = MonthlyCost.objects.filter(
                fiscal_year__gte=date_from.year,
                fiscal_year__lte=date_to.year
            ).order_by('fiscal_year', 'fiscal_month')

            # 추선 계산
            trends = {}
            for category_code, category_name in self.COST_CATEGORIES.items():
                # 카테고리별 필드 매핑
                field_mapping = {
                    'man': 'labor_cost',
                    'machine': 'overhead_cost',
                    'material': 'material_cost',
                    'method': 'overhead_cost',
                    'measurement': 'overhead_cost',
                    'environment': 'overhead_cost',
                }
                field_name = field_mapping.get(category_code, 'total_cost')

                # 해당 카테고리 데이터 추출
                category_data = []
                for monthly in queryset:
                    cost_value = getattr(monthly, field_name, 0)
                    if cost_value > 0:
                        category_data.append({
                            'month': f"{monthly.fiscal_year}-{monthly.fiscal_month:02d}",
                            'total_cost': float(cost_value),
                            'avg_cost': float(cost_value),
                        })

                if len(category_data) >= 2:
                    costs = [float(m['total_cost']) for m in category_data]

                    # 단순 회귀 기반 추선
                    x = list(range(len(costs)))
                    if len(x) > 1:
                        # 단순 선형 회귀
                        n = len(x)
                        sum_x = sum(x)
                        sum_y = sum(costs)
                        sum_xy = sum(x[i] * costs[i] for i in range(n))
                        sum_x2 = sum(xi * xi for xi in x)

                        # 기울기 계산
                        if (n * sum_x2 - sum_x * sum_x) != 0:
                            trend_slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
                        else:
                            trend_slope = 0
                    else:
                        trend_slope = 0

                    # 추세 방향
                    if trend_slope > 0.01:
                        trend_direction = 'increasing'
                    elif trend_slope < -0.01:
                        trend_direction = 'decreasing'
                    else:
                        trend_direction = 'stable'

                    trends[category_code] = {
                        'category_name': self.COST_CATEGORIES[category_code],
                        'trend_direction': trend_direction,
                        'trend_slope': trend_slope,
                        'monthly_data': [
                            {
                                'month': m['month'].strftime('%Y-%m') if m['month'] else None,
                                'total_cost': float(m['total_cost']),
                            }
                            for m in category_data
                        ],
                    }

            return trends

        except Exception as e:
            logger.error(f"원가 추세 분석 오류: {e}")
            return {}

    def _generate_cost_recommendations(
        self,
        variance_analysis: Dict[str, Any],
        driver_analysis: Dict[str, Any],
        trend_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        원가 절감 기회 추천
        """
        recommendations = []

        # 1. 유의미한 편차 기반 추천
        for variance in variance_analysis.get('variances', []):
            if abs(variance['variance_pct']) > 10:  # 10% 이상 편차
                recommendations.append({
                    'type': 'cost_variance_action',
                    'priority': 'high' if abs(variance['variance_pct']) > 20 else 'medium',
                    'title': f"{variance['cost_category_name']} 원가 편차 조치 필요",
                    'description': (
                        f"{variance['cost_category_name']}에서 표준 대비 "
                        f"{abs(variance['variance_pct']):.1f}% "
                        f"{'초과' if variance['variance'] > 0 else '절감'}되었습니다."
                    ),
                    'action_items': [
                        f"원인 규명: {variance['cost_category']} 프로세스 검토",
                        f"목표: 편차 {abs(variance['variance_pct']):.1f}% 감소",
                    ],
                    'target_category': variance['cost_category'],
                    'potential_savings': abs(float(variance['variance'])),
                })

        # 2. 드라이버 기반 추천
        for category_code, category_data in driver_analysis.items():
            if category_data.get('top_drivers'):
                top_driver = category_data['top_drivers'][0]
                if top_driver['total_impact'] > 0:
                    recommendations.append({
                        'type': 'driver_optimization',
                        'priority': 'medium',
                        'title': f"{category_data['category_name']} 드라이버 최적화",
                        'description': (
                            f"주요 원가 드라이버 '{top_driver['driver_name']}'가 "
                            f"{top_driver['total_impact']:.0f} 영향을 미치고 있습니다."
                        ),
                        'action_items': [
                            f"{top_driver['driver_name']} 프로세스 최적화 검토",
                        ],
                        'target_category': category_code,
                    })

        # 3. 추세 기반 추천
        for category_code, trend_data in trend_analysis.items():
            if trend_data['trend_direction'] == 'increasing':
                recommendations.append({
                    'type': 'trend_alert',
                    'priority': 'medium',
                    'title': f"{trend_data['category_name']} 원가 상승 추세",
                    'description': (
                        f"{trend_data['category_name']} 원가가 지속적으로 상승하는 추세입니다."
                    ),
                    'action_items': [
                        "상승 원인 분석",
                        "비용 절감 계획 수립",
                    ],
                    'target_category': category_code,
                })

        return recommendations

    def _create_summary(
        self,
        variance_analysis: Dict[str, Any],
        driver_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        분석 요약 생성
        """
        summary = variance_analysis.get('summary', {})

        # 주요 비용 카테고리 식별
        category_totals = {
            code: data.get('total_cost', 0)
            for code, data in driver_analysis.items()
        }

        top_category = max(category_totals, key=category_totals.get) if category_totals else None

        return {
            'total_variances': summary.get('total_items', 0),
            'significant_variances': summary.get('significant_variances', 0),
            'avg_variance': summary.get('avg_variance', 0),
            'top_cost_category': top_category,
            'top_cost_category_name': self.COST_CATEGORIES.get(top_category, top_category) if top_category else None,
        }

    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        분석 결과 신뢰도 계산
        """
        # 데이터 양 기반 신뢰도
        variance_count = result['variance_analysis'].get('summary', {}).get('total_items', 0)

        # 기본 신뢰도
        confidence = 0.5

        # 데이터 양에 따른 신뢰도 증가
        if variance_count >= 10:
            confidence = 0.9
        elif variance_count >= 5:
            confidence = 0.8
        elif variance_count >= 2:
            confidence = 0.7

        return min(confidence, 0.95)  # 최대 95%

    def _create_evidence_refs(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        근거 참조 생성
        """
        evidence_refs = []

        # 원가 편차 데이터 참조
        variances = result['variance_analysis'].get('variances', [])
        for variance in variances[:3]:  # 상위 3개만
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='cost_variance',
                source='ActualCost',
                source_id=f"{variance['product_id']}_{variance['plant']}_{variance['cost_category']}",
                description=f"{variance['cost_category_name']} 편차 {variance['variance_pct']:.1f}%",
                data=variance,
            ))

        return evidence_refs
