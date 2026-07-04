# -*- coding: utf-8 -*-
"""
제조관리 데이터 서비스

생산계획 관리, 작업지시 관리, 생산실적 관리, 공정 관리,
라우팅 관리, 작업장 관리 데이터 제공
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime, timedelta
import logging
import random

from erp_sync.models import ERPSource
from erp_sync.services.dashboard_data_service import DataSyncService

logger = logging.getLogger(__name__)


class ManufacturingManagementDataService:
    """제조관리 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_production_plan(request):
        """
        생산계획 관리 조회

        GET /api/erp-sync/manufacturing/production-plan/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            item_code: 품목코드 (선택)
            plan_status: 계획상태 (all/pending/in_progress/completed)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            item_code = request.GET.get('item_code', '')
            plan_status = request.GET.get('plan_status', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPD100_YH: 일생산계획
                    where_clause = f"plan_fac = '{factory_code}'"
                    where_clause += f" AND fr_dt >= '{start_date}' AND to_dt <= '{end_date}'"
                    if item_code:
                        where_clause += f" AND itm_id = '{item_code}'"

                    plan_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPD100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if plan_data:
                        for row in plan_data:
                            status = 'pending'
                            if row.get('fr_dt', '') <= datetime.now().strftime('%Y-%m-%d') <= row.get('to_dt', ''):
                                status = 'in_progress'
                            elif row.get('to_dt', '') < datetime.now().strftime('%Y-%m-%d'):
                                status = 'completed'

                            if plan_status != 'all' and status != plan_status:
                                continue

                            plan_qty = float(row.get('plan_qty', 0) or 0)
                            results.append({
                                'factory_code': row.get('plan_fac', factory_code),
                                'plan_no': row.get('plan_no', ''),
                                'plan_seq': row.get('plan_sq', 0),
                                'plan_date': row.get('fr_dt', ''),
                                'start_date': row.get('fr_dt', ''),
                                'end_date': row.get('to_dt', ''),
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f'품목 {row.get("itm_id", "")}',
                                'planned_quantity': plan_qty,
                                'request_no': row.get('req_no', ''),
                                'request_seq': row.get('req_sq', 0),
                                'priority': random.choice(['high', 'normal', 'low']),
                                'status': status,
                                'status_name': ManufacturingManagementDataService._get_plan_status_name(status),
                                'progress_rate': round(random.uniform(0, 100), 2) if status != 'pending' else 0,
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['PPD100_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Manufacturing] Loaded ERP production plan: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Manufacturing] ERP production plan fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                plan_statuses = ['pending', 'in_progress', 'completed'] if plan_status == 'all' else [plan_status]
                items = ['ITEM-001', 'ITEM-002', 'ITEM-003', 'ITEM-004', 'ITEM-005'] if not item_code else [item_code]
                priorities = ['high', 'normal', 'low']

                for i in range(50):
                    itm_code = random.choice(items)
                    start_dt = (datetime.now() + timedelta(days=random.randint(-30, 30))).strftime('%Y-%m-%d')
                    end_dt = (datetime.strptime(start_dt, '%Y-%m-%d') + timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d')
                    plan_qty = random.randint(100, 5000)

                    status_calc = 'pending'
                    if start_dt <= datetime.now().strftime('%Y-%m-%d') <= end_dt:
                        status_calc = 'in_progress'
                    elif end_dt < datetime.now().strftime('%Y-%m-%d'):
                        status_calc = 'completed'

                    status = random.choice(plan_statuses) if plan_status == 'all' else plan_status
                    if plan_status != 'all':
                        status_calc = status

                    item = {
                        'factory_code': factory_code,
                        'plan_no': f'PLAN-{datetime.now().strftime("%Y%m")}-{i+1:04d}',
                        'plan_seq': i+1,
                        'plan_date': start_dt,
                        'start_date': start_dt,
                        'end_date': end_dt,
                        'item_code': itm_code,
                        'item_name': f'품목 {itm_code}',
                        'planned_quantity': plan_qty,
                        'request_no': f'REQ-{i+1:04d}',
                        'request_seq': i+1,
                        'priority': random.choice(priorities),
                        'status': status,
                        'status_name': ManufacturingManagementDataService._get_plan_status_name(status),
                        'progress_rate': round(random.uniform(0, 100), 2) if status != 'pending' else 0,
                        'remarks': f'비고 {i+1}',
                        'source_tables': ['PPD100_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'item_code': item_code,
                'plan_status': plan_status,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Manufacturing] Production plan error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_work_order(request):
        """
        작업지시 관리 조회

        GET /api/erp-sync/manufacturing/work-order/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
            start_date: 시작일
            end_date: 종료일
            order_status: 지시상태 (all/pending/in_progress/completed)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            order_status = request.GET.get('order_status', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPB200_YH: 작업지시
                    where_clause = f"fac_cd = '{factory_code}' AND wo_dt >= '{start_date}' AND wo_dt <= '{end_date}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"

                    work_order_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB200_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if work_order_data:
                        for row in work_order_data:
                            stat_bc = row.get('stat_bc', '')
                            status = ManufacturingManagementDataService._convert_work_order_status(stat_bc)

                            if order_status != 'all' and status != order_status:
                                continue

                            wo_qty = float(row.get('wo_qty', 0) or 0)

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'work_center': row.get('wc_cd', ''),
                                'process_code': row.get('prc_cd', ''),
                                'process_name': f'공정 {row.get("prc_cd", "")}',
                                'equipment_code': row.get('mc_cd', ''),
                                'work_order_no': row.get('wo_no', ''),
                                'work_order_date': row.get('wo_dt', ''),
                                'work_order_seq': row.get('wo_sq', 0),
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f'품목 {row.get("itm_id", "")}',
                                'planned_quantity': wo_qty,
                                'day_night_type': row.get('dn_bc', ''),
                                'day_night_name': ManufacturingManagementDataService._get_day_night_name(row.get('dn_bc', '')),
                                'emergency_yn': row.get('emr_yn', 'N'),
                                'input_type': row.get('ent_bc', ''),
                                'start_time': row.get('fr_tm', ''),
                                'end_time': row.get('to_tm', ''),
                                'status': status,
                                'status_name': ManufacturingManagementDataService._get_work_order_status_name(status),
                                'completed_quantity': round(wo_qty * random.uniform(0, 1), 2) if status != 'pending' else 0,
                                'defect_quantity': round(wo_qty * random.uniform(0, 0.05), 2),
                                'progress_rate': round(random.uniform(0, 100), 2),
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['PPB200_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Manufacturing] Loaded ERP work order: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Manufacturing] ERP work order fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05'] if not work_center else [work_center]
                process_codes = ['PRC01', 'PRC02', 'PRC03', 'PRC04', 'PRC05']
                day_night_types = ['DAY', 'NIGHT']
                order_statuses = ['pending', 'in_progress', 'completed'] if order_status == 'all' else [order_status]
                items = ['ITEM-001', 'ITEM-002', 'ITEM-003', 'ITEM-004', 'ITEM-005']

                for i in range(50):
                    wo_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
                    wo_qty = random.randint(100, 3000)
                    status = random.choice(order_statuses) if order_status == 'all' else order_status

                    item = {
                        'factory_code': factory_code,
                        'work_center': random.choice(work_centers),
                        'process_code': random.choice(process_codes),
                        'process_name': f'공정 {random.choice(process_codes)}',
                        'equipment_code': f'EQ-{random.randint(1, 20):02d}',
                        'work_order_no': f'WO-{datetime.now().strftime("%Y%m%d")}-{i+1:04d}',
                        'work_order_date': wo_date,
                        'work_order_seq': i+1,
                        'item_code': random.choice(items),
                        'item_name': f'품목 {random.choice(items)}',
                        'planned_quantity': wo_qty,
                        'day_night_type': random.choice(day_night_types),
                        'day_night_name': ManufacturingManagementDataService._get_day_night_name(random.choice(day_night_types)),
                        'emergency_yn': random.choice(['Y', 'N']),
                        'input_type': random.choice(['M', 'S', 'A']),
                        'start_time': f'{random.randint(8, 16)}:00',
                        'end_time': f'{random.randint(17, 24)}:00',
                        'status': status,
                        'status_name': ManufacturingManagementDataService._get_work_order_status_name(status),
                        'completed_quantity': round(wo_qty * random.uniform(0, 1), 2) if status != 'pending' else 0,
                        'defect_quantity': round(wo_qty * random.uniform(0, 0.05), 2),
                        'progress_rate': round(random.uniform(0, 100), 2),
                        'remarks': f'비고 {i+1}',
                        'source_tables': ['PPB200_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'start_date': start_date,
                'end_date': end_date,
                'order_status': order_status,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Manufacturing] Work order error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_production_result(request):
        """
        생산실적 관리 조회

        GET /api/erp-sync/manufacturing/production-result/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
            start_date: 시작일
            end_date: 종료일
            item_code: 품목코드 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            item_code = request.GET.get('item_code', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPC100_YH: 생산실적
                    where_clause = f"fac_cd = '{factory_code}' AND work_dt >= '{start_date}' AND work_dt <= '{end_date}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"
                    if item_code:
                        where_clause += f" AND itm_id = '{item_code}'"

                    result_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPC100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if result_data:
                        for row in result_data:
                            good_qty = float(row.get('good_qty', 0) or 0)
                            bad_qty = float(row.get('bad_qty', 0) or 0)
                            brk_qty = float(row.get('brk_qty', 0) or 0)
                            total_qty = good_qty + bad_qty + brk_qty

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'work_center': row.get('wc_cd', ''),
                                'process_code': row.get('prc_cd', ''),
                                'equipment_code': row.get('mc_cd', ''),
                                'production_no': row.get('pw_no', ''),
                                'work_date': row.get('work_dt', ''),
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f'품목 {row.get("itm_id", "")}',
                                'management_no': row.get('mng_no', ''),
                                'good_quantity': good_qty,
                                'defect_quantity': bad_qty,
                                'broken_quantity': brk_qty,
                                'total_quantity': total_qty,
                                'inspection_request': float(row.get('req_qty', 0) or 0),
                                'repair_waiting': float(row.get('rep_qty', 0) or 0),
                                'defect_disposal': float(row.get('out_qty', 0) or 0),
                                'pack_quantity': float(row.get('pack_qty', 0) or 0),
                                'good_site_quantity': float(row.get('good2_qty', 0) or 0),
                                'pack_remain': float(row.get('each_qty', 0) or 0),
                                'defect_site_quantity': float(row.get('bad2_qty', 0) or 0),
                                'good_judgment': float(row.get('good3_qty', 0) or 0),
                                'modification_judgment': float(row.get('mod3_qty', 0) or 0),
                                'disposal_judgment': float(row.get('out3_qty', 0) or 0),
                                'modification_after': float(row.get('mod4_qty', 0) or 0),
                                'disposal_after': float(row.get('out4_qty', 0) or 0),
                                'day_night_type': row.get('dn_bc', ''),
                                'day_night_name': ManufacturingManagementDataService._get_day_night_name(row.get('dn_bc', '')),
                                'yield_rate': round((good_qty / total_qty * 100) if total_qty > 0 else 0, 2),
                                'defect_rate': round((bad_qty / total_qty * 100) if total_qty > 0 else 0, 2),
                                'source_tables': ['PPC100_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Manufacturing] Loaded ERP production result: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Manufacturing] ERP production result fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05'] if not work_center else [work_center]
                process_codes = ['PRC01', 'PRC02', 'PRC03', 'PRC04', 'PRC05']
                day_night_types = ['DAY', 'NIGHT']
                items = ['ITEM-001', 'ITEM-002', 'ITEM-003', 'ITEM-004', 'ITEM-005'] if not item_code else [item_code]

                for i in range(50):
                    work_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
                    good_qty = random.randint(100, 3000)
                    bad_qty = random.randint(0, 100)
                    brk_qty = random.randint(0, 20)
                    total_qty = good_qty + bad_qty + brk_qty

                    item = {
                        'factory_code': factory_code,
                        'work_center': random.choice(work_centers),
                        'process_code': random.choice(process_codes),
                        'equipment_code': f'EQ-{random.randint(1, 20):02d}',
                        'production_no': f'PW-{datetime.now().strftime("%Y%m%d")}-{i+1:04d}',
                        'work_date': work_date,
                        'item_code': random.choice(items),
                        'item_name': f'품목 {random.choice(items)}',
                        'management_no': f'MNG-{i+1:04d}',
                        'good_quantity': good_qty,
                        'defect_quantity': bad_qty,
                        'broken_quantity': brk_qty,
                        'total_quantity': total_qty,
                        'inspection_request': random.randint(0, 50),
                        'repair_waiting': random.randint(0, 20),
                        'defect_disposal': random.randint(0, 10),
                        'pack_quantity': random.randint(0, 100),
                        'good_site_quantity': random.randint(0, 200),
                        'pack_remain': random.randint(0, 50),
                        'defect_site_quantity': random.randint(0, 20),
                        'good_judgment': random.randint(0, 150),
                        'modification_judgment': random.randint(0, 10),
                        'disposal_judgment': random.randint(0, 5),
                        'modification_after': random.randint(0, 8),
                        'disposal_after': random.randint(0, 3),
                        'day_night_type': random.choice(day_night_types),
                        'day_night_name': ManufacturingManagementDataService._get_day_night_name(random.choice(day_night_types)),
                        'yield_rate': round((good_qty / total_qty * 100) if total_qty > 0 else 0, 2),
                        'defect_rate': round((bad_qty / total_qty * 100) if total_qty > 0 else 0, 2),
                        'source_tables': ['PPC100_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'start_date': start_date,
                'end_date': end_date,
                'item_code': item_code,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Manufacturing] Production result error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_process_management(request):
        """
        공정 관리 조회

        GET /api/erp-sync/manufacturing/process-management/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
            process_code: 공정코드 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')
            process_code = request.GET.get('process_code', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPB150_YH: 생산지시(공정정보)
                    where_clause = f"fac_cd = '{factory_code}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"
                    if process_code:
                        where_clause += f" AND prc_cd = '{process_code}'"

                    process_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB150_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if process_data:
                        process_dict = {}
                        for row in process_data:
                            prc_cd = row.get('prc_cd', '')
                            if prc_cd not in process_dict:
                                process_dict[prc_cd] = {
                                    'factory_code': row.get('fac_cd', factory_code),
                                    'work_center': row.get('wc_cd', ''),
                                    'process_code': prc_cd,
                                    'process_name': f'공정 {prc_cd}',
                                    'description': f'{prc_cd} 공정 설명',
                                    'capacity': random.randint(100, 1000),
                                    'current_load': random.randint(50, 95),
                                    'cycle_time': round(random.uniform(1, 60), 2),
                                    'setup_time': round(random.uniform(5, 60), 2),
                                    'standard_manpower': random.randint(1, 10),
                                    'equipment_count': random.randint(1, 20),
                                    'status': 'active',
                                    'work_orders': []
                                }

                            stat_cd = row.get('stat_cd', '')
                            process_dict[prc_cd]['work_orders'].append({
                                'work_order_no': row.get('wo_no', ''),
                                'work_order_seq': row.get('wo_sq', 0),
                                'expected_date': row.get('fr_dt', ''),
                                'equipment_code': row.get('mc_cd', ''),
                                'wip_quantity': float(row.get('prc_qty', 0) or 0),
                                'stock_quantity': float(row.get('stk_qty', 0) or 0),
                                'defect_quantity': float(row.get('bad_qty', 0) or 0),
                                'completed_output': float(row.get('out_end_qty', 0) or 0),
                                'input_reported': row.get('ent_yn', 'N'),
                                'result_reported': row.get('end_yn', 'N'),
                                'day_night_type': row.get('dn_ty', ''),
                                'status_code': stat_cd,
                                'status_name': ManufacturingManagementDataService._get_process_status_name(stat_cd),
                                'remarks': row.get('rmks', '')
                            })

                        results = list(process_dict.values())
                        logger.info(f"[Manufacturing] Loaded ERP process management: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Manufacturing] ERP process management fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05'] if not work_center else [work_center]
                process_codes = ['PRC01', 'PRC02', 'PRC03', 'PRC04', 'PRC05', 'PRC06', 'PRC07', 'PRC08'] if not process_code else [process_code]
                process_statuses = ['active', 'active', 'maintenance', 'idle']

                for i, prc_cd in enumerate(process_codes):
                    work_orders = []
                    for j in range(random.randint(3, 10)):
                        stat_cd = random.choice(['pending', 'in_progress', 'completed', 'on_hold'])
                        work_orders.append({
                            'work_order_no': f'WO-{i+1}-{j+1:04d}',
                            'work_order_seq': j+1,
                            'expected_date': (datetime.now() + timedelta(days=random.randint(-5, 10))).strftime('%Y-%m-%d'),
                            'equipment_code': f'EQ-{random.randint(1, 20):02d}',
                            'wip_quantity': random.randint(100, 2000),
                            'stock_quantity': random.randint(50, 500),
                            'defect_quantity': random.randint(0, 100),
                            'completed_output': random.randint(0, 1500),
                            'input_reported': random.choice(['Y', 'N']),
                            'result_reported': random.choice(['Y', 'N']),
                            'day_night_type': random.choice(['DAY', 'NIGHT']),
                            'status_code': stat_cd,
                            'status_name': ManufacturingManagementDataService._get_process_status_name(stat_cd),
                            'remarks': f'비고 {j+1}'
                        })

                    item = {
                        'factory_code': factory_code,
                        'work_center': random.choice(work_centers),
                        'process_code': prc_cd,
                        'process_name': f'공정 {prc_cd}',
                        'description': f'{prc_cd} 공정 설명',
                        'capacity': random.randint(100, 1000),
                        'current_load': random.randint(50, 95),
                        'cycle_time': round(random.uniform(1, 60), 2),
                        'setup_time': round(random.uniform(5, 60), 2),
                        'standard_manpower': random.randint(1, 10),
                        'equipment_count': random.randint(1, 20),
                        'status': random.choice(process_statuses),
                        'work_orders': work_orders
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'process_code': process_code,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Manufacturing] Process management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_routing_management(request):
        """
        라우팅 관리 조회

        GET /api/erp-sync/manufacturing/routing-management/

        Query Parameters:
            factory_code: 공장 코드
            item_code: 품목코드 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            item_code = request.GET.get('item_code', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # DMB100_YH: BOM (생산공정 포함)
                    where_clause = f"fac_cd = '{factory_code}'"
                    if item_code:
                        where_clause += f" AND itm_id = '{item_code}'"

                    routing_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'DMB100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if routing_data:
                        routing_dict = {}
                        for row in routing_data:
                            itm_id = row.get('itm_id', '')
                            if itm_id not in routing_dict:
                                routing_dict[itm_id] = {
                                    'factory_code': factory_code,
                                    'item_code': str(itm_id),
                                    'item_name': f'품목 {itm_id}',
                                    'routing_code': f'RT-{itm_id}',
                                    'routing_name': f'품목 {itm_id} 라우팅',
                                    'version': f'V{random.randint(1, 5)}.{random.randint(0, 10)}',
                                    'status': 'active',
                                    'effective_date': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d'),
                                    'processes': []
                                }

                            routing_dict[itm_id]['processes'].append({
                                'sequence': row.get('out_sq', 0),
                                'process_code': row.get('prc_cd', ''),
                                'process_name': f'공정 {row.get("prc_cd", "")}',
                                'work_center': row.get('wc_cd', ''),
                                'equipment_code': row.get('mc_cd', ''),
                                'operation': f'작업 {row.get("out_sq", 0)}',
                                'standard_time': round(random.uniform(1, 120), 2),
                                'setup_time': round(random.uniform(5, 60), 2),
                                'cycle_time': round(random.uniform(0.5, 60), 2),
                                'standard_manpower': random.randint(1, 5),
                                'description': f'{row.get("prc_cd", "")} 공정 작업 설명',
                                'next_process_code': f'PRC{random.randint(1, 10):02d}' if random.choice([True, False]) else '',
                                'inspection_required': random.choice(['Y', 'N']),
                                'remarks': row.get('rmks', '')
                            })

                        results = list(routing_dict.values())
                        logger.info(f"[Manufacturing] Loaded ERP routing management: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Manufacturing] ERP routing management fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                items = ['ITEM-001', 'ITEM-002', 'ITEM-003', 'ITEM-004', 'ITEM-005'] if not item_code else [item_code]
                process_codes = ['PRC01', 'PRC02', 'PRC03', 'PRC04', 'PRC05', 'PRC06', 'PRC07', 'PRC08']
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05']

                for i, itm_code in enumerate(items):
                    processes = []
                    for j in range(random.randint(3, 8)):
                        processes.append({
                            'sequence': j+1,
                            'process_code': process_codes[j % len(process_codes)],
                            'process_name': f'공정 {process_codes[j % len(process_codes)]}',
                            'work_center': random.choice(work_centers),
                            'equipment_code': f'EQ-{random.randint(1, 20):02d}',
                            'operation': f'작업 {j+1}',
                            'standard_time': round(random.uniform(1, 120), 2),
                            'setup_time': round(random.uniform(5, 60), 2),
                            'cycle_time': round(random.uniform(0.5, 60), 2),
                            'standard_manpower': random.randint(1, 5),
                            'description': f'공정 {j+1} 작업 설명',
                            'next_process_code': process_codes[(j+1) % len(process_codes)] if j < 7 else '',
                            'inspection_required': random.choice(['Y', 'N']),
                            'remarks': f'비고 {j+1}'
                        })

                    item = {
                        'factory_code': factory_code,
                        'item_code': itm_code,
                        'item_name': f'품목 {itm_code}',
                        'routing_code': f'RT-{itm_code}',
                        'routing_name': f'품목 {itm_code} 라우팅',
                        'version': f'V{random.randint(1, 5)}.{random.randint(0, 10)}',
                        'status': 'active',
                        'effective_date': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d'),
                        'processes': processes
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'item_code': item_code,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Manufacturing] Routing management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_work_center_management(request):
        """
        작업장 관리 조회

        GET /api/erp-sync/manufacturing/work-center-management/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPB150_YH: 생산지시(공정정보) - 작업장별 집계
                    where_clause = f"fac_cd = '{factory_code}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"

                    wc_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB150_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if wc_data:
                        wc_dict = {}
                        for row in wc_data:
                            wc_cd = row.get('wc_cd', '')
                            if wc_cd not in wc_dict:
                                wc_dict[wc_cd] = {
                                    'factory_code': row.get('fac_cd', factory_code),
                                    'work_center_code': wc_cd,
                                    'work_center_name': f'작업장 {wc_cd}',
                                    'description': f'{wc_cd} 작업장 설명',
                                    'location': f'위치 {random.randint(1, 10)}',
                                    'manager': f'담당자{random.randint(1, 10)}',
                                    'contact': f'02-1234-{random.randint(1000, 9999)}',
                                    'capacity': random.randint(100, 1000),
                                    'current_load': 0,
                                    'equipment_count': 0,
                                    'process_count': 0,
                                    'manpower': random.randint(10, 50),
                                    'status': 'active',
                                    'processes': {}
                                }

                            wc_dict[wc_cd]['equipment_count'] += 1
                            wc_dict[wc_cd]['current_load'] += float(row.get('prc_qty', 0) or 0)

                            prc_cd = row.get('prc_cd', '')
                            if prc_cd not in wc_dict[wc_cd]['processes']:
                                wc_dict[wc_cd]['processes'][prc_cd] = {
                                    'process_code': prc_cd,
                                    'process_name': f'공정 {prc_cd}',
                                    'equipment_count': 0
                                }
                                wc_dict[wc_cd]['process_count'] += 1

                            mc_cd = row.get('mc_cd', '')
                            if mc_cd:
                                wc_dict[wc_cd]['processes'][prc_cd]['equipment_count'] += 1

                        for wc_cd, wc_info in wc_dict.items():
                            wc_info['processes'] = list(wc_info['processes'].values())
                            wc_info['utilization_rate'] = round((wc_info['current_load'] / wc_info['capacity'] * 100) if wc_info['capacity'] > 0 else 0, 2)

                        results = list(wc_dict.values())
                        logger.info(f"[Manufacturing] Loaded ERP work center: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Manufacturing] ERP work center fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05', 'WC06', 'WC07', 'WC08'] if not work_center else [work_center]
                process_codes = ['PRC01', 'PRC02', 'PRC03', 'PRC04', 'PRC05']
                wc_statuses = ['active', 'active', 'active', 'maintenance', 'idle']

                for i, wc_cd in enumerate(work_centers):
                    processes = []
                    for j, prc_cd in enumerate(process_codes):
                        processes.append({
                            'process_code': prc_cd,
                            'process_name': f'공정 {prc_cd}',
                            'equipment_count': random.randint(1, 10)
                        })

                    capacity = random.randint(100, 1000)
                    current_load = random.randint(50, int(capacity * 0.95))

                    item = {
                        'factory_code': factory_code,
                        'work_center_code': wc_cd,
                        'work_center_name': f'작업장 {i+1}',
                        'description': f'{wc_cd} 작업장 설명',
                        'location': f'위청 {random.randint(1, 10)}',
                        'manager': f'담당자{random.randint(1, 10)}',
                        'contact': f'02-1234-{random.randint(1000, 9999)}',
                        'capacity': capacity,
                        'current_load': current_load,
                        'equipment_count': random.randint(5, 30),
                        'process_count': len(processes),
                        'manpower': random.randint(10, 50),
                        'status': random.choice(wc_statuses),
                        'utilization_rate': round((current_load / capacity * 100), 2),
                        'processes': processes
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Manufacturing] Work center management error: {e}")
            return Response({'error': str(e)}, status=500)

    # Helper methods for code mapping
    @staticmethod
    def _get_plan_status_name(status):
        """계획상태명 반환"""
        status_names = {
            'pending': '대기',
            'in_progress': '진행중',
            'completed': '완료'
        }
        return status_names.get(status, status)

    @staticmethod
    def _convert_work_order_status(stat_bc):
        """작업지시상태 변환"""
        status_map = {
            '1': 'pending',
            '2': 'in_progress',
            '3': 'completed',
            '9': 'cancelled'
        }
        return status_map.get(stat_bc, 'pending')

    @staticmethod
    def _get_work_order_status_name(status):
        """작업지시상태명 반환"""
        status_names = {
            'pending': '대기',
            'in_progress': '진행중',
            'completed': '완료',
            'cancelled': '취소'
        }
        return status_names.get(status, status)

    @staticmethod
    def _get_day_night_name(dn_bc):
        """주야구분명 반환"""
        dn_names = {
            'DAY': '주간',
            'NIGHT': '야간',
            'D': '주간',
            'N': '야간'
        }
        return dn_names.get(dn_bc, dn_bc)

    @staticmethod
    def _get_process_status_name(stat_cd):
        """공정상태명 반환"""
        status_names = {
            'pending': '대기',
            'in_progress': '진행중',
            'completed': '완료',
            'on_hold': '보류'
        }
        return status_names.get(stat_cd, stat_cd)
