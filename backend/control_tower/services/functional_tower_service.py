"""
기능별 컨트롤 타워 서비스
도메인별(원가, 재무, 구매, 생산, 품질) 기능별 대시보드 데이터 제공
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Max, Min, F, Q
from django.db.models.functions import TruncDate, TruncMonth

logger = logging.getLogger(__name__)


class FunctionalTowerService:
    """
    기능별 컨트롤 타워 서비스
    도메인별 기능별 대시보드 데이터 제공
    """

    def __init__(self):
        self.tower_type = "functional"

        # 도메인별 서비스 매핑
        self.domain_services = {
            'cost': self._get_cost_tower_data,
            'financial': self._get_financial_tower_data,
            'purchase': self._get_purchase_tower_data,
            'production': self._get_production_tower_data,
            'quality': self._get_quality_tower_data,
        }

    def get_functional_tower(
        self,
        domain: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        기능별 타워 데이터 조회

        Args:
            domain: 도메인 (cost, financial, purchase, production, quality)
            params: {
                'time_range': str,  # 'today', 'week', 'month', 'quarter'
                'filters': Dict,  # 추가 필터
            }
        """
        if domain not in self.domain_services:
            return {
                'error': f'지원하지 않는 도메인: {domain}',
                'domain': domain,
            }

        time_range = params.get('time_range', 'month')
        filters = params.get('filters', {})

        # 기간 계산
        start_date, end_date = self._calculate_period(time_range)

        # 도메인별 데이터 조회
        tower_data = self.domain_services[domain](
            start_date=start_date,
            end_date=end_date,
            filters=filters
        )

        return {
            'domain': domain,
            'tower_type': 'functional',
            'period': {
                'type': time_range,
                'start_date': start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date),
                'end_date': end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date),
            },
            **tower_data
        }

    def _calculate_period(self, time_range: str) -> tuple:
        """기간 계산"""
        end_date = timezone.now()

        if time_range == 'today':
            start_date = end_date - timedelta(hours=24)
        elif time_range == 'week':
            start_date = end_date - timedelta(days=7)
        elif time_range == 'month':
            start_date = end_date - timedelta(days=30)
        elif time_range == 'quarter':
            start_date = end_date - timedelta(days=90)
        else:
            start_date = end_date - timedelta(days=30)

        return start_date, end_date

    def _get_cost_tower_data(
        self,
        start_date: datetime,
        end_date: datetime,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """원가 타워 데이터 조회"""
        data = {
            'summary': {},
            'kpis': {},
            'variances': [],
            'trends': {},
            'alerts': [],
            'recommendations': [],
        }

        try:
            from cost.models import CostVariance, ProductCost

            # 요약
            variances = CostVariance.objects.filter(
                variance_date__gte=start_date.date(),
                variance_date__lte=end_date.date()
            )

            if filters.get('category'):
                variances = variances.filter(category=filters['category'])

            aggregates = variances.aggregate(
                total_actual=Sum('actual_cost'),
                total_standard=Sum('standard_cost'),
                total_variance=Sum('variance_amount'),
                count=Count('variance_id')
            )

            data['summary'] = {
                'total_actual_cost': float(aggregates['total_actual'] or 0),
                'total_standard_cost': float(aggregates['total_standard'] or 0),
                'total_variance': float(aggregates['total_variance'] or 0),
                'variance_count': aggregates['count'],
            }

            # KPI
            if data['summary']['total_actual_cost'] > 0:
                variance_ratio = abs(data['summary']['total_variance']) / data['summary']['total_actual_cost']
                data['kpis'] = {
                    'variance_ratio': round(variance_ratio * 100, 2),
                    'status': 'normal' if variance_ratio < 0.05 else 'warning' if variance_ratio < 0.1 else 'critical',
                }

            # 상세 차이
            detailed_variances = variances.order_by('-variance_amount')[:10]
            for variance in detailed_variances:
                data['variances'].append({
                    'category': variance.category,
                    'product_code': variance.product_code,
                    'actual_cost': float(variance.actual_cost),
                    'standard_cost': float(variance.standard_cost),
                    'variance_amount': float(variance.variance_amount),
                    'variance_ratio': round(
                        (variance.variance_amount / variance.actual_cost) * 100, 2
                    ) if variance.actual_cost > 0 else 0,
                })

            # 추천사항
            if data['kpis'].get('variance_ratio', 0) > 5:
                data['recommendations'].append({
                    'type': 'cost_reduction',
                    'title': '원가 절감 기회',
                    'description': f'원가 차이율 {data["kpis"]["variance_ratio"]}% 개선 필요',
                    'priority': 'high' if data['kpis']['variance_ratio'] > 10 else 'medium',
                })

        except Exception as e:
            logger.warning(f"원가 타워 데이터 조회 실패: {e}")
            data['error'] = str(e)

        return data

    def _get_financial_tower_data(
        self,
        start_date: datetime,
        end_date: datetime,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """재무 타워 데이터 조회"""
        data = {
            'summary': {},
            'kpis': {},
            'budget_status': {},
            'cashflow': {},
            'alerts': [],
            'recommendations': [],
        }

        try:
            from financial.models import FinancialStatement, Budget

            # 요약
            statements = FinancialStatement.objects.filter(
                statement_date__gte=start_date.date(),
                statement_date__lte=end_date.date()
            )

            aggregates = statements.aggregate(
                total_revenue=Sum('sales_revenue'),
                total_cost=Sum('total_cost'),
                operating_profit=Sum('operating_profit'),
                net_profit=Sum('net_profit')
            )

            total_revenue = float(aggregates['total_revenue'] or 0)

            data['summary'] = {
                'total_revenue': total_revenue,
                'total_cost': float(aggregates['total_cost'] or 0),
                'operating_profit': float(aggregates['operating_profit'] or 0),
                'net_profit': float(aggregates['net_profit'] or 0),
            }

            # KPI
            if total_revenue > 0:
                operating_margin = (data['summary']['operating_profit'] / total_revenue) * 100
                net_margin = (data['summary']['net_profit'] / total_revenue) * 100

                data['kpis'] = {
                    'operating_margin': round(operating_margin, 2),
                    'net_margin': round(net_margin, 2),
                    'status': 'good' if operating_margin > 8 else 'warning' if operating_margin > 5 else 'critical',
                }

            # 예산 현황
            if filters.get('budget_code'):
                budget = Budget.objects.filter(
                    budget_code=filters['budget_code']
                ).first()

                if budget:
                    spent_amount = total_revenue * 0.7  # 임시 계산
                    budget_ratio = (spent_amount / float(budget.budget_amount)) * 100 if budget.budget_amount else 0

                    data['budget_status'] = {
                        'budget_code': budget.budget_code,
                        'budget_amount': float(budget.budget_amount),
                        'spent_amount': spent_amount,
                        'remaining_amount': float(budget.budget_amount) - spent_amount,
                        'usage_ratio': round(budget_ratio, 2),
                        'status': 'normal' if budget_ratio < 80 else 'warning' if budget_ratio < 95 else 'critical',
                    }

            # 현금흐름
            data['cashflow'] = {
                'inflow': total_revenue * 0.6,  # 임시
                'outflow': data['summary']['total_cost'] * 0.5,
                'net': total_revenue * 0.1,
            }

        except Exception as e:
            logger.warning(f"재무 타워 데이터 조회 실패: {e}")
            data['error'] = str(e)

        return data

    def _get_purchase_tower_data(
        self,
        start_date: datetime,
        end_date: datetime,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """구매 타워 데이터 조회"""
        data = {
            'summary': {},
            'kpis': {},
            'suppliers': [],
            'inventory': {},
            'orders': {},
            'alerts': [],
            'recommendations': [],
        }

        try:
            from purchase.models import PurchaseOrder, SupplierEvaluation, Inventory

            # 요약
            orders = PurchaseOrder.objects.filter(
                order_date__gte=start_date.date(),
                order_date__lte=end_date.date()
            )

            aggregates = orders.aggregate(
                total_orders=Count('order_id'),
                total_amount=Sum('total_amount'),
                pending_orders=Count('order_id', filter=Q(status='pending'))
            )

            data['summary'] = {
                'total_orders': aggregates['total_orders'],
                'total_amount': float(aggregates['total_amount'] or 0),
                'pending_orders': aggregates['pending_orders'],
            }

            # KPI
            total_orders = aggregates['total_orders'] or 1
            on_time_delivery = 95  # 임시

            data['kpis'] = {
                'on_time_delivery_rate': on_time_delivery,
                'average_order_value': float(aggregates['total_amount'] or 0) / total_orders,
                'status': 'good' if on_time_delivery > 90 else 'warning',
            }

            # 공급자 평가
            evaluations = SupplierEvaluation.objects.filter(
                evaluation_date__gte=start_date.date(),
                evaluation_date__lte=end_date.date()
            ).order_by('-total_score')[:10]

            for eval in evaluations:
                data['suppliers'].append({
                    'supplier_code': eval.supplier_code,
                    'supplier_name': eval.supplier_name,
                    'total_score': float(eval.total_score),
                    'quality_score': float(eval.quality_score),
                    'delivery_score': float(eval.delivery_score),
                    'price_score': float(eval.price_score),
                })

            # 재고 현황
            inventories = Inventory.objects.all()[:5]  # 상위 5개 품목

            for inv in inventories:
                data['inventory'][inv.product_code] = {
                    'current_stock': inv.current_stock,
                    'safety_stock': inv.safety_stock,
                    'stock_status': 'normal' if inv.current_stock >= inv.safety_stock else 'low',
                }

        except Exception as e:
            logger.warning(f"구매 타워 데이터 조회 실패: {e}")
            data['error'] = str(e)

        return data

    def _get_production_tower_data(
        self,
        start_date: datetime,
        end_date: datetime,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """생산 타워 데이터 조회"""
        data = {
            'summary': {},
            'kpis': {},
            'production': [],
            'equipment': {},
            'alerts': [],
            'recommendations': [],
        }

        try:
            from production.models import ProductionResult, WorkOrder, Equipment

            # 요약
            results = ProductionResult.objects.filter(
                production_date__gte=start_date.date(),
                production_date__lte=end_date.date(),
                status='completed'
            )

            aggregates = results.aggregate(
                total_production=Sum('production_quantity'),
                avg_rate=Avg('production_rate'),
                total_count=Count('result_id')
            )

            data['summary'] = {
                'total_production': float(aggregates['total_production'] or 0),
                'average_rate': float(aggregates['avg_rate'] or 0),
                'completed_orders': aggregates['total_count'],
            }

            # KPI
            target_production = float(aggregates['total_production'] or 0) / 0.85
            achievement_rate = 100 if target_production == 0 else (data['summary']['total_production'] / target_production) * 100

            data['kpis'] = {
                'achievement_rate': round(achievement_rate, 2),
                'capacity_utilization': 85,  # 임시
                'status': 'good' if achievement_rate >= 95 else 'warning' if achievement_rate >= 85 else 'critical',
            }

            # 생산 현황
            work_orders = WorkOrder.objects.filter(
                status='in_progress'
            ).order_by('-planned_end')[:5]

            for order in work_orders:
                data['production'].append({
                    'order_number': order.order_number,
                    'product_name': order.product_name,
                    'planned_end': order.planned_end.isoformat() if order.planned_end else None,
                    'progress': 50,  # 임시
                })

            # 설비 현황
            equipment_count = Equipment.objects.filter(status='running').count()
            total_equipment = Equipment.objects.count()

            data['equipment'] = {
                'running_equipment': equipment_count,
                'total_equipment': total_equipment,
                'utilization_rate': round((equipment_count / total_equipment) * 100, 2) if total_equipment > 0 else 0,
            }

        except Exception as e:
            logger.warning(f"생산 타워 데이터 조회 실패: {e}")
            data['error'] = str(e)

        return data

    def _get_quality_tower_data(
        self,
        start_date: datetime,
        end_date: datetime,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """품질 타워 데이터 조회"""
        data = {
            'summary': {},
            'kpis': {},
            'defects': [],
            'capa': {},
            'inspections': {},
            'alerts': [],
            'recommendations': [],
        }

        try:
            from quality.models import Defect, CAPA, Inspection

            # 요약
            defects = Defect.objects.filter(
                detected_date__gte=start_date.date(),
                detected_date__lte=end_date.date()
            )

            aggregates = defects.aggregate(
                total_defects=Count('defect_id'),
                critical_defects=Count('defect_id', filter=Q(severity='critical')),
                major_defects=Count('defect_id', filter=Q(severity='major'))
            )

            data['summary'] = {
                'total_defects': aggregates['total_defects'],
                'critical_defects': aggregates['critical_defects'],
                'major_defects': aggregates['major_defects'],
            }

            # KPI
            total_production = 10000  # 임시 총 생산량
            defect_rate = (aggregates['total_defects'] / total_production) * 100 if total_production > 0 else 0
            quality_score = 100 - defect_rate

            data['kpis'] = {
                'defect_rate': round(defect_rate, 2),
                'quality_score': round(quality_score, 2),
                'first_pass_yield': 95,  # 임시
                'status': 'good' if defect_rate < 3 else 'warning' if defect_rate < 5 else 'critical',
            }

            # 불량 현황
            recent_defects = defects.order_by('-detected_at')[:10]

            for defect in recent_defects:
                data['defects'].append({
                    'defect_id': str(defect.defect_id),
                    'defect_type': defect.defect_type,
                    'severity': defect.severity,
                    'description': defect.description,
                    'detected_date': defect.detected_date.isoformat() if defect.detected_date else None,
                })

            # CAPA 현황
            open_capa = CAPA.objects.filter(
                status__in=['open', 'in_progress']
            ).aggregate(
                total=Count('capa_id'),
                overdue=Count('capa_id', filter=Q(due_date__lt=date.today()))
            )

            data['capa'] = {
                'open_count': open_capa['total'],
                'overdue_count': open_capa['overdue'],
                'completion_rate': 85,  # 임시
            }

            # 검사 현황
            inspections = Inspection.objects.filter(
                inspection_date__gte=start_date.date(),
                inspection_date__lte=end_date.date()
            ).aggregate(
                total_inspections=Count('inspection_id'),
                passed_inspections=Count('inspection_id', filter=Q(result='pass'))
            )

            if inspections['total_inspections']:
                pass_rate = (inspections['passed_inspections'] / inspections['total_inspections']) * 100
            else:
                pass_rate = 100

            data['inspections'] = {
                'total_count': inspections['total_inspections'],
                'passed_count': inspections['passed_inspections'],
                'pass_rate': round(pass_rate, 2),
            }

        except Exception as e:
            logger.warning(f"품질 타워 데이터 조회 실패: {e}")
            data['error'] = str(e)

        return data


# 헬퍼 함수
def get_functional_dashboard(domain: str, time_range: str = 'month') -> Dict[str, Any]:
    """기능별 대시보드 조회 헬퍼 함수"""
    service = FunctionalTowerService()
    return service.get_functional_tower(domain, {
        'time_range': time_range,
        'filters': {},
    })
