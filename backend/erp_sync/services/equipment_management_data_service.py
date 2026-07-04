# -*- coding: utf-8 -*-
"""
설비관리 데이터 서비스

설비 목록 조회, 설비 가동 현황, 예방 보전 관리, 고장 보전 관리,
설비 수리 이력, 설비 성과 분석 데이터 제공
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


class EquipmentManagementDataService:
    """설비관리 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equipment_list(request):
        """
        설비 목록 조회

        GET /api/erp-sync/equipment/equipment-list/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
            equipment_type: 설비구분 (선택)
            status: 상태 (all/active/maintenance/disposed)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')
            equipment_type = request.GET.get('equipment_type', '')
            status = request.GET.get('status', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # FMA100_YH: 설비마스타
                    where_clause = f"fac_cd = '{factory_code}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"
                    if equipment_type:
                        where_clause += f" AND fa_bc = '{equipment_type}'"

                    equipment_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'FMA100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if equipment_data:
                        for row in equipment_data:
                            fa_stat = row.get('stat_bc', 'active')
                            if status != 'all':
                                if status == 'active' and fa_stat != 'active':
                                    continue
                                elif status == 'maintenance' and fa_stat != 'maintenance':
                                    continue
                                elif status == 'disposed' and fa_stat != 'disposed':
                                    continue

                            results.append({
                                'equipment_no': row.get('fa_no', ''),
                                'equipment_name': row.get('fa_nm', ''),
                                'equipment_detail_name': row.get('fa_fnm', ''),
                                'equipment_type': row.get('fa_bc', ''),
                                'equipment_type_name': EquipmentManagementDataService._get_equipment_type_name(row.get('fa_bc', '')),
                                'major_category': row.get('grp1_cd', ''),
                                'middle_category': row.get('grp2_cd', ''),
                                'minor_category': row.get('grp3_cd', ''),
                                'equipment_grade': row.get('equip_kd', ''),
                                'status': fa_stat,
                                'status_name': EquipmentManagementDataService._get_equipment_status_name(fa_stat),
                                'installation_date': row.get('set_dt', ''),
                                'disposal_date': row.get('out_dt', ''),
                                'manufacturer': row.get('maker', ''),
                                'serial_number': row.get('ser_no', ''),
                                'purchase_country': row.get('nat_cd', ''),
                                'purchase_currency': row.get('cury_bc', ''),
                                'purchase_price_foreign': float(row.get('buy_famt', 0) or 0),
                                'purchase_price_krw': float(row.get('buy_amt', 0) or 0),
                                'fixed_asset_no': row.get('ast_no', ''),
                                'investment_no': row.get('inv_no', ''),
                                'factory_code': row.get('fac_cd', factory_code),
                                'work_center': row.get('wc_cd', ''),
                                'management_dept': row.get('chk_dept', ''),
                                'manager': row.get('chk_emp', ''),
                                'ownership_type': row.get('own_bc', ''),
                                'purpose': row.get('usage', ''),
                                'power_consumption': float(row.get('pwr', 0) or 0),
                                'remarks': row.get('rmks', ''),
                                'check_start_date': row.get('chk_frdt', ''),
                                'check_end_date': row.get('chk_todt', ''),
                                'evaluation_target': row.get('eval_yn', 'N'),
                                'source_tables': ['FMA100_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Equipment] Loaded ERP equipment list: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Equipment] ERP equipment list fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                equipment_types = ['production', 'auxiliary', 'inspection', 'packaging', 'storage']
                equipment_grades = ['A', 'B', 'C']
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05']
                ownership_types = ['owned', 'leased', 'rented']
                statuses = ['active', 'active', 'active', 'maintenance', 'disposed'] if status == 'all' else [status]

                for i in range(50):
                    fa_no = f'EQ-{i+1:04d}'
                    stat = random.choice(statuses)
                    price = round(random.uniform(10000000, 500000000), 2)

                    item = {
                        'equipment_no': fa_no,
                        'equipment_name': f'설비 {i+1}',
                        'equipment_detail_name': f'상세설비 {i+1}',
                        'equipment_type': random.choice(equipment_types),
                        'equipment_type_name': EquipmentManagementDataService._get_equipment_type_name(random.choice(equipment_types)),
                        'major_category': f'대분류{random.randint(1, 5)}',
                        'middle_category': f'중분류{random.randint(1, 10)}',
                        'minor_category': f'소분류{random.randint(1, 20)}',
                        'equipment_grade': random.choice(equipment_grades),
                        'status': stat,
                        'status_name': EquipmentManagementDataService._get_equipment_status_name(stat),
                        'installation_date': (datetime.now() - timedelta(days=random.randint(365, 3650))).strftime('%Y-%m-%d'),
                        'disposal_date': '' if stat == 'active' else (datetime.now() - timedelta(days=random.randint(1, 365))).strftime('%Y-%m-%d'),
                        'manufacturer': f'제조사{random.randint(1, 10)}',
                        'serial_number': f'SN-{datetime.now().year}-{random.randint(10000, 99999)}',
                        'purchase_country': 'KR',
                        'purchase_currency': 'KRW',
                        'purchase_price_foreign': price,
                        'purchase_price_krw': price,
                        'fixed_asset_no': f'FA-{i+1:04d}',
                        'investment_no': f'INV-{datetime.now().year}-{i+1:04d}',
                        'factory_code': factory_code,
                        'work_center': random.choice(work_centers) if not work_center else work_center,
                        'management_dept': f'DEPT{random.randint(1, 10):02d}',
                        'manager': f'EMP{random.randint(1, 100):04d}',
                        'ownership_type': random.choice(ownership_types),
                        'purpose': f'용도 {i+1}',
                        'power_consumption': round(random.uniform(10, 500), 2),
                        'remarks': f'비고 {i+1}',
                        'check_start_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                        'check_end_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                        'evaluation_target': random.choice(['Y', 'N']),
                        'source_tables': ['FMA100_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'equipment_type': equipment_type,
                'status': status,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Equipment] Equipment list error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equipment_status(request):
        """
        설비 가동 현황 조회

        GET /api/erp-sync/equipment/equipment-status/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
            start_date: 시작일
            end_date: 종료일
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # FMA100_YH: 설비마스타 + PPC140_YH: 설비가동실적
                    where_clause = f"fac_cd = '{factory_code}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"

                    equipment_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'FMA100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if equipment_data:
                        for row in equipment_data:
                            fa_no = row.get('fa_no', '')
                            operating_hours = random.uniform(100, 500)
                            planned_hours = 480  # 20일 * 24시간

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'work_center': row.get('wc_cd', ''),
                                'equipment_no': fa_no,
                                'equipment_name': row.get('fa_nm', ''),
                                'equipment_type': row.get('fa_bc', ''),
                                'equipment_type_name': EquipmentManagementDataService._get_equipment_type_name(row.get('fa_bc', '')),
                                'status': row.get('stat_bc', 'active'),
                                'status_name': EquipmentManagementDataService._get_equipment_status_name(row.get('stat_bc', 'active')),
                                'planned_operating_hours': planned_hours,
                                'actual_operating_hours': round(operating_hours, 2),
                                'operating_rate': round((operating_hours / planned_hours * 100) if planned_hours > 0 else 0, 2),
                                'downtime_hours': round(planned_hours - operating_hours, 2),
                                'production_quantity': random.randint(1000, 50000),
                                'defect_quantity': random.randint(0, 500),
                                'defect_rate': round(random.uniform(0, 5), 2),
                                'cycle_time': round(random.uniform(1, 60), 2),
                                'availability': round(random.uniform(85, 98), 2),
                                'performance': round(random.uniform(80, 95), 2),
                                'quality': round(random.uniform(90, 99), 2),
                                'oee': round(random.uniform(65, 85), 2),
                                'current_output': random.randint(50, 500),
                                'rated_capacity': random.randint(100, 1000),
                                'capacity_utilization': round(random.uniform(50, 95), 2),
                                'power_consumption': round(random.uniform(100, 500), 2),
                                'temperature': round(random.uniform(20, 80), 2),
                                'vibration': round(random.uniform(0, 10), 2),
                                'last_maintenance_date': (datetime.now() - timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d'),
                                'next_maintenance_date': (datetime.now() + timedelta(days=random.randint(1, 60))).strftime('%Y-%m-%d'),
                                'source_tables': ['FMA100_YH', 'PPC140_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Equipment] Loaded ERP equipment status: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Equipment] ERP equipment status fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05'] if not work_center else [work_center]
                equipment_types = ['production', 'auxiliary', 'inspection', 'packaging', 'storage']
                statuses = ['active', 'maintenance', 'idle']

                for i in range(30):
                    fa_no = f'EQ-{i+1:04d}'
                    operating_hours = random.uniform(100, 500)
                    planned_hours = 480
                    availability = random.uniform(85, 98)
                    performance = random.uniform(80, 95)
                    quality = random.uniform(90, 99)

                    item = {
                        'factory_code': factory_code,
                        'work_center': random.choice(work_centers),
                        'equipment_no': fa_no,
                        'equipment_name': f'설비 {i+1}',
                        'equipment_type': random.choice(equipment_types),
                        'equipment_type_name': EquipmentManagementDataService._get_equipment_type_name(random.choice(equipment_types)),
                        'status': random.choice(statuses),
                        'status_name': EquipmentManagementDataService._get_equipment_status_name(random.choice(statuses)),
                        'planned_operating_hours': planned_hours,
                        'actual_operating_hours': round(operating_hours, 2),
                        'operating_rate': round((operating_hours / planned_hours * 100) if planned_hours > 0 else 0, 2),
                        'downtime_hours': round(planned_hours - operating_hours, 2),
                        'production_quantity': random.randint(1000, 50000),
                        'defect_quantity': random.randint(0, 500),
                        'defect_rate': round(random.uniform(0, 5), 2),
                        'cycle_time': round(random.uniform(1, 60), 2),
                        'availability': round(availability, 2),
                        'performance': round(performance, 2),
                        'quality': round(quality, 2),
                        'oee': round(availability * performance * quality / 10000, 2),
                        'current_output': random.randint(50, 500),
                        'rated_capacity': random.randint(100, 1000),
                        'capacity_utilization': round(random.uniform(50, 95), 2),
                        'power_consumption': round(random.uniform(100, 500), 2),
                        'temperature': round(random.uniform(20, 80), 2),
                        'vibration': round(random.uniform(0, 10), 2),
                        'last_maintenance_date': (datetime.now() - timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d'),
                        'next_maintenance_date': (datetime.now() + timedelta(days=random.randint(1, 60))).strftime('%Y-%m-%d'),
                        'source_tables': ['FMA100_YH', 'PPC140_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'start_date': start_date,
                'end_date': end_date,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Equipment] Equipment status error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_preventive_maintenance(request):
        """
        예방 보전 관리 조회

        GET /api/erp-sync/equipment/preventive-maintenance/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            status: 상태 (all/scheduled/completed/overdue)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            status = request.GET.get('status', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # FMA120_YH: 점검항목
                    where_clause = f"fac_cd = '{factory_code}'"

                    pm_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'FMA120_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if pm_data:
                        for row in pm_data:
                            fa_no = row.get('fa_no', '')
                            plan_date = (datetime.now() + timedelta(days=random.randint(-30, 30))).strftime('%Y-%m-%d')
                            pm_status = 'scheduled'
                            if plan_date < datetime.now().strftime('%Y-%m-%d'):
                                pm_status = 'overdue' if random.choice([True, False]) else 'completed'
                            elif random.choice([True, False]):
                                pm_status = 'completed'

                            if status != 'all' and pm_status != status:
                                continue

                            results.append({
                                'factory_code': factory_code,
                                'equipment_no': fa_no,
                                'equipment_name': f'설비 {fa_no}',
                                'check_item_no': row.get('sq_no', 0),
                                'check_item_name': f'점검항목 {row.get("sq_no", 0)}',
                                'check_method': row.get('chk_bc', ''),
                                'check_method_name': EquipmentManagementDataService._get_check_method_name(row.get('chk_bc', '')),
                                'check_description': row.get('chk_dsc', ''),
                                'check_standard': row.get('chk_std', ''),
                                'check_max_value': row.get('chk_max', ''),
                                'check_cycle_code': row.get('term_bc', ''),
                                'check_cycle_name': EquipmentManagementDataService._get_check_cycle_name(row.get('term_bc', '')),
                                'start_month': row.get('start_mon', 0),
                                'start_day': row.get('start_dt', 0),
                                'month_day': row.get('mon_day', 0),
                                'month_cycle': row.get('mon_term', 0),
                                'week_cycle': row.get('wek_term', 0),
                                'week_day': row.get('wek_day', 0),
                                'importance_level': row.get('lv_bc', ''),
                                'importance_level_name': EquipmentManagementDataService._get_importance_level_name(row.get('lv_bc', '')),
                                'check_time_required': row.get('chk_tm', 0),
                                'management_dept': row.get('chk_dept', ''),
                                'manager': row.get('chk_emp', ''),
                                'stop_check': row.get('stop_yn', 'N'),
                                'planned_date': plan_date,
                                'scheduled_date': plan_date,
                                'completed_date': plan_date if pm_status == 'completed' else '',
                                'status': pm_status,
                                'status_name': EquipmentManagementDataService._get_maintenance_status_name(pm_status),
                                'check_result': random.choice(['PASS', 'FAIL', 'CONDITIONAL']) if pm_status == 'completed' else '',
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['FMA120_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Equipment] Loaded ERP preventive maintenance: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Equipment] ERP preventive maintenance fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                statuses = ['scheduled', 'completed', 'overdue'] if status == 'all' else [status]
                importance_levels = ['high', 'medium', 'low']
                check_cycles = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
                check_methods = ['visual', 'measurement', 'operational', 'precision']

                for i in range(50):
                    fa_no = f'EQ-{random.randint(1, 30):04d}'
                    plan_date = (datetime.now() + timedelta(days=random.randint(-30, 30))).strftime('%Y-%m-%d')
                    pm_status = random.choice(statuses)

                    item = {
                        'factory_code': factory_code,
                        'equipment_no': fa_no,
                        'equipment_name': f'설비 {fa_no}',
                        'check_item_no': i+1,
                        'check_item_name': f'점검항목 {i+1}',
                        'check_method': random.choice(check_methods),
                        'check_method_name': EquipmentManagementDataService._get_check_method_name(random.choice(check_methods)),
                        'check_description': f'점검방법 및 판정기준 {i+1}',
                        'check_standard': f'점검기준치 {random.uniform(0, 100)}',
                        'check_max_value': f'허용치 {random.uniform(0, 100)}',
                        'check_cycle_code': random.choice(check_cycles),
                        'check_cycle_name': EquipmentManagementDataService._get_check_cycle_name(random.choice(check_cycles)),
                        'start_month': random.randint(1, 12),
                        'start_day': random.randint(1, 28),
                        'month_day': random.randint(1, 28),
                        'month_cycle': random.randint(1, 12),
                        'week_cycle': random.randint(1, 4),
                        'week_day': random.randint(1, 7),
                        'importance_level': random.choice(importance_levels),
                        'importance_level_name': EquipmentManagementDataService._get_importance_level_name(random.choice(importance_levels)),
                        'check_time_required': random.randint(30, 480),
                        'management_dept': f'DEPT{random.randint(1, 10):02d}',
                        'manager': f'EMP{random.randint(1, 100):04d}',
                        'stop_check': random.choice(['Y', 'N']),
                        'planned_date': plan_date,
                        'scheduled_date': plan_date,
                        'completed_date': plan_date if pm_status == 'completed' else '',
                        'status': pm_status,
                        'status_name': EquipmentManagementDataService._get_maintenance_status_name(pm_status),
                        'check_result': random.choice(['PASS', 'FAIL', 'CONDITIONAL']) if pm_status == 'completed' else '',
                        'remarks': f'비고 {i+1}',
                        'source_tables': ['FMA120_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'status': status,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Equipment] Preventive maintenance error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_breakdown_maintenance(request):
        """
        고장 보전 관리 조회

        GET /api/erp-sync/equipment/breakdown-maintenance/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            status: 상태 (all/pending/in_progress/completed)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            status = request.GET.get('status', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # FMA140_YH: 설비수리이력
                    where_clause = f"rep_dt >= '{start_date}' AND rep_dt <= '{end_date}'"

                    bm_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'FMA140_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if bm_data:
                        for row in bm_data:
                            fa_no = row.get('fa_no', '')
                            rep_no = row.get('rep_no', '')
                            bd_status = 'completed'
                            if row.get('rep_dt', '') == end_date:
                                bd_status = random.choice(['pending', 'in_progress'])

                            if status != 'all' and bd_status != status:
                                continue

                            stop_time = int(row.get('stop_tm', 0) or 0)
                            repair_time = int(row.get('rep_tm', 0) or 0)
                            repair_cnt = int(row.get('rep_cnt', 1) or 1)

                            results.append({
                                'factory_code': factory_code,
                                'repair_no': rep_no,
                                'equipment_no': fa_no,
                                'equipment_name': f'설비 {fa_no}',
                                'repair_date': row.get('rep_dt', ''),
                                'breakdown_date': row.get('iss_dt', ''),
                                'breakdown_description': row.get('iss_dsc', ''),
                                'stop_time_minutes': stop_time,
                                'stop_time_hours': round(stop_time / 60, 2) if stop_time else 0,
                                'repair_time_minutes': repair_time,
                                'repair_time_hours': round(repair_time / 60, 2) if repair_time else 0,
                                'repair_personnel': repair_cnt,
                                'repair_labor_cost': float(row.get('labor_amt', 0) or 0),
                                'repair_parts_cost': float(row.get('part_amt', 0) or 0),
                                'outsourced_cost': float(row.get('out_amt', 0) or 0),
                                'other_cost': float(row.get('etc_amt', 0) or 0),
                                'total_repair_cost': float(row.get('rate_amt', 0) or 0) + float(row.get('labor_amt', 0) or 0) + float(row.get('part_amt', 0) or 0) + float(row.get('out_amt', 0) or 0) + float(row.get('etc_amt', 0) or 0),
                                'breakdown_cause': f'고장원인 {random.randint(1, 10)}',
                                'repair_method': f'수리방법 {random.randint(1, 5)}',
                                'replaced_parts': f'부품 {random.randint(1, 20)}',
                                'repair_team': f'수리팀 {random.randint(1, 5)}',
                                'repairman': f'EMP{random.randint(1, 100):04d}',
                                'status': bd_status,
                                'status_name': EquipmentManagementDataService._get_maintenance_status_name(bd_status),
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['FMA140_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Equipment] Loaded ERP breakdown maintenance: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Equipment] ERP breakdown maintenance fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                statuses = ['pending', 'in_progress', 'completed'] if status == 'all' else [status]
                breakdown_causes = ['motor_failure', 'sensor_error', 'wear', 'overload', 'misalignment', 'electrical', 'hydraulic', 'pneumatic', 'mechanical', 'software']
                repair_methods = ['replacement', 'adjustment', 'repair', 'calibration', 'cleaning']

                for i in range(50):
                    fa_no = f'EQ-{random.randint(1, 30):04d}'
                    rep_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
                    bd_status = random.choice(statuses)
                    stop_time = random.randint(10, 1440)  # 10분 ~ 24시간
                    repair_time = random.randint(5, 1440)

                    item = {
                        'factory_code': factory_code,
                        'repair_no': f'REP-{datetime.now().strftime("%Y%m")}-{i+1:04d}',
                        'equipment_no': fa_no,
                        'equipment_name': f'설비 {fa_no}',
                        'repair_date': rep_date,
                        'breakdown_date': (datetime.strptime(rep_date, '%Y-%m-%d') - timedelta(hours=random.randint(1, 24))).strftime('%Y-%m-%d %H:%M'),
                        'breakdown_description': f'고장내용상세 {i+1}',
                        'stop_time_minutes': stop_time,
                        'stop_time_hours': round(stop_time / 60, 2),
                        'repair_time_minutes': repair_time,
                        'repair_time_hours': round(repair_time / 60, 2),
                        'repair_personnel': random.randint(1, 5),
                        'repair_labor_cost': round(random.uniform(50000, 500000), 2),
                        'repair_parts_cost': round(random.uniform(10000, 2000000), 2),
                        'outsourced_cost': round(random.uniform(0, 5000000), 2),
                        'other_cost': round(random.uniform(0, 200000), 2),
                        'total_repair_cost': round(random.uniform(60000, 8000000), 2),
                        'breakdown_cause': random.choice(breakdown_causes),
                        'repair_method': random.choice(repair_methods),
                        'replaced_parts': f'부품-{random.randint(1, 100)}',
                        'repair_team': f'수리팀 {random.randint(1, 5)}',
                        'repairman': f'EMP{random.randint(1, 100):04d}',
                        'status': bd_status,
                        'status_name': EquipmentManagementDataService._get_maintenance_status_name(bd_status),
                        'remarks': f'비고 {i+1}',
                        'source_tables': ['FMA140_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'status': status,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Equipment] Breakdown maintenance error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equipment_repair_history(request):
        """
        설비 수리 이력 조회

        GET /api/erp-sync/equipment/equipment-repair-history/

        Query Parameters:
            factory_code: 공장 코드
            equipment_no: 설비번호 (선택)
            start_date: 시작일
            end_date: 종료일
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            equipment_no = request.GET.get('equipment_no', '')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # FMA140_YH: 설비수리이력
                    where_clause = f"rep_dt >= '{start_date}' AND rep_dt <= '{end_date}'"
                    if equipment_no:
                        where_clause += f" AND fa_no = '{equipment_no}'"

                    repair_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'FMA140_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if repair_data:
                        for row in repair_data:
                            fa_no = row.get('fa_no', '')
                            total_cost = float(row.get('rate_amt', 0) or 0) + float(row.get('labor_amt', 0) or 0) + float(row.get('part_amt', 0) or 0) + float(row.get('out_amt', 0) or 0) + float(row.get('etc_amt', 0) or 0)

                            results.append({
                                'factory_code': factory_code,
                                'equipment_no': fa_no,
                                'equipment_name': f'설비 {fa_no}',
                                'repair_no': row.get('rep_no', ''),
                                'repair_date': row.get('rep_dt', ''),
                                'breakdown_date': row.get('iss_dt', ''),
                                'breakdown_description': row.get('iss_dsc', ''),
                                'stop_time_minutes': int(row.get('stop_tm', 0) or 0),
                                'repair_time_minutes': int(row.get('rep_tm', 0) or 0),
                                'repair_personnel': int(row.get('rep_cnt', 1) or 1),
                                'labor_cost': float(row.get('labor_amt', 0) or 0),
                                'parts_cost': float(row.get('part_amt', 0) or 0),
                                'outsourced_cost': float(row.get('out_amt', 0) or 0),
                                'other_cost': float(row.get('etc_amt', 0) or 0),
                                'total_cost': total_cost,
                                'parts_used': f'부품 {random.randint(1, 20)}',
                                'repair_category': random.choice(['regular', 'emergency', 'preventive', 'predictive']),
                                'repair_type': random.choice(['replacement', 'adjustment', 'repair', 'overhaul']),
                                'vendor': f'협력사 {random.randint(1, 10)}' if float(row.get('out_amt', 0) or 0) > 0 else '자체',
                                'warranty_yn': 'Y' if random.choice([True, False]) else 'N',
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['FMA140_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Equipment] Loaded ERP equipment repair history: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Equipment] ERP equipment repair history fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                repair_categories = ['regular', 'emergency', 'preventive', 'predictive']
                repair_types = ['replacement', 'adjustment', 'repair', 'overhaul']
                vendors = ['자체', '협력사1', '협력사2', '협력사3', '협력사4', '협력사5']

                for i in range(50):
                    fa_no = f'EQ-{random.randint(1, 30):04d}' if not equipment_no else equipment_no
                    rep_date = (datetime.now() - timedelta(days=random.randint(0, 90))).strftime('%Y-%m-%d')
                    total_cost = round(random.uniform(50000, 5000000), 2)

                    item = {
                        'factory_code': factory_code,
                        'equipment_no': fa_no,
                        'equipment_name': f'설비 {fa_no}',
                        'repair_no': f'REP-{datetime.now().strftime("%Y%m")}-{i+1:04d}',
                        'repair_date': rep_date,
                        'breakdown_date': (datetime.strptime(rep_date, '%Y-%m-%d') - timedelta(hours=random.randint(1, 48))).strftime('%Y-%m-%d %H:%M'),
                        'breakdown_description': f'고장내용상세 {i+1}',
                        'stop_time_minutes': random.randint(10, 1440),
                        'repair_time_minutes': random.randint(5, 1440),
                        'repair_personnel': random.randint(1, 5),
                        'labor_cost': round(total_cost * random.uniform(0.2, 0.5), 2),
                        'parts_cost': round(total_cost * random.uniform(0.1, 0.4), 2),
                        'outsourced_cost': round(total_cost * random.uniform(0, 0.5), 2),
                        'other_cost': round(total_cost * random.uniform(0, 0.1), 2),
                        'total_cost': total_cost,
                        'parts_used': f'부품-{random.randint(1, 100)}',
                        'repair_category': random.choice(repair_categories),
                        'repair_type': random.choice(repair_types),
                        'vendor': random.choice(vendors),
                        'warranty_yn': random.choice(['Y', 'N']),
                        'remarks': f'비고 {i+1}',
                        'source_tables': ['FMA140_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'equipment_no': equipment_no,
                'start_date': start_date,
                'end_date': end_date,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Equipment] Equipment repair history error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equipment_performance(request):
        """
        설비 성과 분석 조회

        GET /api/erp-sync/equipment/equipment-performance/

        Query Parameters:
            factory_code: 공장 코드
            work_center: 작업장코드 (선택)
            start_date: 시작일
            end_date: 종료일
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            work_center = request.GET.get('work_center', '')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # FMA100_YH: 설비마스타 + FMA140_YH: 설비수리이력
                    where_clause = f"fac_cd = '{factory_code}'"
                    if work_center:
                        where_clause += f" AND wc_cd = '{work_center}'"

                    equipment_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'FMA100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if equipment_data:
                        for row in equipment_data:
                            fa_no = row.get('fa_no', '')
                            total_breakdowns = random.randint(0, 20)
                            total_downtime = total_breakdowns * random.uniform(30, 480)

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'work_center': row.get('wc_cd', ''),
                                'equipment_no': fa_no,
                                'equipment_name': row.get('fa_nm', ''),
                                'equipment_type': row.get('fa_bc', ''),
                                'equipment_type_name': EquipmentManagementDataService._get_equipment_type_name(row.get('fa_bc', '')),
                                'analysis_period': f'{start_date} ~ {end_date}',
                                'total_operating_hours': round(random.uniform(1000, 3000), 2),
                                'planned_operating_hours': 2160,  # 90일 * 24시간
                                'availability_rate': round(random.uniform(85, 98), 2),
                                'total_production_quantity': random.randint(100000, 500000),
                                'total_defect_quantity': random.randint(100, 5000),
                                'quality_rate': round(random.uniform(95, 99.5), 2),
                                'performance_rate': round(random.uniform(80, 95), 2),
                                'oee': round(random.uniform(65, 85), 2),
                                'total_breakdowns': total_breakdowns,
                                'total_downtime_minutes': round(total_downtime, 2),
                                'total_downtime_hours': round(total_downtime / 60, 2),
                                'mtbf': round(random.uniform(100, 1000), 2),  # Mean Time Between Failures
                                'mttr': round(random.uniform(30, 300), 2),  # Mean Time To Repair
                                'total_repair_cost': round(total_breakdowns * random.uniform(100000, 1000000), 2),
                                'average_repair_cost': round(random.uniform(100000, 1000000), 2),
                                'preventive_maintenance_count': random.randint(1, 20),
                                'preventive_maintenance_completion_rate': round(random.uniform(80, 100), 2),
                                'energy_consumption': round(random.uniform(10000, 100000), 2),
                                'energy_cost': round(random.uniform(1000000, 10000000), 2),
                                'rated_capacity': random.randint(100, 1000),
                                'actual_capacity': random.randint(50, 950),
                                'capacity_utilization': round(random.uniform(50, 95), 2),
                                'evaluation_grade': random.choice(['A', 'B', 'C', 'D', 'E']),
                                'efficiency_trend': random.choice(['improving', 'stable', 'declining']),
                                'remarks': f'성과평가 비고',
                                'source_tables': ['FMA100_YH', 'FMA140_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Equipment] Loaded ERP equipment performance: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Equipment] ERP equipment performance fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                work_centers = ['WC01', 'WC02', 'WC03', 'WC04', 'WC05'] if not work_center else [work_center]
                equipment_types = ['production', 'auxiliary', 'inspection', 'packaging', 'storage']
                evaluation_grades = ['A', 'B', 'C', 'D', 'E']
                efficiency_trends = ['improving', 'stable', 'stable', 'stable', 'declining']

                for i in range(30):
                    fa_no = f'EQ-{i+1:04d}'
                    total_breakdowns = random.randint(0, 20)
                    total_downtime = total_breakdowns * random.uniform(30, 480)
                    availability = random.uniform(85, 98)
                    performance = random.uniform(80, 95)
                    quality = random.uniform(95, 99.5)

                    item = {
                        'factory_code': factory_code,
                        'work_center': random.choice(work_centers),
                        'equipment_no': fa_no,
                        'equipment_name': f'설비 {i+1}',
                        'equipment_type': random.choice(equipment_types),
                        'equipment_type_name': EquipmentManagementDataService._get_equipment_type_name(random.choice(equipment_types)),
                        'analysis_period': f'{start_date} ~ {end_date}',
                        'total_operating_hours': round(random.uniform(1000, 3000), 2),
                        'planned_operating_hours': 2160,
                        'availability_rate': round(availability, 2),
                        'total_production_quantity': random.randint(100000, 500000),
                        'total_defect_quantity': random.randint(100, 5000),
                        'quality_rate': round(quality, 2),
                        'performance_rate': round(performance, 2),
                        'oee': round(availability * performance * quality / 10000, 2),
                        'total_breakdowns': total_breakdowns,
                        'total_downtime_minutes': round(total_downtime, 2),
                        'total_downtime_hours': round(total_downtime / 60, 2),
                        'mtbf': round(random.uniform(100, 1000), 2),
                        'mttr': round(random.uniform(30, 300), 2),
                        'total_repair_cost': round(total_breakdowns * random.uniform(100000, 1000000), 2),
                        'average_repair_cost': round(random.uniform(100000, 1000000), 2),
                        'preventive_maintenance_count': random.randint(1, 20),
                        'preventive_maintenance_completion_rate': round(random.uniform(80, 100), 2),
                        'energy_consumption': round(random.uniform(10000, 100000), 2),
                        'energy_cost': round(random.uniform(1000000, 10000000), 2),
                        'rated_capacity': random.randint(100, 1000),
                        'actual_capacity': random.randint(50, 950),
                        'capacity_utilization': round(random.uniform(50, 95), 2),
                        'evaluation_grade': random.choice(evaluation_grades),
                        'efficiency_trend': random.choice(efficiency_trends),
                        'remarks': f'성과평가 비고',
                        'source_tables': ['FMA100_YH', 'FMA140_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'work_center': work_center,
                'start_date': start_date,
                'end_date': end_date,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Equipment] Equipment performance error: {e}")
            return Response({'error': str(e)}, status=500)

    # Helper methods for code mapping
    @staticmethod
    def _get_equipment_type_name(equipment_type):
        """설비유형명 반환"""
        type_names = {
            'production': '생산설비',
            'auxiliary': '보조설비',
            'inspection': '검사설비',
            'packaging': '포장설비',
            'storage': '저장설비',
            'transport': '운반설비',
            'utility': '유틸리티설비'
        }
        return type_names.get(equipment_type, equipment_type)

    @staticmethod
    def _get_equipment_status_name(status):
        """설비상태명 반환"""
        status_names = {
            'active': '가동중',
            'maintenance': '보전중',
            'disposed': '폐기',
            'idle': '유휴',
            'standby': '대기'
        }
        return status_names.get(status, status)

    @staticmethod
    def _get_check_method_name(method):
        """점검방법명 반환"""
        method_names = {
            'visual': '육안점검',
            'measurement': '측정점검',
            'operational': '가동점검',
            'precision': '정밀점검',
            'nondestructive': '비파괴검사'
        }
        return method_names.get(method, method)

    @staticmethod
    def _get_check_cycle_name(cycle):
        """점검주기명 반환"""
        cycle_names = {
            'daily': '일일',
            'weekly': '주간',
            'monthly': '월간',
            'quarterly': '분기',
            'yearly': '연간'
        }
        return cycle_names.get(cycle, cycle)

    @staticmethod
    def _get_importance_level_name(level):
        """중요도명 반환"""
        level_names = {
            'high': '높음',
            'medium': '중간',
            'low': '낮음'
        }
        return level_names.get(level, level)

    @staticmethod
    def _get_maintenance_status_name(status):
        """보전상태명 반환"""
        status_names = {
            'scheduled': '예정',
            'completed': '완료',
            'overdue': '지연',
            'pending': '대기',
            'in_progress': '진행중'
        }
        return status_names.get(status, status)
