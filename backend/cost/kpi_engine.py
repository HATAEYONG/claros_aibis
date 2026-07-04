# Cost KPI Calculation Engine
# Version: 1.0.0
# Description: Complete cost KPI calculations with Django ORM

import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, Optional

from django.db.models import Sum, Avg, Count, Q, F, ExpressionWrapper, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import MonthlyCost, ProductCost, CostReductionProject, BreakEvenAnalysis, CostDriver

logger = logging.getLogger(__name__)


class CostKPIEngine:
    """Cost KPI calculation engine"""

    def __init__(self):
        pass

    def calculate_all_kpis(self, target_date: Optional[date] = None) -> Dict:
        """
        Calculate all cost KPIs

        Args:
            target_date: Reference month (None = current month)

        Returns:
            Dictionary of 10 KPIs
        """
        if target_date is None:
            target_date = date.today()

        kpis = {
            'COST_001': self.calculate_unit_cost(target_date),
            'COST_002': self.calculate_cost_variance_rate(target_date),
            'COST_003': self.calculate_material_cost_ratio(target_date),
            'COST_004': self.calculate_labor_cost_ratio(target_date),
            'COST_005': self.calculate_overhead_cost_ratio(target_date),
            'COST_006': self.calculate_cost_reduction_achievement(target_date),
            'COST_007': self.calculate_break_even_ratio(target_date),
            'COST_008': self.calculate_cost_driver_impact(target_date),
            'COST_009': self.calculate_overhead_absorption(target_date),
            'COST_010': self.calculate_cost_structure_stability(target_date),
        }

        logger.info(f"Cost KPIs calculated: {target_date.strftime('%Y-%m')}")
        return kpis

    def calculate_unit_cost(self, target_date: date) -> Dict:
        """
        COST_001: Unit Cost
        Formula: Total Unit Cost from MonthlyCost
        Target: - (varies by product)
        """
        try:
            # Get monthly cost data
            month_data = MonthlyCost.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if not month_data:
                return {
                    'code': 'COST_001',
                    'name': '제품단위원가',
                    'value': None,
                    'target': None,
                    'unit': '원',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No monthly cost data'},
                    'calculated_at': timezone.now().isoformat()
                }

            unit_cost = float(month_data.unit_cost)
            total_cost = float(month_data.total_cost)

            return {
                'code': 'COST_001',
                'name': '제품단위원가',
                'value': round(unit_cost, 2),
                'target': None,
                'unit': '원',
                'achievement_rate': None,
                'status': 'info',
                'details': {
                    'unit_cost': round(unit_cost, 2),
                    'total_cost': total_cost
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating unit cost: {e}")
            return self._error_dict('COST_001', '제품단위원가', str(e))

    def calculate_cost_variance_rate(self, target_date: date) -> Dict:
        """
        COST_002: Cost Variance Rate
        Formula: Based on ProductCost margin variance
        Target: ±5%
        """
        try:
            # Get variance statistics from ProductCost
            products = ProductCost.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            )

            if not products.exists():
                return {
                    'code': 'COST_002',
                    'name': '원가차이율',
                    'value': None,
                    'target': 5,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No product cost data'},
                    'calculated_at': timezone.now().isoformat()
                }

            # Calculate average margin rate variance
            total_margin_rate = sum(float(p.margin_rate) for p in products)
            avg_margin_rate = total_margin_rate / products.count() if products.count() > 0 else 0

            # Assuming target margin is around 20%, calculate variance
            target_margin = 20.0
            variance = avg_margin_rate - target_margin

            target = 5.0
            achievement = min(100, (target / abs(variance)) * 100) if variance != 0 else 100

            status = 'good' if abs(variance) <= 3 else 'warning' if abs(variance) <= 5 else 'error'

            return {
                'code': 'COST_002',
                'name': '원가차이율',
                'value': round(variance, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2),
                'status': status,
                'details': {
                    'variance_rate': round(variance, 2),
                    'avg_margin_rate': round(avg_margin_rate, 2),
                    'total_products': products.count()
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating cost variance rate: {e}")
            return self._error_dict('COST_002', '원가차이율', str(e))

            avg_variance = float(variance_stats['avg_variance_rate']) if variance_stats['avg_variance_rate'] else 0
            total_products = variance_stats['total_products'] or 0
            out_of_tolerance = variance_stats['out_of_tolerance'] or 0

            # Target: ±5% 이내
            target = 5.0
            if avg_variance:
                achievement = min(100, (target / abs(avg_variance)) * 100) if avg_variance != 0 else 100
            else:
                achievement = 100

            # Status determination
            status = 'good' if abs(avg_variance) <= 3 else 'warning' if abs(avg_variance) <= 5 else 'error'

            return {
                'code': 'COST_002',
                'name': '원가차이율',
                'value': round(avg_variance, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2),
                'status': status,
                'details': {
                    'avg_variance_rate': round(avg_variance, 2),
                    'total_products': total_products,
                    'out_of_tolerance': out_of_tolerance,
                    'variance_ratio': round((out_of_tolerance / total_products * 100), 2) if total_products > 0 else 0
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating cost variance rate: {e}")
            return self._error_dict('COST_002', '원가차이율', str(e))

    def calculate_material_cost_ratio(self, target_date: date) -> Dict:
        """
        COST_003: Material Cost Ratio
        Formula: (Material Cost / Total Cost) × 100
        Target: 60%
        """
        try:
            month_data = MonthlyCost.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if not month_data:
                return {
                    'code': 'COST_003',
                    'name': '재료비율',
                    'value': None,
                    'target': 60,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No monthly cost data'},
                    'calculated_at': timezone.now().isoformat()
                }

            material_cost = float(month_data.material_cost)
            total_cost = float(month_data.total_cost)

            ratio = (material_cost / total_cost * 100) if total_cost > 0 else 0
            target = 60.0
            achievement = (ratio / target * 100) if target > 0 else None

            status = 'good' if 55 <= ratio <= 65 else 'warning' if 50 <= ratio <= 70 else 'error'

            return {
                'code': 'COST_003',
                'name': '재료비율',
                'value': round(ratio, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'material_cost': material_cost,
                    'total_cost': total_cost,
                    'ratio': round(ratio, 2)
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating material cost ratio: {e}")
            return self._error_dict('COST_003', '재료비율', str(e))

    def calculate_labor_cost_ratio(self, target_date: date) -> Dict:
        """
        COST_004: Labor Cost Ratio
        Formula: (Labor Cost / Total Cost) × 100
        Target: 25%
        """
        try:
            month_data = MonthlyCost.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if not month_data:
                return {
                    'code': 'COST_004',
                    'name': '노무비율',
                    'value': None,
                    'target': 25,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No monthly cost data'},
                    'calculated_at': timezone.now().isoformat()
                }

            labor_cost = float(month_data.labor_cost)
            total_cost = float(month_data.total_cost)

            ratio = (labor_cost / total_cost * 100) if total_cost > 0 else 0
            target = 25.0
            achievement = (ratio / target * 100) if target > 0 else None

            status = 'good' if 22 <= ratio <= 28 else 'warning' if 20 <= ratio <= 30 else 'error'

            return {
                'code': 'COST_004',
                'name': '노무비율',
                'value': round(ratio, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'labor_cost': labor_cost,
                    'total_cost': total_cost,
                    'ratio': round(ratio, 2)
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating labor cost ratio: {e}")
            return self._error_dict('COST_004', '노무비율', str(e))

    def calculate_overhead_cost_ratio(self, target_date: date) -> Dict:
        """
        COST_005: Overhead Cost Ratio
        Formula: (Overhead Cost / Total Cost) × 100
        Target: 15%
        """
        try:
            month_data = MonthlyCost.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if not month_data:
                return {
                    'code': 'COST_005',
                    'name': '경비율',
                    'value': None,
                    'target': 15,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No monthly cost data'},
                    'calculated_at': timezone.now().isoformat()
                }

            overhead_cost = float(month_data.overhead_cost)
            total_cost = float(month_data.total_cost)

            ratio = (overhead_cost / total_cost * 100) if total_cost > 0 else 0
            target = 15.0
            achievement = (ratio / target * 100) if target > 0 else None

            status = 'good' if 12 <= ratio <= 18 else 'warning' if 10 <= ratio <= 20 else 'error'

            return {
                'code': 'COST_005',
                'name': '경비율',
                'value': round(ratio, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'overhead_cost': overhead_cost,
                    'total_cost': total_cost,
                    'ratio': round(ratio, 2)
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating overhead cost ratio: {e}")
            return self._error_dict('COST_005', '경비율', str(e))

    def calculate_cost_reduction_achievement(self, target_date: date) -> Dict:
        """
        COST_006: Cost Reduction Achievement Rate
        Formula: (Actual Savings / Target Savings) × 100
        Target: 100%
        """
        try:
            # Get all active projects
            projects = CostReductionProject.objects.filter(
                due_date__year=target_date.year,
                due_date__month=target_date.month
            )

            total_projects = projects.count()

            if total_projects == 0:
                return {
                    'code': 'COST_006',
                    'name': '원가절감달성률',
                    'value': 0,
                    'target': 100,
                    'unit': '%',
                    'achievement_rate': 0,
                    'status': 'info',
                    'details': {'message': 'No active reduction projects'},
                    'calculated_at': timezone.now().isoformat()
                }

            target_saving = float(projects.aggregate(
                total=Coalesce(Sum('target_saving'), Decimal('0'))
            )['total'])

            actual_saving = float(projects.aggregate(
                total=Coalesce(Sum('actual_saving'), Decimal('0'))
            )['total'])

            achievement = (actual_saving / target_saving * 100) if target_saving > 0 else 0

            completed = projects.filter(status='completed').count()

            status = 'good' if achievement >= 100 else 'warning' if achievement >= 80 else 'error'

            return {
                'code': 'COST_006',
                'name': '원가절감달성률',
                'value': round(achievement, 2),
                'target': 100,
                'unit': '%',
                'achievement_rate': round(achievement, 2),
                'status': status,
                'details': {
                    'target_saving': target_saving,
                    'actual_saving': actual_saving,
                    'total_projects': total_projects,
                    'completed_projects': completed
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating cost reduction achievement: {e}")
            return self._error_dict('COST_006', '원가절감달성률', str(e))

    def calculate_break_even_ratio(self, target_date: date) -> Dict:
        """
        COST_007: Break-Even Ratio
        Formula: Break-Even Point / Actual Sales × 100
        Target: < 85%
        """
        try:
            be_analysis = BreakEvenAnalysis.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if not be_analysis:
                return {
                    'code': 'COST_007',
                    'name': '손익분기점비율',
                    'value': None,
                    'target': 85,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No break-even analysis data'},
                    'calculated_at': timezone.now().isoformat()
                }

            bep = float(be_analysis.break_even_point)
            actual_sales = float(be_analysis.actual_sales)

            ratio = (bep / actual_sales * 100) if actual_sales > 0 else 0
            target = 85.0
            # Lower is better for break-even ratio
            achievement = (target / ratio * 100) if ratio > 0 else 100

            status = 'good' if ratio < 75 else 'warning' if ratio < 85 else 'error'

            return {
                'code': 'COST_007',
                'name': '손익분기점비율',
                'value': round(ratio, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2),
                'status': status,
                'details': {
                    'break_even_point': bep,
                    'actual_sales': actual_sales,
                    'margin_of_safety': float(be_analysis.margin_of_safety)
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating break-even ratio: {e}")
            return self._error_dict('COST_007', '손익분기점비율', str(e))

    def calculate_cost_driver_impact(self, target_date: date) -> Dict:
        """
        COST_008: Cost Driver Impact Rate
        Formula: Weighted average of cost driver impacts
        Target: Monitor trend
        """
        try:
            drivers = CostDriver.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            )

            if not drivers.exists():
                return {
                    'code': 'COST_008',
                    'name': '원가동인영향도',
                    'value': None,
                    'target': None,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No cost driver data'},
                    'calculated_at': timezone.now().isoformat()
                }

            # Calculate weighted average impact rate
            total_impact = 0
            driver_count = drivers.count()

            for driver in drivers:
                total_impact += float(driver.impact_rate)

            avg_impact = total_impact / driver_count if driver_count > 0 else 0

            # Count up trends
            up_trends = drivers.filter(trend='up').count()

            status = 'info'  # This is a monitoring metric

            return {
                'code': 'COST_008',
                'name': '원가동인영향도',
                'value': round(avg_impact, 2),
                'target': None,
                'unit': '%',
                'achievement_rate': None,
                'status': status,
                'details': {
                    'avg_impact_rate': round(avg_impact, 2),
                    'driver_count': driver_count,
                    'up_trends': up_trends
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating cost driver impact: {e}")
            return self._error_dict('COST_008', '원가동인영향도', str(e))

    def calculate_overhead_absorption(self, target_date: date) -> Dict:
        """
        COST_009: Overhead Absorption Rate
        Formula: (Actual Overhead / Standard Overhead) × 100
        Target: 95-105%
        """
        try:
            # Get MonthlyCost data
            monthly_cost = MonthlyCost.objects.filter(
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if not monthly_cost:
                return {
                    'code': 'COST_009',
                    'name': '경비배부율',
                    'value': None,
                    'target': 100,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'No monthly cost data'},
                    'calculated_at': timezone.now().isoformat()
                }

            overhead = float(monthly_cost.overhead_cost)
            total_cost = float(monthly_cost.total_cost)

            # Assuming standard overhead is 15% of total cost
            standard_overhead = total_cost * 0.15

            absorption = (overhead / standard_overhead * 100) if standard_overhead > 0 else 0
            target = 100.0
            achievement = min(100, (target / abs(absorption - target) * 100)) if absorption != target else 100

            status = 'good' if 95 <= absorption <= 105 else 'warning' if 90 <= absorption <= 110 else 'error'

            return {
                'code': 'COST_009',
                'name': '경비배부율',
                'value': round(absorption, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2),
                'status': status,
                'details': {
                    'actual_overhead': overhead,
                    'standard_overhead': round(standard_overhead, 2),
                    'total_cost': total_cost
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating overhead absorption: {e}")
            return self._error_dict('COST_009', '경비배부율', str(e))

    def calculate_cost_structure_stability(self, target_date: date) -> Dict:
        """
        COST_010: Cost Structure Stability
        Formula: Standard deviation of cost ratios over 3 months
        Target: < 5% variation
        """
        try:
            # Get data for current month and previous 2 months
            months_to_check = []
            for i in range(3):
                month = target_date.month - i
                year = target_date.year
                if month <= 0:
                    month += 12
                    year -= 1
                months_to_check.append((year, month))

            ratios = []
            for year, month in months_to_check:
                monthly = MonthlyCost.objects.filter(
                    fiscal_year=year,
                    fiscal_month=month
                ).first()

                if monthly and monthly.total_cost > 0:
                    material_ratio = float(monthly.material_cost) / float(monthly.total_cost) * 100
                    ratios.append(material_ratio)

            if len(ratios) < 2:
                return {
                    'code': 'COST_010',
                    'name': '원가구조안정성',
                    'value': None,
                    'target': 5,
                    'unit': '%',
                    'achievement_rate': None,
                    'status': 'info',
                    'details': {'message': 'Insufficient data for stability calculation'},
                    'calculated_at': timezone.now().isoformat()
                }

            # Calculate standard deviation
            avg = sum(ratios) / len(ratios)
            variance = sum((r - avg) ** 2 for r in ratios) / len(ratios)
            std_dev = variance ** 0.5

            target = 5.0
            achievement = (target / std_dev * 100) if std_dev > 0 else 100

            status = 'good' if std_dev < 3 else 'warning' if std_dev < 5 else 'error'

            return {
                'code': 'COST_010',
                'name': '원가구조안정성',
                'value': round(std_dev, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2),
                'status': status,
                'details': {
                    'std_deviation': round(std_dev, 2),
                    'avg_ratio': round(avg, 2),
                    'data_points': len(ratios)
                },
                'calculated_at': timezone.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating cost structure stability: {e}")
            return self._error_dict('COST_010', '원가구조안정성', str(e))

    def _error_dict(self, code: str, name: str, error: str) -> Dict:
        """Return error dictionary"""
        return {
            'code': code,
            'name': name,
            'value': None,
            'target': None,
            'unit': '',
            'achievement_rate': None,
            'status': 'error',
            'details': {
                'error': error
            },
            'calculated_at': timezone.now().isoformat()
        }


def get_cost_kpis(target_date: Optional[date] = None) -> Dict:
    """Get all cost KPIs"""
    engine = CostKPIEngine()
    return engine.calculate_all_kpis(target_date)
