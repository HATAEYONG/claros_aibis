# -*- coding: utf-8 -*-
"""
영업관리 데이터 서비스

영업실적, 고객분석, 수주관리, 매출추이, 납품현황 데이터 제공
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime, timedelta
import logging

from erp_sync.models import ERPSource
from erp_sync.services.dashboard_data_service import DataSyncService

logger = logging.getLogger(__name__)


class SalesDataService:
    """영업관리 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_sales_performance(request):
        """
        영업실적 분석 데이터 조회

        GET /api/erp-sync/sales/sales-performance/

        Query Parameters:
            factory_code: 공장 코드
            year: 연도
            month: 월 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            year = request.GET.get('year', str(datetime.now().year))
            month = request.GET.get('month', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # SDY100_YH: 연간제품판매계획정보
                    where_clause = f"fac_cd = '{factory_code}' AND plan_year = '{year}'"
                    if month:
                        where_clause += f" AND plan_mon = '{month}'"

                    sales_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDY100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if sales_data:
                        # 고객별/제품별 집계
                        customer_summary = {}
                        for row in sales_data:
                            cust_cd = row.get('cust_cd', '')
                            cust_nm = row.get('cust_nm', '')
                            plan_qty = float(row.get('plan_qty', 0) or 0)
                            plan_mon = row.get('plan_mon', '')

                            key = f"{cust_cd}_{plan_mon}"
                            if key not in customer_summary:
                                customer_summary[key] = {
                                    'customer_code': cust_cd,
                                    'customer_name': cust_nm,
                                    'period': f"{year}-{plan_mon}" if plan_mon else year,
                                    'planned_qty': 0,
                                    'actual_qty': 0,
                                    'achievement_rate': 0,
                                }
                            customer_summary[key]['planned_qty'] += plan_qty

                        # 실적 데이터 매칭 (SDA500_YH, SDA510_YH)
                        where_clause_sales = f"bs_cd = '{factory_code}'"
                        if month:
                            where_clause_sales += f" AND SUBSTRING(dlv_dt, 1, 6) = '{year}{month}'"
                        else:
                            where_clause_sales += f" AND SUBSTRING(dlv_dt, 1, 4) = '{year}'"

                        actual_data = DataSyncService.fetch_from_erp(
                            erp_source,
                            'SDA510_YH',
                            where_clause=where_clause_sales,
                            limit=1000
                        )

                        actual_summary = {}
                        if actual_data:
                            for row in actual_data:
                                plan_no = row.get('plan_no', '')
                                out_qty = float(row.get('out_qty', 0) or 0)

                                if plan_no not in actual_summary:
                                    actual_summary[plan_no] = 0
                                actual_summary[plan_no] += out_qty

                        for key, data in customer_summary.items():
                            results.append({
                                **data,
                                'actual_qty': actual_summary.get(key, 0),
                                'achievement_rate': round((actual_summary.get(key, 0) / data['planned_qty'] * 100) if data['planned_qty'] > 0 else 0, 2),
                                'factory_code': factory_code,
                                'source_tables': ['SDY100_YH', 'SDA510_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Sales] Loaded ERP sales performance data: {len(results)} records")

                except Exception as e:
                    logger.warning(f"[Sales] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not results:
                # 월별 데이터 생성
                months = month if month else list(range(1, 13))
                if not isinstance(months, list):
                    months = [int(months)] if month else list(range(1, 13))

                import random
                for i, mon in enumerate(months[:12]):
                    base_plan = 1000000 + random.randint(-50000, 50000)
                    base_actual = base_plan * random.uniform(0.85, 1.05)

                    results.append({
                        'factory_code': factory_code,
                        'customer_code': f'CUST{i+1:03d}',
                        'customer_name': f'고객사 {i+1}',
                        'period': f"{year}-{str(mon).zfill(2)}",
                        'planned_qty': round(base_plan, 2),
                        'actual_qty': round(base_actual, 2),
                        'achievement_rate': round((base_actual / base_plan * 100), 2),
                        'source_tables': ['SDY100_YH', 'SDA510_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Sales] Sales performance error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_customer_analysis(request):
        """
        고객별 분석 데이터 조회

        GET /api/erp-sync/sales/customer-analysis/

        Query Parameters:
            factory_code: 공장 코드
            year: 연도
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            year = request.GET.get('year', str(datetime.now().year))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # SDA500_YH: 영업관련수주 (수주마스터)
                    where_clause = f"bs_cd = '{factory_code}' AND SUBSTRING(dlv_dt, 1, 4) = '{year}'"

                    order_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDA500_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if order_data:
                        customer_stats = {}
                        for row in order_data:
                            cust_cd = row.get('cust_cd', '')
                            plan_no = row.get('plan_no', '')
                            dlv_dt = row.get('dlv_dt', '')

                            if cust_cd not in customer_stats:
                                customer_stats[cust_cd] = {
                                    'customer_code': cust_cd,
                                    'customer_name': row.get('cust_nm', cust_cd),
                                    'total_orders': 0,
                                    'total_amount': 0,
                                    'on_time_delivery': 0,
                                    'late_delivery': 0,
                                    'factory_code': factory_code,
                                    'year': year,
                                }

                            customer_stats[cust_cd]['total_orders'] += 1

                        # 납품 실적 (SDA510_YH)
                        delivery_data = DataSyncService.fetch_from_erp(
                            erp_source,
                            'SDA510_YH',
                            where_clause=where_clause,
                            limit=1000
                        )

                        if delivery_data:
                            for row in delivery_data:
                                plan_no = row.get('plan_no', '')
                                out_qty = float(row.get('out_qty', 0) or 0)
                                qc_yn = row.get('qc_yn', 'N')

                                # 고객사별 실적 집계
                                for cust_cd, stats in customer_stats.items():
                                    stats['total_amount'] += out_qty
                                    if qc_yn == 'Y':
                                        stats['on_time_delivery'] += 1

                        results = list(customer_stats.values())

                        # 추가 지표 계산
                        for item in results:
                            item['on_time_delivery_rate'] = round((item['on_time_delivery'] / item['total_orders'] * 100) if item['total_orders'] > 0 else 0, 2)
                            item['source_tables'] = ['SDA500_YH', 'SDA510_YH']
                            item['data_source'] = 'erp'

                        logger.info(f"[Sales] Loaded ERP customer analysis data: {len(results)} records")

                except Exception as e:
                    logger.warning(f"[Sales] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not results:
                import random
                for i in range(1, 11):
                    total_orders = random.randint(10, 50)
                    on_time = int(total_orders * random.uniform(0.85, 0.98))

                    results.append({
                        'factory_code': factory_code,
                        'customer_code': f'CUST{i:03d}',
                        'customer_name': f'고객사 {i}',
                        'total_orders': total_orders,
                        'total_amount': round(random.uniform(100000, 5000000), 2),
                        'on_time_delivery': on_time,
                        'late_delivery': total_orders - on_time,
                        'on_time_delivery_rate': round((on_time / total_orders * 100), 2),
                        'year': year,
                        'source_tables': ['SDA500_YH', 'SDA510_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Sales] Customer analysis error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_order_management(request):
        """
        수주관리 데이터 조회

        GET /api/erp-sync/sales/order-management/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            status: 상태 (all/pending/completed)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', datetime.now().strftime('%Y-%m-01'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            status = request.GET.get('status', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # SDA500_YH: 영업관련수주 (수주마스터)
                    where_clause = f"bs_cd = '{factory_code}' AND dlv_dt >= '{start_date}' AND dlv_dt <= '{end_date}'"

                    order_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDA500_YH',
                        where_clause=where_clause,
                        limit=200
                    )

                    if order_data:
                        for row in order_data:
                            plan_no = row.get('plan_no', '')
                            cust_cd = row.get('cust_cd', '')
                            dlv_dt = row.get('dlv_dt', '')
                            rmks = row.get('rmks', '')

                            results.append({
                                'order_number': plan_no,
                                'customer_code': cust_cd,
                                'customer_name': row.get('cust_nm', cust_cd),
                                'delivery_date': dlv_dt,
                                'remarks': rmks,
                                'status': 'pending',  # 기본 상태
                                'factory_code': factory_code,
                                'source_tables': ['SDA500_YH'],
                                'data_source': 'erp'
                            })

                        # SDA510_YH: 수주상세로 상태 업데이트
                        detail_data = DataSyncService.fetch_from_erp(
                            erp_source,
                            'SDA510_YH',
                            where_clause=where_clause,
                            limit=500
                        )

                        if detail_data:
                            completed_orders = set()
                            for row in detail_data:
                                plan_no = row.get('plan_no', '')
                                out_qty = float(row.get('out_qty', 0) or 0)
                                rem_qty = float(row.get('rem_qty', 0) or 0)

                                if rem_qty <= 0 and out_qty > 0:
                                    completed_orders.add(plan_no)

                            for item in results:
                                if item['order_number'] in completed_orders:
                                    item['status'] = 'completed'

                        logger.info(f"[Sales] Loaded ERP order management data: {len(results)} records")

                except Exception as e:
                    logger.warning(f"[Sales] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not results:
                import random
                from datetime import timedelta

                for i in range(20):
                    order_date = datetime.strptime(start_date, '%Y-%m-%d') + timedelta(days=random.randint(0, 30))
                    is_completed = random.choice([True, False])

                    results.append({
                        'order_number': f'ORD-{datetime.now().year}-{i+1:04d}',
                        'customer_code': f'CUST{random.randint(1, 10):03d}',
                        'customer_name': f'고객사 {random.randint(1, 10)}',
                        'delivery_date': order_date.strftime('%Y-%m-%d'),
                        'remarks': f'주문 비고 {i+1}',
                        'status': 'completed' if is_completed else 'pending',
                        'factory_code': factory_code,
                        'source_tables': ['SDA500_YH'],
                        'data_source': 'fallback'
                    })

            # 필터링
            if status != 'all':
                results = [r for r in results if r['status'] == status]

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Sales] Order management error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_sales_trend(request):
        """
        매출추이 분석 데이터 조회

        GET /api/erp-sync/sales/sales-trend/

        Query Parameters:
            factory_code: 공장 코드
            year: 연도
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            year = request.GET.get('year', str(datetime.now().year))

            erp_source = DataSyncService.get_default_source()
            monthly_data = []

            if erp_source:
                try:
                    # SDY100_YH: 연간제품판매계획정보 (월별 계획)
                    where_clause = f"fac_cd = '{factory_code}' AND plan_year = '{year}'"

                    plan_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDY100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    # 월별 계획 집계
                    monthly_plan = {}
                    if plan_data:
                        for row in plan_data:
                            plan_mon = row.get('plan_mon', '')
                            plan_qty = float(row.get('plan_qty', 0) or 0)

                            if plan_mon:
                                month_key = int(plan_mon) if plan_mon.isdigit() else 0
                                if month_key not in monthly_plan:
                                    monthly_plan[month_key] = 0
                                monthly_plan[month_key] += plan_qty

                    # SDA510_YH: 월별 실적 집계
                    where_clause_sales = f"bs_cd = '{factory_code}' AND SUBSTRING(dlv_dt, 1, 4) = '{year}'"

                    actual_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDA510_YH',
                        where_clause=where_clause_sales,
                        limit=1000
                    )

                    monthly_actual = {}
                    if actual_data:
                        for row in actual_data:
                            dlv_dt = row.get('dlv_dt', '')
                            out_qty = float(row.get('out_qty', 0) or 0)

                            # 날짜에서 월 추출
                            if dlv_dt and len(dlv_dt) >= 7:
                                try:
                                    month_key = int(dlv_dt[4:6])
                                    if month_key not in monthly_actual:
                                        monthly_actual[month_key] = 0
                                    monthly_actual[month_key] += out_qty
                                except:
                                    pass

                    # 월별 데이터 생성
                    for month in range(1, 13):
                        planned = monthly_plan.get(month, 0)
                        actual = monthly_actual.get(month, 0)

                        monthly_data.append({
                            'factory_code': factory_code,
                            'year': year,
                            'month': month,
                            'period': f"{year}-{str(month).zfill(2)}",
                            'planned_amount': round(planned, 2),
                            'actual_amount': round(actual, 2),
                            'achievement_rate': round((actual / planned * 100) if planned > 0 else 0, 2),
                            'variance': round(actual - planned, 2),
                            'cumulative_actual': 0,
                            'cumulative_plan': 0,
                            'source_tables': ['SDY100_YH', 'SDA510_YH'],
                            'data_source': 'erp'
                        })

                    # 누계 계산
                    cumulative_actual = 0
                    cumulative_plan = 0
                    for item in monthly_data:
                        cumulative_actual += item['actual_amount']
                        cumulative_plan += item['planned_amount']
                        item['cumulative_actual'] = round(cumulative_actual, 2)
                        item['cumulative_plan'] = round(cumulative_plan, 2)

                    logger.info(f"[Sales] Loaded ERP sales trend data: {len(monthly_data)} records")

                except Exception as e:
                    logger.warning(f"[Sales] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not monthly_data:
                import random
                cumulative_actual = 0
                cumulative_plan = 0

                for month in range(1, 13):
                    base_plan = 100000 + random.randint(-10000, 20000)
                    base_actual = base_plan * random.uniform(0.88, 1.08)
                    cumulative_actual += base_actual
                    cumulative_plan += base_plan

                    monthly_data.append({
                        'factory_code': factory_code,
                        'year': year,
                        'month': month,
                        'period': f"{year}-{str(month).zfill(2)}",
                        'planned_amount': round(base_plan, 2),
                        'actual_amount': round(base_actual, 2),
                        'achievement_rate': round((base_actual / base_plan * 100), 2),
                        'variance': round(base_actual - base_plan, 2),
                        'cumulative_actual': round(cumulative_actual, 2),
                        'cumulative_plan': round(cumulative_plan, 2),
                        'source_tables': ['SDY100_YH', 'SDA510_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': monthly_data})

        except Exception as e:
            logger.error(f"[Sales] Sales trend error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_delivery_status(request):
        """
        납품현황 데이터 조회

        GET /api/erp-sync/sales/delivery-status/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', datetime.now().strftime('%Y-%m-01'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # SDA510_YH: 영업관련수주상세
                    where_clause = f"bs_cd = '{factory_code}'"

                    delivery_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'SDA510_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if delivery_data:
                        for row in delivery_data:
                            plan_no = row.get('plan_no', '')
                            itm_id = row.get('itm_id', 0)
                            plan_qty = float(row.get('plan_qty', 0) or 0)
                            out_qty = float(row.get('out_qty', 0) or 0)
                            rem_qty = float(row.get('rem_qty', 0) or 0)
                            qc_yn = row.get('qc_yn', 'N')

                            progress_rate = (out_qty / plan_qty * 100) if plan_qty > 0 else 0

                            results.append({
                                'order_number': plan_no,
                                'item_id': itm_id,
                                'planned_qty': round(plan_qty, 2),
                                'delivered_qty': round(out_qty, 2),
                                'remaining_qty': round(rem_qty, 2),
                                'progress_rate': round(progress_rate, 2),
                                'status': 'completed' if rem_qty <= 0 else 'in_progress',
                                'qc_completed': qc_yn == 'Y',
                                'factory_code': factory_code,
                                'source_tables': ['SDA510_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Sales] Loaded ERP delivery status data: {len(results)} records")

                except Exception as e:
                    logger.warning(f"[Sales] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not results:
                import random
                for i in range(30):
                    planned = random.randint(100, 5000)
                    delivered = random.randint(0, planned)
                    remaining = planned - delivered

                    results.append({
                        'order_number': f'ORD-{datetime.now().year}-{random.randint(1, 100):04d}',
                        'item_id': random.randint(1000, 9999),
                        'planned_qty': planned,
                        'delivered_qty': delivered,
                        'remaining_qty': remaining,
                        'progress_rate': round((delivered / planned * 100) if planned > 0 else 0, 2),
                        'status': 'completed' if remaining <= 0 else 'in_progress',
                        'qc_completed': random.choice([True, False]),
                        'factory_code': factory_code,
                        'source_tables': ['SDA510_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Sales] Delivery status error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)
