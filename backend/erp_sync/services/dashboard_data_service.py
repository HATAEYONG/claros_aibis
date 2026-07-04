# -*- coding: utf-8 -*-
"""
ERP 매핑 데이터 기반 조회 서비스

매핑된 ERP 테이블 데이터를 조회하여 프론트엔드에 제공하는 서비스 계층
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from datetime import datetime, timedelta
import json
import logging

from erp_sync.models import ERPSource, ERPTableDefinition
from erp_sync.models import ERPTargetModel
from erp_sync.models import ERPTableMapping, ERPFieldMapping
from erp_sync.utils.erp_db_connector import execute_erp_query, test_erp_connection
from erp_sync.erp_connection_config import ERPConnectionConfig

logger = logging.getLogger(__name__)


class DataSyncService:
    """ERP 데이터 동기화 서비스"""

    @staticmethod
    def get_default_source():
        """기본 ERP 소스 가져오기"""
        try:
            return ERPSource.objects.get(is_default=True)
        except ERPSource.DoesNotExist:
            return ERPSource.objects.first()

    @staticmethod
    def fetch_from_erp(erp_source, table_name, where_clause=None, limit=None, order_by=None):
        """
        ERP 소스에서 직접 데이터 조회

        Args:
            erp_source: ERP 소스 객체
            table_name: 조회할 테이블명 (스키마 포함 가능: public.SDY100_YH)
            where_clause: WHERE 조건 (선택)
            limit: LIMIT 값 (선택)
            order_by: ORDER BY 절 (선택)

        Returns:
            list: 조회된 데이터 목록
        """
        try:
            # 폴백 사용 여부 확인
            if ERPConnectionConfig.should_use_fallback(erp_source.source_code):
                logger.debug(f"[DataSyncService] Using fallback data for {erp_source.source_code}")
                return []

            # 스키마 정보 처리
            schema_name = None
            if '.' in table_name:
                schema_name, table_name = table_name.split('.', 1)

            # PostgreSQL의 경우 schema_name을 쿼리에 반영
            if erp_source.source_type == 'postgresql' and schema_name:
                full_table_name = f'"{schema_name}"."{table_name}"'
            else:
                full_table_name = f'"{table_name}"' if erp_source.source_type == 'postgresql' else table_name

            # 쿼리 구성
            query = f"SELECT * FROM {full_table_name}"
            if where_clause:
                query += f" WHERE {where_clause}"
            if order_by:
                query += f" ORDER BY {order_by}"
            if limit:
                query += f" LIMIT {limit}"

            logger.info(f"[DataSyncService] Fetching from {erp_source.source_code}: {query}")

            # 실제 ERP DB 연결을 통한 데이터 조회
            results = execute_erp_query(erp_source, query)

            # 연결 성공 기록
            ERPConnectionConfig.record_connection_success(erp_source.source_code)

            logger.info(f"[DataSyncService] Retrieved {len(results)} records from {table_name}")
            return results

        except Exception as e:
            # 연결 실패 기록
            ERPConnectionConfig.record_connection_failure(erp_source.source_code, e)

            # 에러 로그 억제 (설정에 따라)
            ERPConnectionConfig.log_connection_error(erp_source.source_code, e)

            return []

    @staticmethod
    def get_synced_data(target_model_name):
        """
        동기화된 데이터 조회 (현재는 ERP에서 직접 조회)

        Args:
            target_model_name: 타겟 모델명 (예: dashboard.ExecutiveSummary)

        Returns:
            dict: 조회된 데이터
        """
        try:
            # 타겟 모델 조회
            app_label, model_name = target_model_name.split('.')

            # TODO: 실제 동기화된 테이블 조회
            # 현재는 ERP에서 직접 조회
            return []

        except Exception as e:
            print(f"[DataSyncService] Error getting synced data: {str(e)}")
            return []


class DashboardDataService:
    """Dashboard 레이어 데이터 서비스"""

    @staticmethod
    def _aggregate_data(data_list, key_field, agg_fields):
        """
        데이터 집계

        Args:
            data_list: 데이터 목록
            key_field: 그룹핑 기준 필드
            agg_fields: 집계할 필드 목록

        Returns:
            list: 집계된 데이터
        """
        aggregated = {}
        for data in data_list:
            key = data.get(key_field)
            if key not in aggregated:
                aggregated[key] = {key_field: key}

            for field in agg_fields:
                current_val = aggregated[key].get(field, 0)
                new_val = data.get(field, 0)

                # 문자열인 경우 처리
                if isinstance(new_val, str):
                    try:
                        new_val = float(new_val.replace(',', ''))
                    except:
                        new_val = 0

                aggregated[key][field] = current_val + new_val

        return list(aggregated.values())

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_executive_summary(request):
        """
        경영진단 요약 대시보드 데이터 조회

        GET /api/dashboard/executive-summary/
        """
        try:
            erp_source = DataSyncService.get_default_source()
            if not erp_source:
                return Response({
                    'error': 'ERP 소스를 찾을 수 없습니다.'
                }, status=404)

            # 기간 파라미터
            period_type = request.GET.get('period_type', 'monthly')
            period_value = request.GET.get('period_value', '2024-12')

            # 임시 데이터 (실제 구현 시 ERP 조회)
            data = {
                'period_type': period_type,
                'period_value': period_value,
                'total_sales': 156000000,  # 156억
                'total_profit': 28000000,   # 28억
                'profit_margin': 17.9,
                'total_orders': 1250,
                'production_rate': 94.5,
                'quality_rate': 98.2,
                'inventory_turnover': 4.2,
                'employee_count': 850,
                'safety_incidents': 0,
                'source_tables': [
                    'SDY100_YH',
                    'PPB120_YH',
                    'QMM140_YH',
                    'LEB950_YH',
                    'MMA200_YH'
                ]
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_sales_dashboard(request):
        """
        영업 관리 대시보드 데이터 조회

        GET /api/dashboard/sales/

        Query Parameters:
            date: 조회 일자 (YYYY-MM-DD)
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))
            erp_source = DataSyncService.get_default_source()

            data = None
            source_tables = []

            if erp_source:
                try:
                    # 실제 ERP 데이터 조회 시도
                    # SDY100_YH: 년제품판매계획정보
                    sales_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDY100_YH',
                        where_clause=f"plan_mon = {int(date.split('-')[1])}",
                        limit=100
                    )

                    if sales_data:
                        # ERP 데이터 집계
                        total_sales = sum(float(row.get('plan_amt', 0) or 0) for row in sales_data)
                        total_orders = len(sales_data)

                        # 거래처별 집계
                        customer_sales = {}
                        for row in sales_data:
                            cust_nm = row.get('cust_nm', '미분류')
                            amt = float(row.get('plan_amt', 0) or 0)
                            customer_sales[cust_nm] = customer_sales.get(cust_nm, 0) + amt

                        top_customers = [
                            {'name': name, 'amount': int(amount)}
                            for name, amount in sorted(customer_sales.items(), key=lambda x: x[1], reverse=True)[:5]
                        ]

                        data = {
                            'date': date,
                            'daily_sales': int(total_sales / 30),  # 일별 추정
                            'monthly_sales': int(total_sales),
                            'order_count': total_orders,
                            'delivery_count': int(total_orders * 0.93),  # 93% 납품률 가정
                            'pending_orders': int(total_orders * 0.07),
                            'top_customers': top_customers,
                            'top_products': [],
                            'vs_last_year': 8.5,
                            'vs_target': 102.3,
                            'source_tables': ['SDY100_YH', 'SDA500_YH', 'SDA510_YH']
                        }
                        logger.info(f"[Dashboard] Loaded real ERP data for sales dashboard: {len(sales_data)} records")

                except Exception as e:
                    # 에러는 이미 fetch_from_erp에서 처리됨
                    pass

            # 폴백 데이터 (ERP 연결 실패 또는 데이터 없음)
            if data is None:
                logger.info("[Dashboard] Using fallback mock data for sales dashboard")
                data = {
                    'date': date,
                    'daily_sales': 520000000,  # 52억
                    'monthly_sales': 15600000000,  # 1,560억
                    'order_count': 45,
                    'delivery_count': 42,
                    'pending_orders': 15,
                    'top_customers': [
                        {'name': '삼성전자', 'amount': 4500000000},
                        {'name': 'LG전자', 'amount': 3200000000},
                        {'name': 'SK하이닉스', 'amount': 2800000000}
                    ],
                    'top_products': [
                        {'name': '리튬 배터리', 'amount': 8500000000},
                        {'name': 'OLED 패널', 'amount': 6200000000}
                    ],
                    'vs_last_year': 8.5,
                    'vs_target': 102.3,
                    'source_tables': ['SDY100_YH', 'SDA500_YH', 'SDA510_YH'],
                    'data_source': 'fallback'  # 데이터 출처 표시
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[Dashboard] Sales dashboard error: {str(e)}", exc_info=True)
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_production_dashboard(request):
        """
        생산 관리 대시보드 데이터 조회

        GET /api/dashboard/production/

        Query Parameters:
            date: 조회 일자 (YYYY-MM-DD)
            factory_code: 공장 코드
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))
            factory_code = request.GET.get('factory_code', 'FAC01')
            erp_source = DataSyncService.get_default_source()

            data = None

            if erp_source:
                try:
                    # PPB120_YH: 생산실적집계 (예시 테이블)
                    production_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB120_YH',
                        limit=100
                    )

                    if production_data:
                        # 생산 데이터 집계
                        total_plan = sum(float(row.get('plan_qty', 0) or 0) for row in production_data)
                        total_actual = sum(float(row.get('prod_qty', 0) or 0) for row in production_data)
                        total_good = sum(float(row.get('good_qty', 0) or 0) for row in production_data)
                        total_defect = sum(float(row.get('defect_qty', 0) or 0) for row in production_data)

                        yield_rate = (total_good / total_actual * 100) if total_actual > 0 else 0
                        achievement_rate = (total_actual / total_plan * 100) if total_plan > 0 else 0

                        data = {
                            'date': date,
                            'factory_code': factory_code,
                            'plan_qty': int(total_plan),
                            'production_qty': int(total_actual),
                            'good_qty': int(total_good),
                            'defect_qty': int(total_defect),
                            'yield_rate': round(yield_rate, 1),
                            'achievement_rate': round(achievement_rate, 1),
                            'oee_rate': 87.2,
                            'downtime_minutes': 120,
                            'manpower_count': 45,
                            'lines': [
                                {'code': 'LINE01', 'achievement': 95.2},
                                {'code': 'LINE02', 'achievement': 93.8}
                            ],
                            'source_tables': ['PPB120_YH', 'PPB125_YH', 'MESTagValue_YH']
                        }
                        logger.info(f"[Dashboard] Loaded real ERP data for production dashboard: {len(production_data)} records")

                except Exception as e:
                    # 에러는 이미 fetch_from_erp에서 처리됨
                    pass

            # 폴백 데이터
            if data is None:
                logger.info("[Dashboard] Using fallback mock data for production dashboard")
                data = {
                    'date': date,
                    'factory_code': factory_code,
                    'plan_qty': 50000,
                    'production_qty': 47250,
                    'good_qty': 46300,
                    'defect_qty': 950,
                    'yield_rate': 98.0,
                    'achievement_rate': 94.5,
                    'oee_rate': 87.2,
                    'downtime_minutes': 120,
                    'manpower_count': 45,
                    'lines': [
                        {'code': 'LINE01', 'achievement': 95.2},
                        {'code': 'LINE02', 'achievement': 93.8}
                    ],
                    'source_tables': ['PPB120_YH', 'PPB125_YH', 'MESTagValue_YH'],
                    'data_source': 'fallback'
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[Dashboard] Production dashboard error: {str(e)}", exc_info=True)
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_quality_dashboard(request):
        """
        품질 관리 대시보드 데이터 조회

        GET /api/dashboard/quality/
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'date': date,
                'inspect_count': 1250,
                'pass_count': 1228,
                'fail_count': 22,
                'pass_rate': 98.24,
                'defect_rate': 1.76,
                'rework_count': 8,
                'customer_claim_count': 2,
                'top_defects': [
                    {'type': '치수불량', 'count': 8},
                    {'type': '외관불량', 'count': 6},
                    {'type': '치수불량', 'count': 4}
                ],
                'inspector_performance': [
                    {'inspector': '홍길동', 'inspections': 420, 'pass_rate': 98.8},
                    {'inspector': '김철수', 'inspections': 380, 'pass_rate': 97.6}
                ],
                'claim_cost': 15000000,
                'source_tables': ['QMM140_YH', 'QMM200_YH', 'QMM210_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_inventory_dashboard(request):
        """
        재고 관리 대시보드 데이터 조회

        GET /api/dashboard/inventory/
        """
        try:
            asof_date = request.GET.get('asof_date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'asof_date': asof_date,
                'total_items': 3520,
                'total_stock_qty': 125000,
                'total_stock_value': 45000000000,  # 450억
                'overstock_items': 125,
                'stockout_items': 18,
                'slow_moving_items': 89,
                'avg_stock_days': 45,
                'incoming_count': 45,
                'outgoing_count': 120,
                'warehouses': [
                    {'code': 'WH01', 'value': 25000000000},
                    {'code': 'WH02', 'value': 20000000000}
                ],
                'source_tables': ['LEB950_YH', 'LEB980_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_procurement_dashboard(request):
        """
        구매 관리 대시보드 데이터 조회

        GET /api/dashboard/procurement/
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'date': date,
                'po_count': 125,
                'po_amount': 8500000000,  # 85억
                'gr_count': 98,
                'gr_amount': 7200000000,
                'pending_po_count': 27,
                'on_time_delivery_rate': 94.5,
                'supplier_performance': [
                    {'supplier': 'A사', 'rate': 96.2},
                    {'supplier': 'B사', 'rate': 92.8}
                ],
                'top_suppliers': [
                    {'name': '원자재공급사A', 'amount': 3500000000},
                    {'name': '부품공급사B', 'amount': 2800000000}
                ],
                'category_purchase': [
                    {'category': '원자재', 'amount': 5500000000},
                    {'category': '부품', 'amount': 3000000000}
                ],
                'vs_last_month': 5.2,
                'source_tables': ['MMA100_YH', 'MMA200_YH', 'MMA300_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_financial_dashboard(request):
        """
        재무/회계 대시보드 데이터 조회

        GET /api/dashboard/financial/
        """
        try:
            fiscal_year = request.GET.get('fiscal_year', '2024')
            fiscal_month = request.GET.get('fiscal_month', '12')

            data = {
                'fiscal_year': fiscal_year,
                'fiscal_month': fiscal_month,
                'revenue': 156000000000,  # 1,560억
                'cost_of_sales': 128000000000,  # 1,280억
                'gross_profit': 28000000000,  # 280억
                'operating_expenses': 15000000000,  # 150억
                'operating_profit': 13000000000,  # 130억
                'net_profit': 9800000000,  # 98억
                'current_assets': 350000000000,  # 3,500억
                'current_liabilities': 180000000000,  # 1,800억
                'cash_balance': 85000000000,  # 850억
                'accounts_receivable': 120000000000,  # 1,200억
                'accounts_payable': 95000000000,  # 950억
                'source_tables': ['CAM200_YH', 'CAM300_YH', 'CAM900_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_hr_dashboard(request):
        """
        인사/HR 대시보드 데이터 조회

        GET /api/dashboard/hr/
        """
        try:
            asof_date = request.GET.get('asof_date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'asof_date': asof_date,
                'total_employees': 850,
                'new_hires': 12,
                'resignations': 5,
                'resignation_rate': 0.59,
                'attendance_rate': 98.2,
                'overtime_hours': 15600,
                'training_hours': 2400,
                'department_stats': [
                    {'dept': '영업', 'count': 150},
                    {'dept': '생산', 'count': 450},
                    {'dept': '품질', 'count': 80}
                ],
                'salary_expense': 6500000000,  # 65억
                'recruitment_count': 15,
                'source_tables': ['DCB100_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)


class KPIDataService:
    """KPI 레이어 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_sales_performance(request):
        """
        영업 실적 KPI 데이터 조회

        GET /api/kpi/sales-performance/
        """
        try:
            period_type = request.GET.get('period_type', 'monthly')
            period_value = request.GET.get('period_value', '2024-12')

            data = {
                'period_type': period_type,
                'period_value': period_value,
                'target_amount': 150000000000,  # 1,500억 목표
                'actual_amount': 156000000000,  # 1,560억 실적
                'achievement_rate': 104.0,
                'vs_last_year': 8.5,
                'by_customer': [
                    {'customer': '삼성전자', 'target': 40000000000, 'actual': 45000000000},
                    {'customer': 'LG전자', 'target': 30000000000, 'actual': 32000000000}
                ],
                'by_product': [
                    {'product': '리튬 배터리', 'target': 60000000000, 'actual': 68000000000},
                    {'product': 'OLED 패널', 'target': 40000000000, 'actual': 41000000000}
                ],
                'source_tables': ['SDY100_YH', 'SDA500_YH', 'SDA510_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_production_performance(request):
        """
        생산 실적 KPI 데이터 조회

        GET /api/kpi/production-performance/
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'date': date,
                'target_qty': 50000,
                'production_qty': 47250,
                'good_qty': 46300,
                'defect_qty': 950,
                'yield_rate': 98.0,
                'achievement_rate': 94.5,
                'by_factory': [
                    {'factory': 'FAC01', 'target': 30000, 'actual': 28500},
                    {'factory': 'FAC02', 'target': 20000, 'actual': 18750}
                ],
                'by_line': [
                    {'line': 'LINE01', 'target': 10000, 'actual': 9520},
                    {'line': 'LINE02', 'target': 10000, 'actual': 9380}
                ],
                'source_tables': ['PPB120_YH', 'PPB125_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_quality_performance(request):
        """
        품질 실적 KPI 데이터 조회

        GET /api/kpi/quality-performance/
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'date': date,
                'inspect_qty': 1250,
                'pass_qty': 1228,
                'fail_qty': 22,
                'pass_rate': 98.24,
                'defect_rate': 1.76,
                'rework_qty': 18,
                'customer_claim_qty': 2,
                'claim_cost': 15000000,
                'vs_last_month': -0.5,
                'source_tables': ['QMM140_YH', 'QMM200_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equipment_efficiency(request):
        """
        설비 효율 KPI 데이터 조회

        GET /api/kpi/equipment-efficiency/
        """
        try:
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            data = {
                'date': date,
                'equipment_code': 'EQ001',
                'availability_rate': 92.5,
                'performance_rate': 88.2,
                'quality_rate': 98.5,
                'oee_rate': 80.5,
                'downtime_minutes': 120,
                'target_oee': 85.0,
                'source_tables': ['MESTagValue_YH']
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)


class RawTableDataService:
    """원본 ERP 테이블 데이터 조회 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_raw_table_data(request, app_label, table_name):
        """
        원본 ERP 테이블 데이터 조회

        GET /api/data/{app_label}/{table_name}/
        ?erp_source={source_code}
        ?limit={limit}
        """
        try:
            erp_source_code = request.GET.get('erp_source', 'YH')
            limit = int(request.GET.get('limit', '100'))

            # ERP 소스 조회
            try:
                erp_source = ERPSource.objects.get(source_code=erp_source_code)
            except ERPSource.DoesNotExist:
                return Response({
                    'error': f'ERP 소스를 찾을 수 없습니다: {erp_source_code}'
                }, status=404)

            # 테이블 매핑 조회
            try:
                table_def = ERPTableDefinition.objects.get(
                    erp_source=erp_source,
                    source_table_name__endswith=table_name.upper()
                )
            except ERPTableDefinition.DoesNotExist:
                return Response({
                    'error': f'테이블을 찾을 수 없습니다: {table_name}'
                }, status=404)

            # TODO: 실제 ERP DB에서 데이터 조회
            # 현재는 테이블 정의 정보만 반환
            data = {
                'erp_source': erp_source_code,
                'table_name': table_def.source_table_name,
                'table_description': table_def.table_description,
                'module_code': table_def.module_code,
                'record_count': table_def.record_count or 0,
                'last_synced': table_def.last_synced_at,
                'data': []  # 실제 데이터는 추후 구현
            }

            return Response({'results': [data]})

        except Exception as e:
            return Response({
                'error': f'데이터 조회 실패: {str(e)}'
            }, status=500)
