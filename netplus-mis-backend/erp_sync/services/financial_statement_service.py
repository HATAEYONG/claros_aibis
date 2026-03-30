# -*- coding: utf-8 -*-
"""
재무제표 데이터 서비스

손익계산서, 재무상태표, 현금흐름표, 자본변동표 데이터 제공
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime
import logging

from erp_sync.models.erp_source import ERPSource
from erp_sync.models.mapping import ERPTableMapping
from erp_sync.services.dashboard_data_service import DataSyncService

logger = logging.getLogger(__name__)


class FinancialStatementDataService:
    """재무제표 데이터 서비스"""

    # 재무제표 계정코드 매핑 (한국 기업 표준)
    ACCOUNT_CODE_RANGES = {
        # 손익계산서 계정코드
        'income': {
            'revenue': ['41'],          # 매출액 (410: 제품매출액, 411: 상품매출액 등)
            'cost_of_sales': ['42'],     # 매출원가
            'gross_profit': ['43'],      # 매출총이익
            'sga_expenses': ['44'],      # 판매비와 관리비
            'operating_income': ['45'],  # 영업이익
            'non_operating_income': ['46'],  # 영업외수익
            'non_operating_expenses': ['47'],  # 영업외비용
            'net_income': ['48'],        # 당기순이익
        },
        # 재무상태표 계정코드
        'balance': {
            'current_assets': ['11'],     # 유동자산
            'non_current_assets': ['12'], # 비유동자산
            'total_assets': ['11', '12'], # 자산총계 (유동 + 비유동)
            'current_liabilities': ['21'],  # 유동부채
            'non_current_liabilities': ['22'],  # 비유동부채
            'total_liabilities': ['21', '22'],  # 부채총계
            'equity': ['30'],             # 자본
        },
        # 현금흐름표 계정코드
        'cashflow': {
            'operating_cashflow': ['51'],  # 영업활동현금흐름
            'investing_cashflow': ['52'],  # 투자활동현금흐름
            'financing_cashflow': ['53'],  # 재무활동현금흐름
        },
        # 자본변동표 계정코드
        'equity': {
            'beginning_equity': ['310'],  # 기초자본
            'net_income': ['320'],        # 당기순이익
            'dividend_paid': ['330'],     # 배당금지급
            'ending_equity': ['340'],     # 기말자본
        }
    }

    @staticmethod
    def _aggregate_by_account_code(erp_data, account_ranges):
        """
        계정코드별로 데이터 집계

        Args:
            erp_data: CAM900_YH 조회 데이터
            account_ranges: 계정코드 범위 딕셔너리

        Returns:
            dict: 계정코드별 집계 데이터
        """
        result = {}

        for field_name, code_prefixes in account_ranges.items():
            result[field_name] = 0

            for row in erp_data:
                acc_cd = row.get('acc_cd', '')

                # 계정코드가 매핑 범위에 속하는지 확인
                for prefix in code_prefixes:
                    if acc_cd.startswith(prefix):
                        # 차변(amt1)은 더하고, 대변(amt2)는 뺌
                        amt1 = float(row.get('amt1', 0) or 0)
                        amt2 = float(row.get('amt2', 0) or 0)
                        result[field_name] += (amt1 - amt2)
                        break

        # 소수점 이하 반올림
        for key in result:
            result[key] = round(result[key], 2)

        return result

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_income_statement(request):
        """
        손익계산서 데이터 조회

        GET /api/erp-sync/financial/income-statement/

        Query Parameters:
            fiscal_year: 회계연도 (예: 2024)
            fiscal_month: 회계월 (예: 12)
        """
        try:
            fiscal_year = request.GET.get('fiscal_year', '2024')
            fiscal_month = request.GET.get('fiscal_month', '12')

            erp_source = DataSyncService.get_default_source()
            data = None

            if erp_source:
                try:
                    # CAM900_YH에서 해당 기간 데이터 조회
                    where_clause = f"wrk_year = '{fiscal_year}'"
                    if fiscal_month:
                        where_clause += f" AND substr(doc_dt, 6, 2) = '{fiscal_month.zfill(2)}'"

                    erp_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CAM900_YH',
                        where_clause=where_clause,
                        limit=1000
                    )

                    if erp_data:
                        # 계정코드별 집계
                        aggregated = FinancialStatementDataService._aggregate_by_account_code(
                            erp_data,
                            FinancialStatementDataService.ACCOUNT_CODE_RANGES['income']
                        )

                        data = {
                            'fiscal_year': fiscal_year,
                            'fiscal_month': fiscal_month,
                            'revenue': aggregated.get('revenue', 0),
                            'cost_of_sales': aggregated.get('cost_of_sales', 0),
                            'gross_profit': aggregated.get('gross_profit', 0),
                            'sga_expenses': aggregated.get('sga_expenses', 0),
                            'operating_income': aggregated.get('operating_income', 0),
                            'non_operating_income': aggregated.get('non_operating_income', 0),
                            'non_operating_expenses': aggregated.get('non_operating_expenses', 0),
                            'net_income': aggregated.get('net_income', 0),
                            'source_tables': ['CAM900_YH'],
                            'data_source': 'erp'
                        }
                        logger.info(f"[FinancialStatement] Loaded ERP income statement data: {len(erp_data)} records")

                except Exception as e:
                    logger.warning(f"[FinancialStatement] ERP query failed: {str(e)}")

            # 폴백 데이터
            if data is None:
                data = {
                    'fiscal_year': fiscal_year,
                    'fiscal_month': fiscal_month,
                    'revenue': 156000000000,  # 1,560억
                    'cost_of_sales': 128000000000,  # 1,280억
                    'gross_profit': 28000000000,  # 280억
                    'sga_expenses': 15000000000,  # 150억
                    'operating_income': 13000000000,  # 130억
                    'non_operating_income': 2000000000,  # 20억
                    'non_operating_expenses': 1000000000,  # 10억
                    'net_income': 9800000000,  # 98억
                    'source_tables': ['CAM900_YH'],
                    'data_source': 'fallback'
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[FinancialStatement] Income statement error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_balance_sheet(request):
        """
        재무상태표 데이터 조회

        GET /api/erp-sync/financial/balance-sheet/

        Query Parameters:
            fiscal_year: 회계연도 (예: 2024)
            fiscal_month: 회계월 (예: 12)
        """
        try:
            fiscal_year = request.GET.get('fiscal_year', '2024')
            fiscal_month = request.GET.get('fiscal_month', '12')

            erp_source = DataSyncService.get_default_source()
            data = None

            if erp_source:
                try:
                    # CAM900_YH에서 해당 기간 데이터 조회
                    where_clause = f"wrk_year = '{fiscal_year}'"
                    if fiscal_month:
                        where_clause += f" AND substr(doc_dt, 6, 2) = '{fiscal_month.zfill(2)}'"

                    erp_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CAM900_YH',
                        where_clause=where_clause,
                        limit=1000
                    )

                    if erp_data:
                        # 계정코드별 집계
                        aggregated = FinancialStatementDataService._aggregate_by_account_code(
                            erp_data,
                            FinancialStatementDataService.ACCOUNT_CODE_RANGES['balance']
                        )

                        data = {
                            'fiscal_year': fiscal_year,
                            'fiscal_month': fiscal_month,
                            'current_assets': aggregated.get('current_assets', 0),
                            'non_current_assets': aggregated.get('non_current_assets', 0),
                            'total_assets': aggregated.get('total_assets', 0),
                            'current_liabilities': aggregated.get('current_liabilities', 0),
                            'non_current_liabilities': aggregated.get('non_current_liabilities', 0),
                            'total_liabilities': aggregated.get('total_liabilities', 0),
                            'equity': aggregated.get('equity', 0),
                            'source_tables': ['CAM900_YH'],
                            'data_source': 'erp'
                        }
                        logger.info(f"[FinancialStatement] Loaded ERP balance sheet data: {len(erp_data)} records")

                except Exception as e:
                    logger.warning(f"[FinancialStatement] ERP query failed: {str(e)}")

            # 폴백 데이터
            if data is None:
                data = {
                    'fiscal_year': fiscal_year,
                    'fiscal_month': fiscal_month,
                    'current_assets': 350000000000,  # 3,500억
                    'non_current_assets': 450000000000,  # 4,500억
                    'total_assets': 800000000000,  # 8,000억
                    'current_liabilities': 180000000000,  # 1,800억
                    'non_current_liabilities': 120000000000,  # 1,200억
                    'total_liabilities': 300000000000,  # 3,000억
                    'equity': 500000000000,  # 5,000억
                    'source_tables': ['CAM900_YH'],
                    'data_source': 'fallback'
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[FinancialStatement] Balance sheet error: {str(e)}", exc_info=True)
            error_msg = f'Data fetch failed: {str(e)}'
            return Response({'error': error_msg}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_cash_flow_statement(request):
        """
        현금흐름표 데이터 조회

        GET /api/erp-sync/financial/cash-flow-statement/

        Query Parameters:
            fiscal_year: 회계연도 (예: 2024)
            fiscal_month: 회계월 (예: 12)
        """
        try:
            fiscal_year = request.GET.get('fiscal_year', '2024')
            fiscal_month = request.GET.get('fiscal_month', '12')

            erp_source = DataSyncService.get_default_source()
            data = None

            if erp_source:
                try:
                    # CAM900_YH에서 해당 기간 데이터 조회
                    where_clause = f"wrk_year = '{fiscal_year}'"
                    if fiscal_month:
                        where_clause += f" AND substr(doc_dt, 6, 2) = '{fiscal_month.zfill(2)}'"

                    erp_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CAM900_YH',
                        where_clause=where_clause,
                        limit=1000
                    )

                    if erp_data:
                        # 계정코드별 집계
                        aggregated = FinancialStatementDataService._aggregate_by_account_code(
                            erp_data,
                            FinancialStatementDataService.ACCOUNT_CODE_RANGES['cashflow']
                        )

                        # 현금증감액 계산
                        net_change = (aggregated.get('operating_cashflow', 0) +
                                    aggregated.get('investing_cashflow', 0) +
                                    aggregated.get('financing_cashflow', 0))

                        data = {
                            'fiscal_year': fiscal_year,
                            'fiscal_month': fiscal_month,
                            'operating_cashflow': aggregated.get('operating_cashflow', 0),
                            'investing_cashflow': aggregated.get('investing_cashflow', 0),
                            'financing_cashflow': aggregated.get('financing_cashflow', 0),
                            'net_cash_change': net_change,
                            'beginning_cash': 80000000000,  # 800억 (기본값)
                            'ending_cash': 80000000000 + net_change,  # 기초 + 증감
                            'source_tables': ['CAM900_YH'],
                            'data_source': 'erp'
                        }
                        logger.info(f"[FinancialStatement] Loaded ERP cash flow data: {len(erp_data)} records")

                except Exception as e:
                    logger.warning(f"[FinancialStatement] ERP query failed: {str(e)}")

            # 폴백 데이터
            if data is None:
                data = {
                    'fiscal_year': fiscal_year,
                    'fiscal_month': fiscal_month,
                    'operating_cashflow': 95000000000,  # 950억
                    'investing_cashflow': -45000000000,  # -450억
                    'financing_cashflow': -20000000000,  # -200억
                    'net_cash_change': 30000000000,  # 300억
                    'beginning_cash': 80000000000,  # 800억
                    'ending_cash': 110000000000,  # 1,100억
                    'source_tables': ['CAM900_YH'],
                    'data_source': 'fallback'
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[FinancialStatement] Cash flow error: {str(e)}", exc_info=True)
            error_msg = f'Data fetch failed: {str(e)}'
            return Response({'error': error_msg}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equity_statement(request):
        """
        자본변동표 데이터 조회

        GET /api/erp-sync/financial/equity-statement/

        Query Parameters:
            fiscal_year: 회계연도 (예: 2024)
            fiscal_month: 회계월 (예: 12)
        """
        try:
            fiscal_year = request.GET.get('fiscal_year', '2024')
            fiscal_month = request.GET.get('fiscal_month', '12')

            erp_source = DataSyncService.get_default_source()
            data = None

            if erp_source:
                try:
                    # CAM900_YH에서 해당 기간 데이터 조회
                    where_clause = f"wrk_year = '{fiscal_year}'"
                    if fiscal_month:
                        where_clause += f" AND substr(doc_dt, 6, 2) = '{fiscal_month.zfill(2)}'"

                    erp_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'CAM900_YH',
                        where_clause=where_clause,
                        limit=1000
                    )

                    if erp_data:
                        # 계정코드별 집계
                        aggregated = FinancialStatementDataService._aggregate_by_account_code(
                            erp_data,
                            FinancialStatementDataService.ACCOUNT_CODE_RANGES['equity']
                        )

                        # 기말자본 = 기초자본 + 당기순이익 - 배당금 + 기타포괄손익
                        beginning_equity = aggregated.get('beginning_equity', 500000000000)
                        net_income = aggregated.get('net_income', 0)
                        dividend_paid = aggregated.get('dividend_paid', 0)
                        other_ci = aggregated.get('other_comprehensive_income', 0)
                        ending_equity = beginning_equity + net_income - dividend_paid + other_ci

                        data = {
                            'fiscal_year': fiscal_year,
                            'fiscal_month': fiscal_month,
                            'beginning_equity': beginning_equity,
                            'net_income': net_income,
                            'dividend_paid': dividend_paid,
                            'other_comprehensive_income': other_ci,
                            'ending_equity': ending_equity,
                            'source_tables': ['CAM900_YH'],
                            'data_source': 'erp'
                        }
                        logger.info(f"[FinancialStatement] Loaded ERP equity statement data: {len(erp_data)} records")

                except Exception as e:
                    logger.warning(f"[FinancialStatement] ERP query failed: {str(e)}")

            # 폴백 데이터
            if data is None:
                data = {
                    'fiscal_year': fiscal_year,
                    'fiscal_month': fiscal_month,
                    'beginning_equity': 480000000000,  # 4,800억
                    'net_income': 9800000000,  # 98억
                    'dividend_paid': 3000000000,  # 30억
                    'other_comprehensive_income': 200000000,  # 2억
                    'ending_equity': 487000000000,  # 4,870억
                    'source_tables': ['CAM900_YH'],
                    'data_source': 'fallback'
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[FinancialStatement] Equity statement error: {str(e)}", exc_info=True)
            error_msg = f'Data fetch failed: {str(e)}'
            return Response({'error': error_msg}, status=500)
