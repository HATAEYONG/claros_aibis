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


def _closest_fy_fm_queryset(queryset, year, month):
    """
    요청한 (year, month)와 정확히 일치하는 행을 우선 찾고, 없으면 시간축이 가장 가까운
    행을 찾는다. 원격 YH DB가 과거 백업이라 "오늘" 요청이 그대로 안 맞을 수 있으므로,
    로컬에 증강된 시계열 중 가장 근접한 시점으로 자연스럽게 대체한다.
    """
    exact = queryset.filter(fiscal_year=year, fiscal_month=month)
    if exact.exists():
        return exact
    target_index = year * 12 + month
    best = None
    best_diff = None
    for row in queryset:
        idx = row.fiscal_year * 12 + row.fiscal_month
        diff = abs(idx - target_index)
        if best_diff is None or diff < best_diff:
            best, best_diff = row, diff
    return [best] if best else []


def _closest_date_queryset(queryset, target_date, date_field="production_date"):
    """단일 date 필드를 쓰는 모델에서 target_date와 가장 가까운 날짜의 행들을 반환"""
    exact = queryset.filter(**{date_field: target_date})
    if exact.exists():
        return exact
    all_dates = sorted(set(queryset.values_list(date_field, flat=True)))
    if not all_dates:
        return queryset.none()
    closest = min(all_dates, key=lambda d: abs((d - target_date).days))
    return queryset.filter(**{date_field: closest})


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

        YH 원격 DB(과거 백업, 읽기 전용, 현재 접속 불가)에는 더 이상 의존하지 않는다.
        로컬에 증강 생성된 reports.ExecutiveSummary 시계열에서 조회한다.
        """
        from reports.models import ExecutiveSummary

        try:
            period_type = request.GET.get('period_type', 'monthly')
            period_value = request.GET.get('period_value', datetime.now().strftime('%Y-%m'))
            year, month = int(period_value.split('-')[0]), int(period_value.split('-')[1])

            rows = _closest_fy_fm_queryset(ExecutiveSummary.objects.all(), year, month)
            row = rows[0] if rows else None

            if row is None:
                return Response({'error': '경영진단 요약 데이터가 없습니다.'}, status=404)

            data = {
                'period_type': period_type,
                'period_value': f"{row.fiscal_year}-{row.fiscal_month:02d}",
                'total_sales': int(row.revenue * 100_000_000),
                'total_profit': int(row.operating_profit * 100_000_000),
                'profit_margin': float(row.operating_margin),
                'total_orders': row.production_volume,
                'production_rate': 94.5,
                'quality_rate': float(row.quality_rate),
                'inventory_turnover': 4.2,
                'employee_count': row.employee_count,
                'safety_incidents': 0,
                'data_source': 'local_augmented',
            }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[Dashboard] Executive summary error: {str(e)}", exc_info=True)
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
        from sales.models import MonthlySales, TopCustomer

        try:
            date_str = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))
            year, month = int(date_str[:4]), int(date_str[5:7])

            rows = _closest_fy_fm_queryset(MonthlySales.objects.all(), year, month)
            monthly = rows[0] if rows else None

            if monthly is None:
                return Response({'error': '영업 데이터가 없습니다.'}, status=404)

            top_rows = _closest_fy_fm_queryset(TopCustomer.objects.all(), monthly.fiscal_year, monthly.fiscal_month)
            top_customers = [
                {'name': r.customer_name, 'amount': int(r.revenue)}
                for r in sorted(top_rows, key=lambda r: r.revenue, reverse=True)[:5]
            ]

            monthly_amount = float(monthly.actual_amount)
            data = {
                'date': date_str,
                'daily_sales': int(monthly_amount / 30),
                'monthly_sales': int(monthly_amount),
                'order_count': monthly.new_customers * 3 + 20,
                'delivery_count': int((monthly.new_customers * 3 + 20) * 0.93),
                'pending_orders': int((monthly.new_customers * 3 + 20) * 0.07),
                'top_customers': top_customers,
                'top_products': [],
                'vs_last_year': 8.5,
                'vs_target': float(monthly.achievement_rate),
                'data_source': 'local_augmented',
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
        from production.models import DailyProduction

        try:
            date_str = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))
            factory_code = request.GET.get('factory_code', 'FAC01')
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

            rows = list(_closest_date_queryset(
                DailyProduction.objects.select_related('production_line').all(),
                target_date, date_field='production_date'
            ))

            if not rows:
                return Response({'error': '생산 데이터가 없습니다.'}, status=404)

            total_plan = sum(r.target_quantity for r in rows)
            total_actual = sum(r.actual_quantity for r in rows)
            total_defect = sum(r.defect_quantity for r in rows)
            total_good = total_actual - total_defect
            total_downtime = sum(float(r.downtime_hours) for r in rows)

            yield_rate = (total_good / total_actual * 100) if total_actual > 0 else 0
            achievement_rate = (total_actual / total_plan * 100) if total_plan > 0 else 0

            lines = [
                {
                    'code': r.production_line.code,
                    'achievement': round((r.actual_quantity / r.target_quantity * 100) if r.target_quantity else 0, 1),
                }
                for r in rows
            ]

            data = {
                'date': date_str,
                'factory_code': factory_code,
                'plan_qty': int(total_plan),
                'production_qty': int(total_actual),
                'good_qty': int(total_good),
                'defect_qty': int(total_defect),
                'yield_rate': round(yield_rate, 1),
                'achievement_rate': round(achievement_rate, 1),
                'oee_rate': round(yield_rate * achievement_rate / 100, 1) if achievement_rate else 0,
                'downtime_minutes': int(total_downtime * 60),
                'manpower_count': 45,
                'lines': lines,
                'data_source': 'local_augmented',
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
        from quality.models import QualityInspection

        try:
            date_str = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

            rows = list(_closest_date_queryset(
                QualityInspection.objects.all(), target_date, date_field='inspection_date'
            ))

            if not rows:
                return Response({'error': '품질 검사 데이터가 없습니다.'}, status=404)

            inspect_count = sum(r.sample_size for r in rows)
            defect_count = sum(r.defect_count for r in rows)
            fail_count = sum(1 for r in rows if r.result != 'pass')
            pass_count = len(rows) - fail_count

            defect_by_type = {}
            for r in rows:
                if r.defect_count > 0:
                    defect_by_type[r.inspection_type] = defect_by_type.get(r.inspection_type, 0) + r.defect_count
            top_defects = [
                {'type': t, 'count': c}
                for t, c in sorted(defect_by_type.items(), key=lambda x: x[1], reverse=True)[:5]
            ]

            inspector_stats = {}
            for r in rows:
                stat = inspector_stats.setdefault(r.inspector, {'inspections': 0, 'pass': 0})
                stat['inspections'] += 1
                if r.result == 'pass':
                    stat['pass'] += 1
            inspector_performance = [
                {
                    'inspector': name,
                    'inspections': s['inspections'],
                    'pass_rate': round(s['pass'] / s['inspections'] * 100, 1) if s['inspections'] else 0,
                }
                for name, s in inspector_stats.items()
            ]

            # 검사 유형(공정)별 수율 - 재검사 이력을 별도로 추적하지 않아 FPY는 수율과 동일하게 근사
            type_labels = {
                'incoming': '수입검사', 'in_process': '공정검사',
                'final': '최종검사', 'outgoing': '출하검사',
            }
            type_stats = {}
            for r in rows:
                stat = type_stats.setdefault(r.inspection_type, {'total': 0, 'pass': 0})
                stat['total'] += 1
                if r.result == 'pass':
                    stat['pass'] += 1
            yield_by_process = [
                {
                    'process': type_labels.get(t, t),
                    'yield_rate': round(s['pass'] / s['total'] * 100, 1) if s['total'] else 0,
                    'fpy_rate': round(s['pass'] / s['total'] * 100, 1) if s['total'] else 0,
                }
                for t, s in type_stats.items()
            ]

            data = {
                'date': date_str,
                'inspect_count': inspect_count,
                'pass_count': pass_count,
                'fail_count': fail_count,
                'pass_rate': round(pass_count / len(rows) * 100, 2) if rows else 0,
                'defect_rate': round(defect_count / inspect_count * 100, 2) if inspect_count else 0,
                'rework_count': fail_count,
                'customer_claim_count': max(0, fail_count // 5),
                'top_defects': top_defects,
                'inspector_performance': inspector_performance,
                'yield_by_process': yield_by_process,
                'claim_cost': fail_count * 700000,
                'data_source': 'local_augmented',
            }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[Dashboard] Quality dashboard error: {str(e)}", exc_info=True)
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

        재고 마스터는 시계열이 아니라 현재 스냅샷 성격이라 asof_date와 무관하게
        로컬 purchase.Inventory 현황을 그대로 집계한다.
        """
        from purchase.models import Inventory

        try:
            asof_date = request.GET.get('asof_date', datetime.now().strftime('%Y-%m-%d'))

            items = list(Inventory.objects.all())
            if not items:
                return Response({'error': '재고 데이터가 없습니다.'}, status=404)

            total_stock_value = sum(float(i.stock_value) for i in items)
            by_category = {}
            for i in items:
                by_category[i.category] = by_category.get(i.category, 0) + float(i.stock_value)

            # 부진재고 상위 5개: 회전율이 낮을수록(재고일수가 길수록) 부진
            slow_moving_sorted = sorted(items, key=lambda i: float(i.turnover_rate))[:5]
            slow_moving_details = [
                {
                    'item_code': i.item_code,
                    'item_name': i.item_name,
                    'current_stock': i.current_stock,
                    'stock_value': int(float(i.stock_value)),
                    'turnover_rate': float(i.turnover_rate),
                    'days_of_supply': round(365 / float(i.turnover_rate), 0) if float(i.turnover_rate) > 0 else 999,
                }
                for i in slow_moving_sorted
            ]

            data = {
                'asof_date': asof_date,
                'total_items': len(items),
                'total_stock_qty': sum(i.current_stock for i in items),
                'total_stock_value': int(total_stock_value),
                'overstock_items': sum(1 for i in items if i.status == 'high'),
                'stockout_items': sum(1 for i in items if i.status == 'critical'),
                'slow_moving_items': sum(1 for i in items if i.status == 'low'),
                'avg_stock_days': round(
                    sum(float(i.turnover_rate) for i in items) / len(items), 1
                ) if items else 0,
                'incoming_count': 0,
                'outgoing_count': 0,
                'warehouses': [
                    {'code': cat, 'value': int(val)} for cat, val in by_category.items()
                ],
                'slow_moving_details': slow_moving_details,
                'data_source': 'local_augmented',
            }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[Dashboard] Inventory dashboard error: {str(e)}", exc_info=True)
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
