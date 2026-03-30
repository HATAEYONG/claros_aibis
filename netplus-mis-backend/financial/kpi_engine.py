# Financial KPI Calculation Engine
# Version: 1.0.0
# Description: Complete financial KPI calculations

import logging
from datetime import datetime
from typing import Dict, Optional
from decimal import Decimal

from django.db.models import Sum, Avg, F, Q
from django.db import connection

from .models import FinancialStatement

logger = logging.getLogger(__name__)


class FinanceKPIEngine:
    """Financial KPI calculation engine"""

    def __init__(self):
        pass

    def calculate_all_kpis(self, target_date: Optional[datetime] = None) -> Dict:
        """
        Calculate all financial KPIs

        Args:
            target_date: Reference month (None = current month)

        Returns:
            Dictionary of 11 KPIs
        """
        if target_date is None:
            target_date = datetime.now()

        kpis = {
            'FIN_001': self.calculate_revenue(target_date),
            'FIN_002': self.calculate_operating_income(target_date),
            'FIN_003': self.calculate_operating_income_margin(target_date),
            'FIN_004': self.calculate_net_income(target_date),
            'FIN_005': self.calculate_net_profit_margin(target_date),
            'FIN_006': self.calculate_roe(target_date),
            'FIN_007': self.calculate_roa(target_date),
            'FIN_008': self.calculate_current_ratio(target_date),
            'FIN_009': self.calculate_debt_to_equity_ratio(target_date),
            'FIN_010': self.calculate_cash_flow(target_date),
            'FIN_011': self.calculate_ebitda(target_date),
        }

        logger.info(f"Financial KPIs calculated: {target_date.strftime('%Y-%m')}")
        return kpis

    def calculate_revenue(self, target_date: datetime) -> Dict:
        """
        FIN_001: Revenue
        Formula: SUM(revenue)
        Target: 1.2 trillion KRW/year = 12,000 억원
        """
        try:
            # Annual cumulative revenue (from income statement only)
            year_data = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year
            ).aggregate(
                total_revenue=Sum('revenue')
            )

            revenue_value = year_data['total_revenue'] or Decimal('0')

            # Annual target (in 억원 / hundred million KRW)
            target_annual = Decimal('12000')  # 1.2 trillion = 12,000 억원
            current_month = target_date.month
            target_monthly = target_annual / Decimal('12')

            # Monthly achievement
            achievement = (revenue_value / target_monthly) * Decimal('100') if target_monthly > 0 else None

            # Status determination
            if achievement is not None:
                status = 'good' if achievement >= 100 else 'warning' if achievement >= 80 else 'error'
            else:
                status = 'info'

            return {
                'code': 'FIN_001',
                'name': '매출액',
                'value': float(revenue_value),
                'target': float(target_annual),
                'unit': '억원',
                'achievement_rate': float(round(achievement, 2)) if achievement is not None else None,
                'status': status,
                'details': {
                    'annual_revenue': float(revenue_value),
                    'target_annual': float(target_annual),
                    'monthly_avg': float(round(revenue_value / Decimal(str(current_month)), 2)) if current_month > 0 else 0
                }
            }

        except Exception as e:
            logger.error(f"Error calculating revenue: {e}")
            return self._error_dict('FIN_001', '매출액', str(e))

    def calculate_operating_income(self, target_date: datetime) -> Dict:
        """
        FIN_002: Operating Profit
        Formula: Gross Profit - Selling Expenses - Administrative Expenses
        Target: 180 billion KRW/year = 1,800 억원
        """
        try:
            year_data = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year
            ).aggregate(
                total_op_profit=Sum('operating_income')
            )

            operating_income = year_data['total_op_profit'] or Decimal('0')
            target_annual = Decimal('1800')  # 180 billion = 1,800 억원
            achievement = float(round((operating_income / target_annual) * Decimal('100'), 2)) if target_annual > 0 else 0

            status = 'good' if achievement >= 100 else 'warning' if achievement >= 80 else 'error'

            return {
                'code': 'FIN_002',
                'name': '영업이익',
                'value': float(operating_income),
                'target': float(target_annual),
                'unit': '억원',
                'achievement_rate': achievement,
                'status': status,
                'details': {
                    'annual_amount': float(operating_income)
                }
            }

        except Exception as e:
            logger.error(f"Error calculating operating profit: {e}")
            return self._error_dict('FIN_002', '영업이익', str(e))

    def calculate_operating_income_margin(self, target_date: datetime) -> Dict:
        """
        FIN_003: Operating Profit Margin
        Formula: (Operating Profit / Revenue) × 100
        Target: 15%
        """
        try:
            data = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year,
                fiscal_month__lte=target_date.month
            ).aggregate(
                total_op_income=Sum('operating_income'),
                total_revenue=Sum('revenue')
            )

            total_op = data['total_op_income'] or Decimal('0')
            total_rev = data['total_revenue'] or Decimal('0')

            margin = float((total_op / total_rev * Decimal('100'))) if total_rev > 0 else 0

            target = 15.0
            achievement = (margin / target * 100) if target > 0 else None

            status = 'good' if margin >= 15 else 'warning' if margin >= 12 else 'error'

            return {
                'code': 'FIN_003',
                'name': '영업이익률',
                'value': round(margin, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'operating_income': float(total_op),
                    'revenue': float(total_rev)
                }
            }

        except Exception as e:
            logger.error(f"Error calculating operating profit margin: {e}")
            return self._error_dict('FIN_003', '영업이익률', str(e))

    def calculate_net_income(self, target_date: datetime) -> Dict:
        """
        FIN_004: Net Income
        Formula: Pre-tax Income - Corporate Tax
        Target: 120 billion KRW/year
        """
        try:
            year_data = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year
            ).aggregate(
                total_net_income=Sum('net_income')
            )

            net_income = year_data['total_net_income'] or Decimal('0')
            target_annual = Decimal('1200')  # 120 billion = 1,200 억원
            achievement = float(round((net_income / target_annual) * Decimal('100'), 2)) if target_annual > 0 else 0

            status = 'good' if achievement >= 100 else 'warning' if achievement >= 80 else 'error'

            return {
                'code': 'FIN_004',
                'name': '당기순이익',
                'value': float(net_income),
                'target': float(target_annual),
                'unit': '억원',
                'achievement_rate': achievement,
                'status': status,
                'details': {
                    'annual_amount': float(net_income)
                }
            }

        except Exception as e:
            logger.error(f"Error calculating net income: {e}")
            return self._error_dict('FIN_004', '당기순이익', str(e))

    def calculate_net_profit_margin(self, target_date: datetime) -> Dict:
        """
        FIN_005: Net Profit Margin
        Formula: (Net Income / Revenue) × 100
        Target: 10%
        """
        try:
            data = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year,
                fiscal_month__lte=target_date.month
            ).aggregate(
                total_net=Sum('net_income'),
                total_rev=Sum('revenue')
            )

            total_net = data['total_net'] or Decimal('0')
            total_rev = data['total_rev'] or Decimal('0')

            margin = float((total_net / total_rev * Decimal('100'))) if total_rev > 0 else 0

            target = 10.0
            achievement = (margin / target * 100) if target > 0 else None

            status = 'good' if margin >= 10 else 'warning' if margin >= 8 else 'error'

            return {
                'code': 'FIN_005',
                'name': '순이익률',
                'value': round(margin, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'net_income': float(total_net),
                    'revenue': float(total_rev)
                }
            }

        except Exception as e:
            logger.error(f"Error calculating net profit margin: {e}")
            return self._error_dict('FIN_005', '순이익률', str(e))

    def calculate_roe(self, target_date: datetime) -> Dict:
        """
        FIN_006: ROE (Return on Equity)
        Formula: (Net Income / Total Equity) × 100
        Target: 15%
        """
        try:
            # Get net income from income statement
            income_stmt = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            # Get equity from balance sheet
            balance_stmt = FinancialStatement.objects.filter(
                statement_type='balance',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if income_stmt and balance_stmt:
                net_income = float(income_stmt.net_income or Decimal('0'))
                equity = float(balance_stmt.total_equity or Decimal('0'))

                roe = (net_income / equity * 100) if equity > 0 else 0
            else:
                net_income = 0
                equity = 0
                roe = 0

            target = 15.0
            achievement = (roe / target * 100) if target > 0 else None

            status = 'good' if roe >= 15 else 'warning' if roe >= 12 else 'error'

            return {
                'code': 'FIN_006',
                'name': 'ROE',
                'value': round(roe, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'net_income': net_income,
                    'equity': equity
                }
            }

        except Exception as e:
            logger.error(f"Error calculating ROE: {e}")
            return self._error_dict('FIN_006', 'ROE', str(e))

    def calculate_roa(self, target_date: datetime) -> Dict:
        """
        FIN_007: ROA (Return on Assets)
        Formula: (Net Income / Total Assets) × 100
        Target: 8%
        """
        try:
            # Get net income from income statement
            income_stmt = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            # Get assets from balance sheet
            balance_stmt = FinancialStatement.objects.filter(
                statement_type='balance',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if income_stmt and balance_stmt:
                net_income = float(income_stmt.net_income or Decimal('0'))
                total_assets = float(balance_stmt.total_assets or Decimal('0'))

                roa = (net_income / total_assets * 100) if total_assets > 0 else 0
            else:
                net_income = 0
                total_assets = 0
                roa = 0

            target = 8.0
            achievement = (roa / target * 100) if target > 0 else None

            status = 'good' if roa >= 8 else 'warning' if roa >= 6 else 'error'

            return {
                'code': 'FIN_007',
                'name': 'ROA',
                'value': round(roa, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'net_income': net_income,
                    'total_assets': total_assets
                }
            }

        except Exception as e:
            logger.error(f"Error calculating ROA: {e}")
            return self._error_dict('FIN_007', 'ROA', str(e))

    def calculate_current_ratio(self, target_date: datetime) -> Dict:
        """
        FIN_008: Current Ratio
        Formula: (Current Assets / Current Liabilities) × 100
        Target: 150%
        """
        try:
            latest = FinancialStatement.objects.filter(
                statement_type='balance',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if latest:
                current_assets = float(latest.current_assets or Decimal('0'))
                current_liabilities = float(latest.current_liabilities or Decimal('0'))

                ratio = (current_assets / current_liabilities * 100) if current_liabilities > 0 else 0
            else:
                current_assets = 0
                current_liabilities = 0
                ratio = 0

            target = 150.0
            achievement = (ratio / target * 100) if target > 0 else None

            status = 'good' if ratio >= 150 else 'warning' if ratio >= 120 else 'error'

            return {
                'code': 'FIN_008',
                'name': '유동비율',
                'value': round(ratio, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'current_assets': current_assets,
                    'current_liabilities': current_liabilities
                }
            }

        except Exception as e:
            logger.error(f"Error calculating current ratio: {e}")
            return self._error_dict('FIN_008', '유동비율', str(e))

    def calculate_debt_to_equity_ratio(self, target_date: datetime) -> Dict:
        """
        FIN_009: Debt to Equity Ratio
        Formula: (Total Liabilities / Total Equity) × 100
        Target: 150%
        """
        try:
            latest = FinancialStatement.objects.filter(
                statement_type='balance',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if latest:
                total_liabilities = float(latest.total_liabilities or Decimal('0'))
                equity = float(latest.total_equity or Decimal('0'))

                ratio = (total_liabilities / equity * 100) if equity > 0 else 0
            else:
                total_liabilities = 0
                equity = 0
                ratio = 0

            target = 150.0
            # Lower is better for debt ratio
            achievement = (target / ratio * 100) if ratio > 0 else 100

            status = 'good' if ratio <= 150 else 'warning' if ratio <= 200 else 'error'

            return {
                'code': 'FIN_009',
                'name': '부채비율',
                'value': round(ratio, 2),
                'target': target,
                'unit': '%',
                'achievement_rate': round(achievement, 2) if achievement else None,
                'status': status,
                'details': {
                    'total_liabilities': total_liabilities,
                    'equity': equity
                }
            }

        except Exception as e:
            logger.error(f"Error calculating debt to equity ratio: {e}")
            return self._error_dict('FIN_009', '부채비율', str(e))

    def calculate_cash_flow(self, target_date: datetime) -> Dict:
        """
        FIN_010: Cash Flow
        Formula: Operating CF + Investing CF + Financing CF
        Target: 0 (positive recommended)
        """
        try:
            latest = FinancialStatement.objects.filter(
                statement_type='cashflow',
                fiscal_year=target_date.year,
                fiscal_month=target_date.month
            ).first()

            if latest:
                op_cf = float(latest.operating_cashflow or Decimal('0'))
                inv_cf = float(latest.investing_cashflow or Decimal('0'))
                fin_cf = float(latest.financing_cashflow or Decimal('0'))
                net_cf = op_cf + inv_cf + fin_cf
            else:
                op_cf = inv_cf = fin_cf = net_cf = 0

            status = 'good' if net_cf >= 0 else 'error'

            return {
                'code': 'FIN_010',
                'name': '현금흐름',
                'value': net_cf,
                'target': 0,
                'unit': '억원',
                'achievement_rate': 100 if net_cf >= 0 else None,
                'status': status,
                'details': {
                    'operating_cash_flow': op_cf,
                    'investing_cash_flow': inv_cf,
                    'financing_cash_flow': fin_cf,
                    'net_cash_flow': net_cf
                }
            }

        except Exception as e:
            logger.error(f"Error calculating cash flow: {e}")
            return self._error_dict('FIN_010', '현금흐름', str(e))

    def calculate_ebitda(self, target_date: datetime) -> Dict:
        """
        FIN_011: EBITDA
        Formula: Operating Profit + Depreciation Expense
        Target: - (tracking metric)
        """
        try:
            data = FinancialStatement.objects.filter(
                statement_type='income',
                fiscal_year=target_date.year,
                fiscal_month__lte=target_date.month
            ).aggregate(
                total_op_income=Sum('operating_income')
            )

            total_op = float(data['total_op_income'] or Decimal('0'))
            # EBITDA is roughly operating income + depreciation, but since we don't have depreciation separately,
            # we'll use operating income as a proxy
            total_ebitda = total_op

            status = 'info'  # EBITDA is primarily a tracking metric

            return {
                'code': 'FIN_011',
                'name': 'EBITDA',
                'value': total_ebitda,
                'target': None,
                'unit': '억원',
                'achievement_rate': None,
                'status': status,
                'details': {
                    'operating_income': total_op,
                    'ebitda': total_ebitda
                }
            }

        except Exception as e:
            logger.error(f"Error calculating EBITDA: {e}")
            return self._error_dict('FIN_011', 'EBITDA', str(e))

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
            }
        }


def get_finance_kpis(target_date: Optional[datetime] = None) -> Dict:
    """Get all financial KPIs"""
    engine = FinanceKPIEngine()
    return engine.calculate_all_kpis(target_date)
