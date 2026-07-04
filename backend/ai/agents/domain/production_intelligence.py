# -*- coding: utf-8 -*-
"""
ProductionIntelligenceAgent — 생산 지능형 에이전트
생산 모니터링, 산출량 분석, 설비 가용율 최적화
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
from django.db.models import Avg, Sum, Count, Q, F, Max, Min, ExpressionWrapper, FloatField
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class ProductionIntelligenceAgent(BaseAgent):
    """
    생산 지능형 에이전트

    기능:
    - 생산 실적 분석
    - 설비 가용율 모니터링
    - 생산 효율성 분석
    - 생산 계획 대비 실적 평가
    """

    name = "ProductionIntelligenceAgent"
    description = "생산 분석 및 설비 효율 모니터링 에이전트"
    version = "1.0.0"
    domain = "production"
    layer = "intelligence"
    requires_human_approval = False

    # 성과 기준값
    PERFORMANCE_TARGETS = {
        'output_achievement_rate': 95.0,  # 생산 목표 달성률
        'equipment_availability': 85.0,   # 설비 가동률
        'yield_rate': 98.0,                # 수율
        'oee_target': 85.0,                # OEE 목표
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """생산 지능 분석 실행"""

        try:
            # 파라미터 추출
            plant = agent_input.parameters.get('plant')
            line = agent_input.parameters.get('line')
            product_id = agent_input.parameters.get('product_id')
            equipment_id = agent_input.parameters.get('equipment_id')
            period_from = agent_input.parameters.get('period_from')
            period_to = agent_input.parameters.get('period_to')
            analysis_type = agent_input.parameters.get('analysis_type', 'all')

            # 기간 설정
            if not period_from:
                period_from = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            if not period_to:
                period_to = datetime.now().strftime('%Y-%m-%d')

            # 분석 수행
            result = {
                'production_performance': {},
                'equipment_utilization': {},
                'efficiency_analysis': {},
                'performance_alerts': [],
            }

            if analysis_type in ['all', 'performance']:
                result['production_performance'] = self._analyze_production_performance(
                    plant=plant,
                    line=line,
                    product_id=product_id,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'equipment']:
                result['equipment_utilization'] = self._analyze_equipment_utilization(
                    plant=plant,
                    line=line,
                    equipment_id=equipment_id,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'efficiency']:
                result['efficiency_analysis'] = self._analyze_efficiency(
                    plant=plant,
                    line=line,
                    product_id=product_id,
                    period_from=period_from,
                    period_to=period_to
                )

            # 성과 알림 생성
            result['performance_alerts'] = self._generate_performance_alerts(result)

            # 추천 생성
            recommendations = self._generate_recommendations(result)

            # 신뢰도 계산
            confidence = self._calculate_confidence(result)

            # 근거 참조
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
                    'plant': plant,
                    'line': line,
                    'product_id': product_id,
                    'equipment_id': equipment_id,
                    'period_from': period_from,
                    'period_to': period_to,
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

    def _analyze_production_performance(
        self,
        plant: str = None,
        line: str = None,
        product_id: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        생산 성과 분석
        """
        try:
            from production.models import ProductionResult, ProductionPlan

            # 생산 실적 조회
            queryset = ProductionResult.objects.filter(
                production_date__gte=period_from,
                production_date__lte=period_to
            )

            if plant:
                queryset = queryset.filter(plant=plant)
            if line:
                queryset = queryset.filter(line=line)
            if product_id:
                queryset = queryset.filter(product_id=product_id)

            # 일별/주별/월별 집계
            daily_production = queryset.annotate(
                day=TruncDay('production_date')
            ).values('day', 'plant', 'line', 'product_id', 'product_name').annotate(
                planned_qty=Sum('planned_quantity'),
                actual_qty=Sum('actual_quantity'),
                good_qty=Sum('good_quantity'),
                defect_qty=Sum('defect_quantity')
            ).order_by('day')

            # 요약 통계
            summary = queryset.aggregate(
                total_planned=Sum('planned_quantity'),
                total_actual=Sum('actual_quantity'),
                total_good=Sum('good_quantity'),
                total_defect=Sum('defect_quantity'),
                production_days=Count('production_date', distinct=True)
            )

            # 성과 지표 계산
            total_planned = summary['total_planned'] or 0
            total_actual = summary['actual_quantity'] or 0
            total_good = summary['total_good'] or 0

            achievement_rate = (total_actual / total_planned * 100) if total_planned > 0 else 0
            yield_rate = (total_good / total_actual * 100) if total_actual > 0 else 0
            defect_rate = (summary['total_defect'] or 0) / total_actual * 100 if total_actual > 0 else 0

            # 시계열 데이터 구성
            time_series = []
            for item in daily_production:
                planned = item['planned_qty'] or 0
                actual = item['actual_qty'] or 0
                good = item['good_qty'] or 0

                time_series.append({
                    'date': item['day'].strftime('%Y-%m-%d') if item['day'] else None,
                    'plant': item['plant'],
                    'line': item['line'],
                    'product_id': item['product_id'],
                    'product_name': item['product_name'],
                    'planned_qty': float(planned),
                    'actual_qty': float(actual),
                    'good_qty': float(good),
                    'defect_qty': float(item['defect_qty'] or 0),
                    'achievement_rate': float((actual / planned * 100) if planned > 0 else 0),
                    'yield_rate': float((good / actual * 100) if actual > 0 else 0),
                })

            return {
                'time_series': time_series,
                'summary': {
                    'total_planned': float(total_planned),
                    'total_actual': float(total_actual),
                    'total_good': float(total_good),
                    'total_defect': float(summary['total_defect'] or 0),
                    'achievement_rate': float(achievement_rate),
                    'yield_rate': float(yield_rate),
                    'defect_rate': float(defect_rate),
                    'production_days': summary['production_days'] or 0,
                }
            }

        except Exception as e:
            logger.error(f"생산 성과 분석 오류: {e}")
            return {'time_series': [], 'summary': {}}

    def _analyze_equipment_utilization(
        self,
        plant: str = None,
        line: str = None,
        equipment_id: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        설비 가동률 분석
        """
        try:
            from production.models import EquipmentLog, Equipment

            # 설비 로그 조회
            queryset = EquipmentLog.objects.filter(
                log_date__gte=period_from,
                log_date__lte=period_to
            )

            if plant:
                queryset = queryset.filter(equipment__plant=plant)
            if line:
                queryset = queryset.filter(equipment__line=line)
            if equipment_id:
                queryset = queryset.filter(equipment_id=equipment_id)

            # 설비별 가동 시간 집계
            equipment_stats = queryset.values('equipment_id', 'equipment__equipment_code', 'equipment__equipment_name').annotate(
                total_logs=Count('log_id'),
                operating_hours=Sum(F('stop_time') - F('start_time')),
                downtime_hours=Sum('downtime_hours'),
                total_available_hours=Sum('available_hours')
            )

            utilization_data = []
            for stat in equipment_stats:
                available_hours = stat['total_available_hours'] or 0
                operating_hours = stat['operating_hours'].total_seconds() / 3600 if stat['operating_hours'] else 0
                downtime_hours = stat['downtime_hours'] or 0

                availability = ((available_hours - downtime_hours) / available_hours * 100) if available_hours > 0 else 0

                utilization_data.append({
                    'equipment_id': stat['equipment_id'],
                    'equipment_code': stat['equipment__equipment_code'],
                    'equipment_name': stat['equipment__equipment_name'],
                    'available_hours': float(available_hours),
                    'operating_hours': float(operating_hours),
                    'downtime_hours': float(downtime_hours),
                    'availability_rate': float(availability),
                    'utilization_rate': float((operating_hours / available_hours * 100) if available_hours > 0 else 0),
                })

            # 전체 평균
            if utilization_data:
                avg_availability = sum(u['availability_rate'] for u in utilization_data) / len(utilization_data)
                avg_utilization = sum(u['utilization_rate'] for u in utilization_data) / len(utilization_data)
            else:
                avg_availability = 0
                avg_utilization = 0

            return {
                'equipment_utilization': utilization_data,
                'summary': {
                    'total_equipment': len(utilization_data),
                    'avg_availability': float(avg_availability),
                    'avg_utilization': float(avg_utilization),
                    'low_availability_count': len([u for u in utilization_data if u['availability_rate'] < 80]),
                }
            }

        except Exception as e:
            logger.error(f"설비 가동률 분석 오류: {e}")
            return {'equipment_utilization': [], 'summary': {}}

    def _analyze_efficiency(
        self,
        plant: str = None,
        line: str = None,
        product_id: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        생산 효율성 분석 (OEE 등)
        """
        try:
            from production.models import ProductionResult, EquipmentLog

            # 생산 데이터
            prod_queryset = ProductionResult.objects.filter(
                production_date__gte=period_from,
                production_date__lte=period_to
            )

            if plant:
                prod_queryset = prod_queryset.filter(plant=plant)
            if line:
                prod_queryset = prod_queryset.filter(line=line)
            if product_id:
                prod_queryset = prod_queryset.filter(product_id=product_id)

            # 기본 효율 지표
            agg = prod_queryset.aggregate(
                total_planned=Sum('planned_quantity'),
                total_actual=Sum('actual_quantity'),
                total_good=Sum('good_quantity'),
                total_operating_time=Sum('operating_hours')
            )

            total_planned = agg['total_planned'] or 0
            total_actual = agg['actual_quantity'] or 0
            total_good = agg['total_good'] or 0
            operating_time = agg['total_operating_time'] or 0

            # OEE (Overall Equipment Effectiveness) 계산
            # 가용률 (Availability)
            target_time = operating_time * 1.1  # 가동 시간의 110%를 목표 가동 시간으로 가정
            availability = (operating_time / target_time * 100) if target_time > 0 else 0

            # 성능률 (Performance)
            performance = (total_actual / total_planned * 100) if total_planned > 0 else 0

            # 품질률 (Quality)
            quality = (total_good / total_actual * 100) if total_actual > 0 else 0

            # OEE
            oee = availability * performance * quality / 10000  # 세 지표를 곱하고 10000으로 나눔

            # 주기 시간 (Cycle Time)
            if total_actual > 0 and operating_time > 0:
                cycle_time = operating_time / total_actual
            else:
                cycle_time = 0

            # TAKT Time (목표 대비 실제 주기)
            if total_actual > 0:
                takt_time = operating_time / total_planned if total_planned > 0 else 0
            else:
                takt_time = 0

            return {
                'oee': {
                    'availability': float(availability),
                    'performance': float(performance),
                    'quality': float(quality),
                    'oee': float(oee),
                    'oee_world_class': oee >= 85,  # 세계 클래스 OEE 기준
                },
                'cycle_metrics': {
                    'cycle_time': float(cycle_time),
                    'takt_time': float(takt_time),
                    'cycle_efficiency': float((takt_time / cycle_time * 100) if cycle_time > 0 else 0),
                },
                'productivity_metrics': {
                    'units_per_hour': float(total_actual / operating_time) if operating_time > 0 else 0,
                    'good_units_per_hour': float(total_good / operating_time) if operating_time > 0 else 0,
                },
            }

        except Exception as e:
            logger.error(f"효율성 분석 오류: {e}")
            return {}

    def _generate_performance_alerts(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        생산 성과 알림 생성
        """
        alerts = []

        # 생산 달성률 알림
        perf_summary = result.get('production_performance', {}).get('summary', {})
        achievement_rate = perf_summary.get('achievement_rate', 0)
        target = self.PERFORMANCE_TARGETS['output_achievement_rate']

        if achievement_rate < target:
            alerts.append({
                'type': 'low_achievement',
                'severity': 'high' if achievement_rate < target - 10 else 'medium',
                'message': f"생산 달성률 {achievement_rate:.1f}% (목표: {target}%)",
                'recommendation': '생산 계획 검토 및 병목 공정 개선 필요',
            })

        # 수율 알림
        yield_rate = perf_summary.get('yield_rate', 0)
        yield_target = self.PERFORMANCE_TARGETS['yield_rate']

        if yield_rate < yield_target:
            alerts.append({
                'type': 'low_yield',
                'severity': 'high' if yield_rate < yield_target - 2 else 'medium',
                'message': f"수율 {yield_rate:.1f}% (목표: {yield_target}%)",
                'recommendation': '불량 원인 분석 및 공정 개선 필요',
            })

        # 설비 가동률 알림
        equip_summary = result.get('equipment_utilization', {}).get('summary', {})
        avg_availability = equip_summary.get('avg_availability', 0)
        availability_target = self.PERFORMANCE_TARGETS['equipment_availability']

        if avg_availability < availability_target:
            alerts.append({
                'type': 'low_equipment_availability',
                'severity': 'medium',
                'message': f"설비 가동률 {avg_availability:.1f}% (목표: {availability_target}%)",
                'recommendation': '설비 다운타임 원인 분석 및 예방 보전 강화',
            })

        # OEE 알림
        oee_data = result.get('efficiency_analysis', {}).get('oee', {})
        oee = oee_data.get('oee', 0)
        oee_target = self.PERFORMANCE_TARGETS['oee_target']

        if oee < oee_target:
            alerts.append({
                'type': 'low_oee',
                'severity': 'medium',
                'message': f"OEE {oee:.1f}% (목표: {oee_target}%)",
                'recommendation': 'OEE 구성 요소(가동률, 성능률, 품질률) 분석 필요',
            })

        return alerts

    def _generate_recommendations(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        생산 개선 추천
        """
        recommendations = []

        # 성과 알림 기반 추천
        alerts = result.get('performance_alerts', [])

        for alert in alerts:
            if alert['type'] == 'low_achievement':
                recommendations.append({
                    'type': 'production_improvement',
                    'priority': alert['severity'],
                    'title': '생산 달성률 개선',
                    'description': alert['message'],
                    'action_items': [
                        '병목 공정 식별 및 개선',
                        '설비 가동 시간 최적화',
                        '작업자 훈련 강화',
                    ],
                })
            elif alert['type'] == 'low_yield':
                recommendations.append({
                    'type': 'quality_improvement',
                    'priority': alert['severity'],
                    'title': '수율 개선',
                    'description': alert['message'],
                    'action_items': [
                        '불량 유형별 원인 분석',
                        '공정 파라미터 최적화',
                        '원자재 품질 관리 강화',
                    ],
                })
            elif alert['type'] == 'low_equipment_availability':
                recommendations.append({
                    'type': 'equipment_maintenance',
                    'priority': alert['severity'],
                    'title': '설비 가동률 개선',
                    'description': alert['message'],
                    'action_items': [
                        '예방 보전 일정 최적화',
                        '설비 고장 원인 분석',
                        '스페어 부품 관리 강화',
                    ],
                })

        # OEE 개선 추천
        oee_data = result.get('efficiency_analysis', {}).get('oee', {})
        if not oee_data.get('oee_world_class', False):
            oee_components = [
                ('가동률', oee_data.get('availability', 0)),
                ('성능률', oee_data.get('performance', 0)),
                ('품질률', oee_data.get('quality', 0)),
            ]

            lowest_component = min(oee_components, key=lambda x: x[1])

            recommendations.append({
                'type': 'oee_improvement',
                'priority': 'medium',
                'title': f'OEE 개선 - {lowest_component[0]} 최적화',
                'description': f"{lowest_component[0]}이 {lowest_component[1]:.1f}%로 가장 낮습니다.",
                'action_items': [
                    f'{lowest_component[0]} 개선 계획 수립',
                    '세부 OEE 분석 수행',
                ],
            })

        return recommendations

    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        신뢰도 계산
        """
        score = 0.0
        max_score = 3.0

        # 생산 성과 데이터
        if result.get('production_performance', {}).get('time_series'):
            score += 1.0

        # 설비 데이터
        if result.get('equipment_utilization', {}).get('equipment_utilization'):
            score += 1.0

        # 효율성 데이터
        if result.get('efficiency_analysis', {}).get('oee'):
            score += 1.0

        return min(score / max_score, 0.95)

    def _create_evidence_refs(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        근거 참조 생성
        """
        evidence_refs = []

        # 생산 성과 참조
        perf_summary = result.get('production_performance', {}).get('summary', {})
        if perf_summary:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='production_performance',
                source='ProductionResult',
                source_id=f"{result.get('metadata', {}).get('plant', 'all')}",
                description=f"생산 달성률 {perf_summary.get('achievement_rate', 0):.1f}%, 수율 {perf_summary.get('yield_rate', 0):.1f}%",
                data=perf_summary,
            ))

        # OEE 참조
        oee_data = result.get('efficiency_analysis', {}).get('oee', {})
        if oee_data:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='oee_analysis',
                source='ProductionResult',
                source_id='oee',
                description=f"OEE {oee_data.get('oee', 0):.1f}%",
                data=oee_data,
            ))

        return evidence_refs
