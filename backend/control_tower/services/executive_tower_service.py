"""
경영진 컨트롤 타워 서비스
C-Level 경영진을 위한 통합 대시보드 데이터 제공
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Max, Min, F
from django.db.models.functions import TruncDate, TruncMonth

logger = logging.getLogger(__name__)


class ExecutiveTowerService:
    """
    경영진 컨트롤 타워 서비스
    C-Level 경영진을 위한 통합 대시보드 데이터 제공
    """

    def __init__(self):
        self.tower_type = "executive"

    def get_executive_overview(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        경영진 개요 조회

        Args:
            params: {
                'time_range': str,  # 'today', 'week', 'month', 'quarter', 'year'
                'domains': List[str],  # 조회할 도메인
            }
        """
        time_range = params.get('time_range', 'month')
        domains = params.get('domains', ['financial', 'production', 'quality', 'sales'])

        # 기간 계산
        start_date, end_date = self._calculate_period(time_range)

        # 각 섹션 데이터 수집
        overview = {
            'period': {
                'type': time_range,
                'start_date': start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date),
                'end_date': end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date),
            },
            'financial_summary': self._get_financial_summary(start_date, end_date),
            'operational_kpis': self._get_operational_kpis(start_date, end_date, domains),
            'risk_overview': self._get_risk_overview(start_date, end_date),
            'strategic_initiatives': self._get_strategic_initiatives(start_date, end_date),
            'key_alerts': self._get_key_alerts(limit=5),
            'recommendations': self._get_executive_recommendations(limit=3),
        }

        return overview

    def _calculate_period(self, time_range: str) -> tuple:
        """기간 계산"""
        end_date = timezone.now()
        today = date.today()

        if time_range == 'today':
            start_date = end_date - timedelta(hours=24)
        elif time_range == 'week':
            start_date = end_date - timedelta(days=7)
        elif time_range == 'month':
            start_date = end_date - timedelta(days=30)
        elif time_range == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif time_range == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)

        return start_date, end_date

    def _get_financial_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """재무 요약 조회"""
        summary = {
            'total_revenue': 0,
            'total_cost': 0,
            'operating_profit': 0,
            'profit_margin': 0,
            'trend': 'stable',
        }

        try:
            from financial.models import FinancialStatement

            statements = FinancialStatement.objects.filter(
                statement_date__gte=start_date.date(),
                statement_date__lte=end_date.date()
            )

            if statements.exists():
                # 집계 계산
                aggregates = statements.aggregate(
                    total_revenue=Sum('sales_revenue'),
                    total_cost=Sum('total_cost'),
                    operating_profit=Sum('operating_profit')
                )

                summary['total_revenue'] = float(aggregates['total_revenue'] or 0)
                summary['total_cost'] = float(aggregates['total_cost'] or 0)
                summary['operating_profit'] = float(aggregates['operating_profit'] or 0)

                # 이익률 계산
                if summary['total_revenue'] > 0:
                    summary['profit_margin'] = round(
                        (summary['operating_profit'] / summary['total_revenue']) * 100, 2
                    )

                # 추세 계산 (전월 대비)
                summary['trend'] = self._calculate_financial_trend(statements)

        except Exception as e:
            logger.warning(f"재무 요약 조회 실패: {e}")

        return summary

    def _calculate_financial_trend(self, statements) -> str:
        """재무 추세 계산"""
        try:
            # 최근 30일과 이전 30일 비교
            recent_cutoff = timezone.now() - timedelta(days=30)
            previous_cutoff = timezone.now() - timedelta(days=60)

            recent_avg = statements.filter(
                statement_date__gte=recent_cutoff.date()
            ).aggregate(
                avg_profit=Avg('operating_profit')
            )['avg_profit'] or 0

            previous_avg = statements.filter(
                statement_date__gte=previous_cutoff.date(),
                statement_date__lt=recent_cutoff.date()
            ).aggregate(
                avg_profit=Avg('operating_profit')
            )['avg_profit'] or 0

            if recent_avg > previous_avg * 1.05:
                return 'increasing'
            elif recent_avg < previous_avg * 0.95:
                return 'decreasing'
            else:
                return 'stable'

        except Exception:
            return 'stable'

    def _get_operational_kpis(
        self,
        start_date: datetime,
        end_date: datetime,
        domains: List[str]
    ) -> Dict[str, Any]:
        """운영 KPI 조회"""
        kpis = {}

        # 생산 KPI
        if 'production' in domains:
            kpis['production'] = self._get_production_kpis(start_date, end_date)

        # 품질 KPI
        if 'quality' in domains:
            kpis['quality'] = self._get_quality_kpis(start_date, end_date)

        # 판매 KPI
        if 'sales' in domains:
            kpis['sales'] = self._get_sales_kpis(start_date, end_date)

        # 원가 KPI
        if 'cost' in domains:
            kpis['cost'] = self._get_cost_kpis(start_date, end_date)

        return kpis

    def _get_production_kpis(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """생산 KPI 조회"""
        kpis = {
            'production_volume': 0,
            'production_rate': 0,
            'capacity_utilization': 0,
            'status': 'normal',
        }

        try:
            from production.models import ProductionResult

            results = ProductionResult.objects.filter(
                production_date__gte=start_date.date(),
                production_date__lte=end_date.date(),
                status='completed'
            )

            if results.exists():
                aggregates = results.aggregate(
                    total_volume=Sum('production_quantity'),
                    avg_rate=Avg('production_rate')
                )

                kpis['production_volume'] = float(aggregates['total_volume'] or 0)
                kpis['production_rate'] = float(aggregates['avg_rate'] or 0)

                # 가동률 (목표 대비)
                target_volume = float(kpis['production_volume']) / 0.85  # 85% 가정
                if target_volume > 0:
                    kpis['capacity_utilization'] = round(
                        (kpis['production_volume'] / target_volume) * 100, 2
                    )

                # 상태 결정
                if kpis['capacity_utilization'] < 70:
                    kpis['status'] = 'low'
                elif kpis['capacity_utilization'] > 95:
                    kpis['status'] = 'high'

        except Exception as e:
            logger.warning(f"생산 KPI 조회 실패: {e}")

        return kpis

    def _get_quality_kpis(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """품질 KPI 조회"""
        kpis = {
            'defect_rate': 0,
            'quality_score': 0,
            'capa_overdue': 0,
            'status': 'good',
        }

        try:
            from quality.models import Defect, CAPA

            # 불량률 계산
            total_production = 0
            total_defects = 0

            defects = Defect.objects.filter(
                detected_date__gte=start_date.date(),
                detected_date__lte=end_date.date()
            )

            total_defects = defects.count()
            # 전체 생산량 (임시값)
            total_production = total_defects * 100 if total_defects > 0 else 1000

            if total_production > 0:
                kpis['defect_rate'] = round((total_defects / total_production) * 100, 2)

            # 품질 점수 (불량률 반전)
            kpis['quality_score'] = round(100 - kpis['defect_rate'], 2)

            # CAPA 기한 초과
            capa_overdue = CAPA.objects.filter(
                due_date__lt=end_date.date(),
                status__in=['open', 'in_progress']
            ).count()

            kpis['capa_overdue'] = capa_overdue

            # 상태 결정
            if kpis['defect_rate'] > 5 or kpis['capa_overdue'] > 3:
                kpis['status'] = 'critical'
            elif kpis['defect_rate'] > 3 or kpis['capa_overdue'] > 1:
                kpis['status'] = 'warning'

        except Exception as e:
            logger.warning(f"품질 KPI 조회 실패: {e}")

        return kpis

    def _get_sales_kpis(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """판매 KPI 조회"""
        kpis = {
            'total_sales': 0,
            'sales_growth': 0,
            'order_backlog': 0,
            'status': 'normal',
        }

        try:
            from sales.models import SalesOrder

            # 총 판매액
            sales_data = SalesOrder.objects.filter(
                order_date__gte=start_date.date(),
                order_date__lte=end_date.date(),
                status__in=['confirmed', 'shipped']
            ).aggregate(
                total_sales=Sum('total_amount')
            )

            kpis['total_sales'] = float(sales_data['total_sales'] or 0)

            # 주문 백로그
            backlog = SalesOrder.objects.filter(
                status='pending'
            ).aggregate(
                total_amount=Sum('total_amount'),
                count=Count('order_id')
            )

            kpis['order_backlog'] = float(backlog['total_amount'] or 0)

            # 성장률 (전월 대비)
            kpis['sales_growth'] = self._calculate_sales_growth(start_date, end_date)

        except Exception as e:
            logger.warning(f"판매 KPI 조회 실패: {e}")

        return kpis

    def _get_cost_kpis(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """원가 KPI 조회"""
        kpis = {
            'total_cost': 0,
            'unit_cost': 0,
            'cost_variance': 0,
            'status': 'normal',
        }

        try:
            from cost.models import CostVariance

            # 원가 차이
            variances = CostVariance.objects.filter(
                variance_date__gte=start_date.date(),
                variance_date__lte=end_date.date()
            )

            if variances.exists():
                aggregates = variances.aggregate(
                    total_cost=Sum('actual_cost'),
                    total_variance=Sum('variance_amount')
                )

                kpis['total_cost'] = float(aggregates['total_cost'] or 0)
                kpis['cost_variance'] = float(aggregates['total_variance'] or 0)

                # 상태 결정
                variance_ratio = abs(kpis['cost_variance']) / kpis['total_cost'] if kpis['total_cost'] > 0 else 0

                if variance_ratio > 0.1:
                    kpis['status'] = 'warning'
                elif variance_ratio > 0.2:
                    kpis['status'] = 'critical'

        except Exception as e:
            logger.warning(f"원가 KPI 조회 실패: {e}")

        return kpis

    def _calculate_sales_growth(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> float:
        """매출 성장률 계산"""
        try:
            from sales.models import SalesOrder

            # 현재 기간
            current_sales = SalesOrder.objects.filter(
                order_date__gte=start_date.date(),
                order_date__lte=end_date.date(),
                status__in=['confirmed', 'shipped']
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            # 이전 기간 (동일 기간)
            prev_start = start_date - timedelta(days=(end_date - start_date).days)
            prev_end = start_date

            previous_sales = SalesOrder.objects.filter(
                order_date__gte=prev_start.date(),
                order_date__lt=prev_end.date(),
                status__in=['confirmed', 'shipped']
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            if previous_sales > 0:
                return round(((current_sales - previous_sales) / previous_sales) * 100, 2)

        except Exception as e:
            logger.warning(f"매출 성장률 계산 실패: {e}")

        return 0

    def _get_risk_overview(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """위험 요약 조회"""
        overview = {
            'total_risks': 0,
            'critical_risks': 0,
            'high_risks': 0,
            'by_category': {},
            'trend': 'stable',
        }

        try:
            from events.models import Event

            # 위험 이벤트 집계
            risk_events = Event.objects.filter(
                detected_at__gte=start_date,
                detected_at__lte=end_date,
                severity__in=['HIGH', 'CRITICAL']
            )

            overview['total_risks'] = risk_events.count()
            overview['critical_risks'] = risk_events.filter(severity='CRITICAL').count()
            overview['high_risks'] = risk_events.filter(severity='HIGH').count()

            # 카테고리별 집계
            categories = risk_events.values('event_type').annotate(
                count=Count('event_id')
            ).order_by('-count')

            overview['by_category'] = {
                cat['event_type']: cat['count']
                for cat in categories[:5]
            }

        except Exception as e:
            logger.warning(f"위험 요약 조회 실패: {e}")

        return overview

    def _get_strategic_initiatives(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """전략적 이니셔티브 조회"""
        initiatives = []

        try:
            from ai.models import Recommendation

            # 높은 우선순위 추천사항
            recommendations = Recommendation.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                priority__in=['urgent', 'high'],
                approved__isnull=True
            ).order_by('-created_at')[:5]

            for rec in recommendations:
                initiatives.append({
                    'id': str(rec.recommendation_id),
                    'title': rec.title,
                    'description': rec.description,
                    'domain': rec.domain,
                    'priority': rec.priority,
                    'impact_area': rec.impact_area,
                    'status': 'pending' if not rec.approved else 'approved',
                })

        except Exception as e:
            logger.warning(f"전략적 이니셔티브 조회 실패: {e}")

        return initiatives

    def _get_key_alerts(self, limit: int = 5) -> List[Dict[str, Any]]:
        """주요 알림 조회"""
        alerts = []

        try:
            from events.models import Event

            critical_events = Event.objects.filter(
                status__in=['open', 'acknowledged'],
                severity__in=['HIGH', 'CRITICAL']
            ).order_by('-detected_at')[:limit]

            for event in critical_events:
                alerts.append({
                    'id': str(event.event_id),
                    'type': event.event_type,
                    'severity': event.severity,
                    'title': event.title,
                    'description': event.description,
                    'detected_at': event.detected_at.isoformat() if event.detected_at else None,
                    'domain': event.metadata.get('domain', 'general'),
                })

        except Exception as e:
            logger.warning(f"주요 알림 조회 실패: {e}")

        return alerts

    def _get_executive_recommendations(self, limit: int = 3) -> List[Dict[str, Any]]:
        """경영진 추천사항 조회"""
        recommendations = []

        try:
            from ai.models import Recommendation

            # 최근 높은 우선순위 추천사항
            recs = Recommendation.objects.filter(
                priority__in=['urgent', 'high'],
                approved__isnull=True
            ).order_by('-created_at')[:limit]

            for rec in recs:
                recommendations.append({
                    'id': str(rec.recommendation_id),
                    'title': rec.title,
                    'description': rec.description,
                    'domain': rec.domain,
                    'priority': rec.priority,
                    'impact_area': rec.impact_area,
                    'action_item_count': len(rec.action_items) if rec.action_items else 0,
                })

        except Exception as e:
            logger.warning(f"경영진 추천사항 조회 실패: {e}")

        return recommendations


# 헬퍼 함수
def get_executive_dashboard(time_range: str = 'month') -> Dict[str, Any]:
    """경영진 대시보드 조회 헬퍼 함수"""
    service = ExecutiveTowerService()
    return service.get_executive_overview({
        'time_range': time_range,
        'domains': ['financial', 'production', 'quality', 'sales'],
    })
