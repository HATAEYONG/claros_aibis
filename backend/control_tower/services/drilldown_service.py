# -*- coding: utf-8 -*-
"""
Drill-Down Service
Phase 2: 대시보드 드릴다운 및 상세 분석 서비스
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Max, Min, F, Q
from django.db.models.functions import TruncDate, TruncHour, TruncMonth

logger = logging.getLogger(__name__)


class DrillDownService:
    """
    드릴다운 서비스
    대시보드에서 상세 분석으로 이동하는 기능 제공
    """

    def __init__(self):
        self.tower_type = "drilldown"

    def drill_down_kpi(
        self,
        domain: str,
        kpi_id: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        KPI 드릴다운

        Args:
            domain: 도메인
            kpi_id: KPI ID
            filters: 필터 조건

        Returns:
            드릴다운 데이터
        """
        filters = filters or {}

        drilldown = {
            'domain': domain,
            'kpi_id': kpi_id,
            'filters': filters,
            'summary': self._get_kpi_summary(domain, kpi_id, filters),
            'breakdown': self._get_kpi_breakdown(domain, kpi_id, filters),
            'trends': self._get_kpi_trends(domain, kpi_id, filters),
            'top_contributors': self._get_top_contributors(domain, kpi_id, filters),
        }

        return drilldown

    def _get_kpi_summary(
        self,
        domain: str,
        kpi_id: str,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """KPI 요약"""
        summary = {
            'current_value': 0,
            'target_value': 0,
            'variance': 0,
            'variance_percent': 0,
            'status': 'normal',
        }

        try:
            if domain == 'production' and kpi_id == 'defect_rate':
                # 불량률 드릴다운
                from quality.models import Defect

                defects = Defect.objects.filter(**filters)

                total_defects = defects.count()
                total_production = max(total_defects * 50, 1000)

                defect_rate = (total_defects / total_production * 100) if total_production > 0 else 0
                summary['current_value'] = round(defect_rate, 2)
                summary['target_value'] = 2.0  # 목표 2%

                variance = defect_rate - 2.0
                summary['variance'] = round(variance, 2)
                summary['variance_percent'] = round((variance / 2.0 * 100) if 2.0 > 0 else 0, 2)

                if defect_rate > 5:
                    summary['status'] = 'critical'
                elif defect_rate > 2:
                    summary['status'] = 'warning'

            elif domain == 'financial' and kpi_id == 'revenue':
                # 매출 드릴다운
                from financial.models import FinancialStatement

                statements = FinancialStatement.objects.filter(**filters)

                total_revenue = statements.aggregate(
                    total=Sum('sales_revenue')
                )['total'] or 0

                summary['current_value'] = float(total_revenue)
                summary['target_value'] = 10000000000  # 100억 목표
                summary['variance'] = total_revenue - 10000000000
                summary['variance_percent'] = round((summary['variance'] / 10000000000 * 100), 2)

        except Exception as e:
            logger.warning(f"KPI 요약 조회 실패: {e}")

        return summary

    def _get_kpi_breakdown(
        self,
        domain: str,
        kpi_id: str,
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """KPI 분류별 분석"""
        breakdown = []

        try:
            if domain == 'production' and kpi_id == 'defect_rate':
                # 불량유형별 분류
                from quality.models import Defect

                defects = Defect.objects.filter(**filters)

                defect_types = defects.values('defect_type').annotate(
                    count=Count('defect_id'),
                    avg_severity=Avg('severity')
                ).order_by('-count')

                for dt in defect_types:
                    breakdown.append({
                        'category': dt['defect_type'] or '미분류',
                        'value': dt['count'],
                        'avg_severity': round(dt['avg_severity'] or 0, 2),
                        'percentage': 0,  # 전체에서의 비율
                    })

            elif domain == 'financial' and kpi_id == 'revenue':
                # 제품별 매출 분류
                from financial.models import FinancialStatement

                # 실제 구현시 제품별 집계 추가
                breakdown = [
                    {'category': '제품A', 'value': 5000000000, 'percentage': 50},
                    {'category': '제품B', 'value': 3000000000, 'percentage': 30},
                    {'category': '제품C', 'value': 2000000000, 'percentage': 20},
                ]

        except Exception as e:
            logger.warning(f"KPI 분류 조회 실패: {e}")

        return breakdown

    def _get_kpi_trends(
        self,
        domain: str,
        kpi_id: str,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """KPI 추세 분석"""
        trends = {
            'daily': [],
            'weekly': [],
            'monthly': [],
        }

        try:
            end_date = timezone.now()

            # 일별 추세 (최근 7일)
            for i in range(7):
                date = end_date - timedelta(days=i)
                day_start = date.replace(hour=0, minute=0, second=0)
                day_end = date.replace(hour=23, minute=59, second=59)

                day_filters = filters.copy()
                day_filters['detected_date__gte'] = day_start
                day_filters['detected_date__lte'] = day_end

                value = 0

                if domain == 'production' and kpi_id == 'defect_rate':
                    from quality.models import Defect
                    count = Defect.objects.filter(**day_filters).count()
                    value = round(count * 2, 2)  # 임시 계산

                trends['daily'].append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': value,
                })

            trends['daily'].reverse()

        except Exception as e:
            logger.warning(f"KPI 추세 조회 실패: {e}")

        return trends

    def _get_top_contributors(
        self,
        domain: str,
        kpi_id: str,
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """상위 기여요소"""
        contributors = []

        try:
            if domain == 'production' and kpi_id == 'defect_rate':
                # 상위 불량 원인
                from quality.models import Defect

                top_defects = Defect.objects.filter(**filters).values(
                    'defect_cause'
                ).annotate(
                    count=Count('defect_id')
                ).order_by('-count')[:5]

                for defect in top_defects:
                    contributors.append({
                        'factor': defect['defect_cause'] or '미분류',
                        'impact': defect['count'],
                        'impact_type': 'defect_count',
                    })

        except Exception as e:
            logger.warning(f"상위 기여요소 조회 실패: {e}")

        return contributors

    def drill_down_event(
        self,
        event_id: str,
        include_related: bool = True
    ) -> Dict[str, Any]:
        """
        이벤트 드릴다운

        Args:
            event_id: 이벤트 ID
            include_related: 관련 이벤트 포함 여부

        Returns:
            이벤트 상세 정보
        """
        try:
            from events.models import Event

            event = Event.objects.get(event_id=event_id)

            drilldown = {
                'event': {
                    'id': str(event.event_id),
                    'type': event.event_type,
                    'severity': event.severity,
                    'title': event.title,
                    'description': event.description,
                    'status': event.status,
                    'detected_at': event.detected_at.isoformat() if event.detected_at else None,
                    'metadata': event.metadata,
                },
                'root_cause_analysis': self._analyze_root_cause(event),
                'impact_analysis': self._analyze_impact(event),
                'related_events': [],
                'recommendations': [],
            }

            if include_related:
                # 관련 이벤트 조회
                related = Event.objects.filter(
                    event_type=event.event_type,
                    detected_at__gte=event.detected_at - timedelta(hours=24),
                    detected_at__lte=event.detected_at + timedelta(hours=24)
                ).exclude(event_id=event.event_id)[:5]

                for rel in related:
                    drilldown['related_events'].append({
                        'id': str(rel.event_id),
                        'type': rel.event_type,
                        'severity': rel.severity,
                        'title': rel.title,
                        'detected_at': rel.detected_at.isoformat() if rel.detected_at else None,
                    })

            # 추천사항 조회
            from ai.models import Recommendation

            recommendations = Recommendation.objects.filter(
                related_events__contains=str(event_id)
            )[:5]

            for rec in recommendations:
                drilldown['recommendations'].append({
                    'id': str(rec.recommendation_id),
                    'title': rec.title,
                    'priority': rec.priority,
                    'status': rec.status,
                })

            return drilldown

        except Event.DoesNotExist:
            return {
                'error': f'Event not found: {event_id}',
            }

    def _analyze_root_cause(self, event) -> Dict[str, Any]:
        """원인 분석"""
        analysis = {
            'primary_cause': event.metadata.get('primary_cause', '미분류'),
            'contributing_factors': event.metadata.get('contributing_factors', []),
            'confidence': event.metadata.get('confidence', 0),
        }

        return analysis

    def _analyze_impact(self, event) -> Dict[str, Any]:
        """영향 분석"""
        analysis = {
            'affected_domains': event.metadata.get('affected_domains', []),
            'estimated_loss': event.metadata.get('estimated_loss', 0),
            'affected_units': event.metadata.get('affected_units', []),
        }

        return analysis

    def get_available_drilldowns(
        self,
        domain: str
    ) -> List[Dict[str, Any]]:
        """
        가능한 드릴다운 목록 조회

        Args:
            domain: 도메인

        Returns:
            드릴다운 목록
        """
        drilldowns = {
            'financial': [
                {'kpi_id': 'revenue', 'name': '매출', 'drilldown_type': 'kpi'},
                {'kpi_id': 'operating_profit_margin', 'name': '영업이익률', 'drilldown_type': 'kpi'},
                {'kpi_id': 'cost_variance', 'name': '원가차이', 'drilldown_type': 'kpi'},
            ],
            'production': [
                {'kpi_id': 'production_rate', 'name': '생산율', 'drilldown_type': 'kpi'},
                {'kpi_id': 'defect_rate', 'name': '불량률', 'drilldown_type': 'kpi'},
                {'kpi_id': 'capacity_utilization', 'name': '가동률', 'drilldown_type': 'kpi'},
            ],
            'quality': [
                {'kpi_id': 'first_pass_yield', 'name': '초주도율', 'drilldown_type': 'kpi'},
                {'kpi_id': 'customer_complaint_rate', 'name': '고객불만률', 'drilldown_type': 'kpi'},
                {'kpi_id': 'capa_closure_rate', 'name': 'CAPA 조치율', 'drilldown_type': 'kpi'},
            ],
        }

        return drilldowns.get(domain, [])
