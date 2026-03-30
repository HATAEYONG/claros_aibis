# -*- coding: utf-8 -*-
"""
QualityIntelligenceAgent — 품질 지능형 에이전트
불량 분석, CAPA 추적, 품질 추세 모니터링
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
from django.db.models import Avg, Sum, Count, Q, F, Max, Min
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from ai.agents.base.agent import BaseAgent, AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class QualityIntelligenceAgent(BaseAgent):
    """
    품질 지능형 에이전트

    기능:
    - 불량률 분석
    - 불량 유형별 분류
    - CAPA 추적 및 관리
    - 품질 추세 분석
    - 품질 리스크 탐지
    """

    name = "QualityIntelligenceAgent"
    description = "품질 분석 및 불량/CAPA 관리 에이전트"
    version = "1.0.0"
    domain = "quality"
    layer = "intelligence"
    requires_human_approval = False

    # 품질 기준값
    QUALITY_TARGETS = {
        'defect_rate': 2.0,      # 불량률 목표 (%)
        'customer_return_rate': 0.5,  # 고객 반품률 목표 (%)
        'on_time_closure_rate': 90.0,  # CAPA 적시 완료률 목표 (%)
    }

    def validate_input(self, agent_input: AgentInput) -> bool:
        """입력 유효성 검증"""
        return True

    def execute(self, agent_input: AgentInput) -> AgentOutput:
        """품질 지능 분석 실행"""

        try:
            # 파라미터 추출
            plant = agent_input.parameters.get('plant')
            line = agent_input.parameters.get('line')
            product_id = agent_input.parameters.get('product_id')
            customer_id = agent_input.parameters.get('customer_id')
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
                'defect_analysis': {},
                'capa_tracking': {},
                'quality_trends': {},
                'quality_alerts': [],
            }

            if analysis_type in ['all', 'defect']:
                result['defect_analysis'] = self._analyze_defects(
                    plant=plant,
                    line=line,
                    product_id=product_id,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'capa']:
                result['capa_tracking'] = self._track_capa(
                    plant=plant,
                    period_from=period_from,
                    period_to=period_to
                )

            if analysis_type in ['all', 'trends']:
                result['quality_trends'] = self._analyze_quality_trends(
                    plant=plant,
                    line=line,
                    product_id=product_id,
                    period_from=period_from,
                    period_to=period_to
                )

            # 품질 알림 생성
            result['quality_alerts'] = self._generate_quality_alerts(result)

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
                    'customer_id': customer_id,
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

    def _analyze_defects(
        self,
        plant: str = None,
        line: str = None,
        product_id: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        불량 분석
        """
        try:
            from quality.models import DefectRecord, Inspection

            # 불량 기록 조회
            queryset = DefectRecord.objects.filter(
                defect_date__gte=period_from,
                defect_date__lte=period_to
            )

            if plant:
                queryset = queryset.filter(plant=plant)
            if line:
                queryset = queryset.filter(line=line)
            if product_id:
                queryset = queryset.filter(product_id=product_id)

            # 전체 불량률
            total_inspections = Inspection.objects.filter(
                inspection_date__gte=period_from,
                inspection_date__lte=period_to
            )

            if plant:
                total_inspections = total_inspections.filter(plant=plant)
            if line:
                total_inspections = total_inspections.filter(line=line)
            if product_id:
                total_inspections = total_inspections.filter(product_id=product_id)

            inspection_agg = total_inspections.aggregate(
                total_inspected=Sum('inspected_quantity'),
                total_defective=Sum('defective_quantity')
            )

            total_inspected = inspection_agg['total_inspected'] or 0
            total_defective = inspection_agg['total_defective'] or 0
            defect_rate = (total_defective / total_inspected * 100) if total_inspected > 0 else 0

            # 불량 유형별 분류
            defect_by_type = queryset.values('defect_type', 'defect_description').annotate(
                count=Count('defect_id'),
                total_qty=Sum('defect_quantity')
            ).order_by('-count')

            # 공정별 불량률
            defect_by_process = queryset.values('process_code', 'process_name').annotate(
                defect_count=Count('defect_id'),
                defect_qty=Sum('defect_quantity')
            ).order_by('-defect_qty')

            # 제품별 불량률
            defect_by_product = queryset.values('product_id', 'product_name').annotate(
                defect_count=Count('defect_id'),
                defect_qty=Sum('defect_quantity'),
                defect_rate=Avg(F('defect_quantity') / F('production_quantity') * 100)
            ).order_by('-defect_rate')

            return {
                'summary': {
                    'total_inspected': float(total_inspected),
                    'total_defective': float(total_defective),
                    'defect_rate': float(defect_rate),
                    'target_defect_rate': self.QUALITY_TARGETS['defect_rate'],
                    'exceeds_target': defect_rate > self.QUALITY_TARGETS['defect_rate'],
                },
                'defect_by_type': [
                    {
                        'defect_type': item['defect_type'],
                        'defect_description': item['defect_description'],
                        'count': item['count'],
                        'total_qty': float(item['total_qty'] or 0),
                    }
                    for item in defect_by_type[:10]
                ],
                'defect_by_process': [
                    {
                        'process_code': item['process_code'],
                        'process_name': item['process_name'],
                        'defect_count': item['defect_count'],
                        'defect_qty': float(item['defect_qty'] or 0),
                    }
                    for item in defect_by_process[:10]
                ],
                'defect_by_product': [
                    {
                        'product_id': item['product_id'],
                        'product_name': item['product_name'],
                        'defect_count': item['defect_count'],
                        'defect_qty': float(item['defect_qty'] or 0),
                        'defect_rate': float(item['defect_rate'] or 0),
                    }
                    for item in defect_by_product[:10]
                ],
            }

        except Exception as e:
            logger.error(f"불량 분석 오류: {e}")
            return {
                'summary': {},
                'defect_by_type': [],
                'defect_by_process': [],
                'defect_by_product': [],
            }

    def _track_capa(
        self,
        plant: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        CAPA (Corrective and Preventive Action) 추적
        """
        try:
            from quality.models import CAPA, DefectRecord

            # CAPA 조회
            queryset = CAPA.objects.all()

            # 기간 필터 (생성일 기준)
            if period_from:
                queryset = queryset.filter(created_at__gte=period_from)
            if period_to:
                queryset = queryset.filter(created_at__lte=period_to)

            if plant:
                queryset = queryset.filter(plant=plant)

            # 상태별 집계
            capa_by_status = queryset.values('status').annotate(
                count=Count('capa_id')
            ).order_by('-count')

            # CAPA 유형별 분류
            capa_by_type = queryset.values('capa_type').annotate(
                count=Count('capa_id'),
                avg_closure_days=Avg(
                    ExpressionWrapper(
                        F('closed_at') - F('created_at'),
                        output_field=FloatField()
                    )
                )
            ).order_by('-count')

            # 지연된 CAPA
            overdue_capas = queryset.filter(
                due_date__lt=datetime.now(),
                status__in=['open', 'in_progress']
            ).values('capa_id', 'capa_number', 'title', 'due_date', 'days_overdue')

            # 적시 완료된 CAPA
            on_time_closed = queryset.filter(
                status='closed'
            ).annotate(
                days_to_close=ExpressionWrapper(
                    F('closed_at') - F('created_at'),
                    output_field=FloatField()
                )
            ).aggregate(
                total_closed=Count('capa_id'),
                avg_days=Avg('days_to_close')
            )

            # 전체 CAPA 수
            total_capas = queryset.count()
            overdue_count = len(overdue_capas)

            # 적시 완료율
            on_time_closure_rate = (
                (on_time_closed['total_closed'] or 0) / total_capas * 100
                if total_capas > 0 else 0
            )

            return {
                'summary': {
                    'total_capas': total_capas,
                    'overdue_count': overdue_count,
                    'overdue_rate': float((overdue_count / total_capas * 100) if total_capas > 0 else 0),
                    'on_time_closure_rate': float(on_time_closure_rate),
                    'target_closure_rate': self.QUALITY_TARGETS['on_time_closure_rate'],
                    'avg_closure_days': float(on_time_closed['avg_days'] or 0),
                },
                'capa_by_status': [
                    {
                        'status': item['status'],
                        'count': item['count'],
                    }
                    for item in capa_by_status
                ],
                'capa_by_type': [
                    {
                        'capa_type': item['capa_type'],
                        'count': item['count'],
                        'avg_closure_days': float(item['avg_closure_days'] or 0),
                    }
                    for item in capa_by_type
                ],
                'overdue_capas': [
                    {
                        'capa_id': str(capa['capa_id']),
                        'capa_number': capa['capa_number'],
                        'title': capa['title'],
                        'due_date': capa['due_date'].strftime('%Y-%m-%d') if capa['due_date'] else None,
                    }
                    for capa in overdue_capas[:10]
                ],
            }

        except Exception as e:
            logger.error(f"CAPA 추적 오류: {e}")
            return {
                'summary': {},
                'capa_by_status': [],
                'capa_by_type': [],
                'overdue_capas': [],
            }

    def _analyze_quality_trends(
        self,
        plant: str = None,
        line: str = None,
        product_id: str = None,
        period_from: str = None,
        period_to: str = None
    ) -> Dict[str, Any]:
        """
        품질 추세 분석
        """
        try:
            from quality.models import Inspection, CustomerComplaint

            # 주별 불량률 추세
            inspection_qs = Inspection.objects.filter(
                inspection_date__gte=period_from,
                inspection_date__lte=period_to
            )

            if plant:
                inspection_qs = inspection_qs.filter(plant=plant)
            if line:
                inspection_qs = inspection_qs.filter(line=line)
            if product_id:
                inspection_qs = inspection_qs.filter(product_id=product_id)

            weekly_defect_rate = inspection_qs.annotate(
                week=TruncWeek('inspection_date')
            ).values('week').annotate(
                inspected=Sum('inspected_quantity'),
                defective=Sum('defective_quantity')
            ).order_by('week')

            weekly_trends = []
            for item in weekly_defect_rate:
                inspected = item['inspected'] or 0
                defective = item['defective'] or 0
                defect_rate = (defective / inspected * 100) if inspected > 0 else 0

                weekly_trends.append({
                    'week': item['week'].strftime('%Y-%m-%d') if item['week'] else None,
                    'inspected': float(inspected),
                    'defective': float(defective),
                    'defect_rate': float(defect_rate),
                })

            # 고객 클레임 추세
            complaint_qs = CustomerComplaint.objects.filter(
                complaint_date__gte=period_from,
                complaint_date__lte=period_to
            )

            if plant:
                complaint_qs = complaint_qs.filter(plant=plant)
            if product_id:
                complaint_qs = complaint_qs.filter(product_id=product_id)

            monthly_complaints = complaint_qs.annotate(
                month=TruncMonth('complaint_date')
            ).values('month').annotate(
                count=Count('complaint_id'),
                total_amount=Sum('claim_amount')
            ).order_by('month')

            complaint_trends = [
                {
                    'month': item['month'].strftime('%Y-%m') if item['month'] else None,
                    'complaint_count': item['count'],
                    'total_amount': float(item['total_amount'] or 0),
                }
                for item in monthly_complaints
            ]

            return {
                'defect_rate_trend': weekly_trends,
                'complaint_trend': complaint_trends,
                'trend_analysis': self._analyze_trend_direction(weekly_trends),
            }

        except Exception as e:
            logger.error(f"품질 추세 분석 오류: {e}")
            return {
                'defect_rate_trend': [],
                'complaint_trend': [],
                'trend_analysis': {},
            }

    def _analyze_trend_direction(self, trend_data: List[Dict]) -> Dict[str, Any]:
        """
        추세 방향 분석
        """
        if len(trend_data) < 2:
            return {'direction': 'unknown', 'change_rate': 0}

        # 최근 4주 평균 vs 이전 4주 평균
        recent_avg = np.mean([t['defect_rate'] for t in trend_data[-4:]]) if len(trend_data) >= 4 else trend_data[-1]['defect_rate']
        previous_avg = np.mean([t['defect_rate'] for t in trend_data[-8:-4]]) if len(trend_data) >= 8 else trend_data[0]['defect_rate']

        change_rate = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0

        if change_rate > 5:
            direction = 'worsening'
        elif change_rate < -5:
            direction = 'improving'
        else:
            direction = 'stable'

        return {
            'direction': direction,
            'change_rate': float(change_rate),
            'recent_avg': float(recent_avg),
            'previous_avg': float(previous_avg),
        }

    def _generate_quality_alerts(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        품질 알림 생성
        """
        alerts = []

        # 불량률 알림
        defect_summary = result.get('defect_analysis', {}).get('summary', {})
        defect_rate = defect_summary.get('defect_rate', 0)
        target_rate = self.QUALITY_TARGETS['defect_rate']

        if defect_rate > target_rate:
            alerts.append({
                'type': 'high_defect_rate',
                'severity': 'high' if defect_rate > target_rate * 2 else 'medium',
                'message': f"불량률 {defect_rate:.2f}% (목표: {target_rate}%)",
                'recommendation': '주요 불량 유형 원인 분석 및 공정 개선 필요',
            })

        # CAPA 지연 알림
        capa_summary = result.get('capa_tracking', {}).get('summary', {})
        overdue_count = capa_summary.get('overdue_count', 0)

        if overdue_count > 0:
            alerts.append({
                'type': 'overdue_capa',
                'severity': 'high' if overdue_count > 5 else 'medium',
                'message': f"{overdue_count}개 CAPA 기한 초과",
                'recommendation': '지연된 CAPA 우선 처리 및 일정 재조정 필요',
            })

        # 품질 추세 악화 알림
        trend_analysis = result.get('quality_trends', {}).get('trend_analysis', {})
        if trend_analysis.get('direction') == 'worsening':
            alerts.append({
                'type': 'quality_trend_worsening',
                'severity': 'medium',
                'message': f"불량률 {trend_analysis['change_rate']:.1f}% 상승 추세",
                'recommendation': '추세 악화 원인 규명 및 대책 수립 필요',
            })

        return alerts

    def _generate_recommendations(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        품질 개선 추천
        """
        recommendations = []

        # 불량률 개선
        defect_summary = result.get('defect_analysis', {}).get('summary', {})
        if defect_summary.get('exceeds_target', False):
            # 주요 불량 유형 추출
            top_defect_types = result.get('defect_analysis', {}).get('defect_by_type', [])[:3]

            for defect_type in top_defect_types:
                recommendations.append({
                    'type': 'defect_reduction',
                    'priority': 'high',
                    'title': f"{defect_type['defect_type']} 불량 감소",
                    'description': f"{defect_type['count']}건 발생, {defect_type['total_qty']}개 불량",
                    'action_items': [
                        f'{defect_type["defect_type"]} 원인 분석 (4M1E)',
                        '공정 파라미터 최적화',
                        '작업자 훈련',
                    ],
                    'defect_type': defect_type['defect_type'],
                })

        # CAPA 관리 개선
        overdue_capas = result.get('capa_tracking', {}).get('overdue_capas', [])
        if overdue_capas:
            recommendations.append({
                'type': 'capa_management',
                'priority': 'high',
                'title': 'CAPA 지연 해결',
                'description': f"{len(overdue_capas)}개 CAPA 기한 초과",
                'action_items': [
                    '지연 CAPA 우선 순위 재평가',
                    '책임자 할당 및 기한 설정',
                    '주간 진행 상황 모니터링',
                ],
            })

        # 품질 추세 개선
        trend_analysis = result.get('quality_trends', {}).get('trend_analysis', {})
        if trend_analysis.get('direction') == 'worsening':
            recommendations.append({
                'type': 'trend_improvement',
                'priority': 'medium',
                'title': '품질 추세 개선',
                'description': f"불량률 {trend_analysis['change_rate']:.1f}% 상승 추세",
                'action_items': [
                    '최근 변경 사항 검토',
                    '공정 안정성 강화',
                    '품질 모니터링 주기 단축',
                ],
            })

        # 고위험 공정 식별
        defect_by_process = result.get('defect_analysis', {}).get('defect_by_process', [])
        if defect_by_process:
            top_process = defect_by_process[0]
            if top_process['defect_qty'] > 0:
                recommendations.append({
                    'type': 'process_improvement',
                    'priority': 'medium',
                    'title': f"{top_process['process_name']} 공정 개선",
                    'description': f"불량 {top_process['defect_qty']}개 발생",
                    'action_items': [
                        f'{top_process["process_name"]} 공정 능력 분석',
                        '공정 파라미터 최적화',
                        '설비 정밀도 점검',
                    ],
                    'process_code': top_process['process_code'],
                })

        return recommendations

    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        신뢰도 계산
        """
        score = 0.0
        max_score = 3.0

        # 불량 분석 데이터
        if result.get('defect_analysis', {}).get('summary'):
            score += 1.0

        # CAPA 데이터
        if result.get('capa_tracking', {}).get('summary'):
            score += 1.0

        # 추세 데이터
        if result.get('quality_trends', {}).get('defect_rate_trend'):
            score += 1.0

        return min(score / max_score, 0.95)

    def _create_evidence_refs(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        근거 참조 생성
        """
        evidence_refs = []

        # 불량률 참조
        defect_summary = result.get('defect_analysis', {}).get('summary', {})
        if defect_summary:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='defect_rate',
                source='Inspection',
                source_id=f"{result.get('metadata', {}).get('plant', 'all')}",
                description=f"불량률 {defect_summary.get('defect_rate', 0):.2f}%",
                data=defect_summary,
            ))

        # CAPA 참조
        capa_summary = result.get('capa_tracking', {}).get('summary', {})
        if capa_summary:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='capa_summary',
                source='CAPA',
                source_id='capa',
                description=f"CAPA {capa_summary.get('total_capas', 0)}건, 지연 {capa_summary.get('overdue_count', 0)}건",
                data=capa_summary,
            ))

        # 추세 참조
        trend_analysis = result.get('quality_trends', {}).get('trend_analysis', {})
        if trend_analysis:
            evidence_refs.append(self.create_evidence_ref(
                evidence_type='quality_trend',
                source='Inspection',
                source_id='trend',
                description=f"{trend_analysis.get('direction', 'unknown')} ({trend_analysis.get('change_rate', 0):.1f}%)",
                data=trend_analysis,
            ))

        return evidence_refs
