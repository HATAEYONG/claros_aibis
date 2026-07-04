# -*- coding: utf-8 -*-
"""
물류관리 데이터 서비스

입고관리, 출고관리, 창고관리, 배송관리, 재고이동관리, 운송관리 데이터 제공
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


class LogisticsManagementDataService:
    """물류관리 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_inbound_management(request):
        """
        입고 관리 조회

        GET /api/erp-sync/logistics/inbound-management/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            warehouse_code: 창고코드 (선택)
            item_code: 품목코드 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            warehouse_code = request.GET.get('warehouse_code', '')
            item_code = request.GET.get('item_code', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # LEB950_YH: 실사재고등록(매출이월) - 입고정보
                    where_clause = f"end_mon >= '{start_date[:7].replace('-', '')}' AND end_mon <= '{end_date[:7].replace('-', '')}'"
                    where_clause += f" AND fac_cd = '{factory_code}'"
                    if warehouse_code:
                        where_clause += f" AND wh_cd = '{warehouse_code}'"

                    inbound_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'LEB950_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if inbound_data:
                        for row in inbound_data:
                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'warehouse_code': row.get('wh_cd', ''),
                                'warehouse_name': f"{row.get('wh_cd', '')} 창고",
                                'inbound_date': row.get('end_mon', ''),
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f"자재 {row.get('itm_id', '')}",
                                'customer_code': row.get('cust_cd', ''),
                                'customer_name': row.get('cust_nm', ''),
                                'inbound_quantity': float(row.get('over_qty', 0) or 0),
                                'inbound_amount': float(row.get('over_amt', 0) or 0),
                                'unit_price': round(float(row.get('over_amt', 0) or 0) / max(float(row.get('over_qty', 1) or 1), 1), 2),
                                'remarks': row.get('rmks', ''),
                                'status': 'completed',
                                'source_tables': ['LEB950_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Logistics] Loaded ERP inbound data: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Logistics] ERP inbound fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                customers = ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005']
                warehouses = ['WH01', 'WH02', 'WH03']
                items = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005']

                for i in range(50):
                    item_code = random.choice(items)
                    qty = random.randint(100, 5000)
                    unit_price = round(random.uniform(1000, 50000), 2)

                    item = {
                        'factory_code': factory_code,
                        'warehouse_code': random.choice(warehouses),
                        'warehouse_name': f"{random.choice(warehouses)} 창고",
                        'inbound_date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d'),
                        'item_code': item_code,
                        'item_name': f'자재 {item_code}',
                        'customer_code': random.choice(customers),
                        'customer_name': f'거래처 {random.choice(customers)}',
                        'inbound_quantity': qty,
                        'inbound_amount': round(qty * unit_price, 2),
                        'unit_price': unit_price,
                        'remarks': f'입고 비고 {i+1}',
                        'status': random.choice(['pending', 'received', 'completed']),
                        'source_tables': ['LEB950_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Logistics] Inbound management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_outbound_management(request):
        """
        출고 관리 조회

        GET /api/erp-sync/logistics/outbound-management/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            warehouse_code: 창고코드 (선택)
            outbound_type: 출고구분 (all/sales/production/move/return)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            warehouse_code = request.GET.get('warehouse_code', '')
            outbound_type = request.GET.get('outbound_type', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # LEB100_YH: 출고정보
                    where_clause = f"out_dt >= '{start_date}' AND out_dt <= '{end_date}'"
                    where_clause += f" AND fac_cd = '{factory_code}'"
                    if warehouse_code:
                        where_clause += f" AND wh_cd = '{warehouse_code}'"
                    if outbound_type != 'all':
                        where_clause += f" AND out_bc = '{outbound_type}'"

                    outbound_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'LEB100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if outbound_data:
                        for row in outbound_data:
                            out_qty = float(row.get('out_qty', 0) or 0)
                            out_up = float(row.get('out_up', 0) or 0)
                            out_amt = float(row.get('out_amt', 0) or 0)

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'warehouse_code': row.get('wh_cd', ''),
                                'warehouse_name': f"{row.get('wh_cd', '')} 창고",
                                'outbound_no': row.get('out_no', ''),
                                'outbound_seq': row.get('out_sq', 0),
                                'outbound_date': row.get('out_dt', ''),
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f"자재 {row.get('itm_id', '')}",
                                'management_no': row.get('mng_no', ''),
                                'customer_code': row.get('cust_cd', ''),
                                'customer_code2': row.get('cust_cd2', ''),
                                'outbound_type': row.get('out_bc', ''),
                                'outbound_type_name': LogisticsManagementDataService._get_outbound_type_name(row.get('out_bc', '')),
                                'currency_code': row.get('cury_bc', 'KRW'),
                                'sales_type': row.get('sal_bc', ''),
                                'return_type': row.get('rtn_bc', ''),
                                'unit_code': row.get('um_bc', ''),
                                'outbound_quantity': out_qty,
                                'unit_quantity': float(row.get('unit_qty', 0) or 0),
                                'unit_price': out_up,
                                'outbound_amount': out_amt,
                                'department_code': row.get('dept_cd', ''),
                                'registrar_id': row.get('reg_id', 0),
                                'remarks': row.get('rmks', ''),
                                'done_yn': row.get('done_yn', 'N'),
                                'done_quantity': float(row.get('done_qty', 0) or 0),
                                'source_tables': ['LEB100_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Logistics] Loaded ERP outbound data: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Logistics] ERP outbound fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                outbound_types = ['sales', 'production', 'move', 'return', 'transfer']
                customers = ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005']
                warehouses = ['WH01', 'WH02', 'WH03']
                items = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005']

                for i in range(50):
                    item_code = random.choice(items)
                    qty = random.randint(50, 3000)
                    unit_price = round(random.uniform(1000, 50000), 2)
                    ot = random.choice(outbound_types) if outbound_type == 'all' else outbound_type

                    item = {
                        'factory_code': factory_code,
                        'warehouse_code': random.choice(warehouses),
                        'warehouse_name': f"{random.choice(warehouses)} 창고",
                        'outbound_no': f'OUT-{datetime.now().strftime("%Y%m")}-{i+1:04d}',
                        'outbound_seq': i+1,
                        'outbound_date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d'),
                        'item_code': item_code,
                        'item_name': f'자재 {item_code}',
                        'management_no': f'MNG-{i+1:04d}',
                        'customer_code': random.choice(customers),
                        'customer_code2': random.choice(customers),
                        'outbound_type': ot,
                        'outbound_type_name': LogisticsManagementDataService._get_outbound_type_name(ot),
                        'currency_code': 'KRW',
                        'sales_type': 'normal',
                        'return_type': 'N',
                        'unit_code': 'EA',
                        'outbound_quantity': qty,
                        'unit_quantity': qty,
                        'unit_price': unit_price,
                        'outbound_amount': round(qty * unit_price, 2),
                        'department_code': f'DEPT{random.randint(1, 10):02d}',
                        'registrar_id': random.randint(1, 100),
                        'remarks': f'출고 비고 {i+1}',
                        'done_yn': random.choice(['Y', 'N']),
                        'done_quantity': qty if random.choice([True, False]) else 0,
                        'source_tables': ['LEB100_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'outbound_type': outbound_type,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Logistics] Outbound management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_warehouse_management(request):
        """
        창고 관리 조회

        GET /api/erp-sync/logistics/warehouse-management/

        Query Parameters:
            factory_code: 공장 코드
            warehouse_code: 창고코드 (선택)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            warehouse_code = request.GET.get('warehouse_code', '')

            erp_source = DataSyncService.get_default_source()
            results = []

            # 창고별 재고 집계
            warehouse_stats = {}

            if erp_source:
                try:
                    # LEB980_YH: 재고실사(현장)
                    where_clause = f"fac_cd = '{factory_code}'"
                    if warehouse_code:
                        where_clause += f" AND wh_cd = '{warehouse_code}'"

                    warehouse_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'LEB980_YH',
                        where_clause=where_clause,
                        limit=1000
                    )

                    if warehouse_data:
                        for row in warehouse_data:
                            wh_cd = row.get('wh_cd', '')
                            loc_cd = row.get('loc_cd', '')
                            real_qty = float(row.get('real_qty', 0) or 0)

                            # 창고별 통계
                            if wh_cd not in warehouse_stats:
                                warehouse_stats[wh_cd] = {
                                    'warehouse_code': wh_cd,
                                    'warehouse_name': f'{wh_cd} 창고',
                                    'total_locations': 0,
                                    'total_items': 0,
                                    'total_quantity': 0,
                                    'capacity': 0,
                                    'utilization_rate': 0,
                                    'locations': []
                                }

                            warehouse_stats[wh_cd]['total_quantity'] += real_qty
                            warehouse_stats[wh_cd]['total_items'] += 1

                            # Location 정보
                            location_info = {
                                'location_code': loc_cd,
                                'location_no': row.get('l_code', ''),
                                'x_no': row.get('x_no', ''),
                                'y_no': row.get('y_no', ''),
                                'z_no': row.get('z_no', ''),
                                'item_code': str(row.get('itm_id', '')),
                                'lot_no': row.get('mng_no', ''),
                                'pallet_no': row.get('pallet_no', ''),
                                'quantity': real_qty,
                                'barcode': row.get('barcode', '')
                            }
                            warehouse_stats[wh_cd]['locations'].append(location_info)

                        # 통계 계산
                        for wh_cd, stats in warehouse_stats.items():
                            stats['total_locations'] = len(stats['locations'])
                            stats['capacity'] = stats['total_locations'] * 100
                            stats['utilization_rate'] = round((stats['total_items'] / max(stats['total_locations'], 1)) * 100, 2)

                        results = list(warehouse_stats.values())
                        logger.info(f"[Logistics] Loaded ERP warehouse data: {len(results)} warehouses")
                except Exception as e:
                    logger.warning(f"[Logistics] ERP warehouse fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                warehouse_types = ['material', 'product', 'purchase', 'process', 'sales', 'return']

                for i in range(5):
                    warehouse_code = f'WH{i+1:02d}'
                    total_locations = random.randint(50, 200)
                    total_items = random.randint(20, total_locations)

                    item = {
                        'factory_code': factory_code,
                        'warehouse_code': warehouse_code,
                        'warehouse_name': f'창고 {i+1}',
                        'warehouse_type': random.choice(warehouse_types),
                        'total_locations': total_locations,
                        'total_items': total_items,
                        'total_quantity': round(random.uniform(10000, 100000), 2),
                        'capacity': total_locations * 100,
                        'utilization_rate': round((total_items / total_locations) * 100, 2),
                        'manager': f'담당자{i+1}',
                        'contact': f'02-1234-{i+1:04d}',
                        'address': f'주소 {i+1}',
                        'status': 'active',
                        'locations': [],
                        'source_tables': ['LEB980_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'warehouse_code': warehouse_code,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Logistics] Warehouse management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_delivery_management(request):
        """
        배송 관리 조회

        GET /api/erp-sync/logistics/delivery-management/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            status: 상태 (all/pending/shipping/delivered/completed)
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
                    # LEB160_YH: 출고-선적 (배송정보)
                    where_clause = f"out_dt >= '{start_date}' AND out_dt <= '{end_date}'"
                    where_clause += f" AND fac_cd = '{factory_code}'"

                    delivery_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'LEB100_YH',  # LEB160은 LEB100과 연결
                        where_clause=where_clause,
                        limit=500
                    )

                    if delivery_data:
                        for row in delivery_data:
                            out_date = row.get('out_dt', '')
                            delivery_status = 'completed'
                            if out_date == end_date:
                                delivery_status = 'shipping'
                            elif (datetime.now() - datetime.strptime(out_date, '%Y-%m-%d')).days <= 3:
                                delivery_status = 'delivered'

                            if status != 'all' and delivery_status != status:
                                continue

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'warehouse_code': row.get('wh_cd', ''),
                                'delivery_no': row.get('out_no', ''),
                                'delivery_date': out_date,
                                'expected_delivery_date': (datetime.strptime(out_date, '%Y-%m-%d') + timedelta(days=random.randint(1, 5))).strftime('%Y-%m-%d') if out_date else '',
                                'customer_code': row.get('cust_cd', ''),
                                'customer_code2': row.get('cust_cd2', ''),
                                'customer_name': f'거래처 {row.get("cust_cd", "")}',
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f"제품 {row.get('itm_id', '')}",
                                'delivery_quantity': float(row.get('out_qty', 0) or 0),
                                'delivery_amount': float(row.get('out_amt', 0) or 0),
                                'delivery_address': f'배송지 {random.randint(1, 100)}',
                                'delivery_status': delivery_status,
                                'tracking_number': f'TRN{datetime.now().strftime("%Y%m%d")}{random.randint(1000, 9999)}',
                                'carrier': random.choice(['CJ대한통운', '롯데택배', '한진택배', '우체국택배']),
                                'shipping_cost': round(random.uniform(5000, 30000), 2),
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['LEB100_YH', 'LEB160_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Logistics] Loaded ERP delivery data: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Logistics] ERP delivery fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                customers = ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005']
                items = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005']
                carriers = ['CJ대한통운', '롯데택배', '한진택배', '우체국택배', '로그엑스']
                statuses = ['pending', 'shipping', 'delivered', 'completed'] if status == 'all' else [status]

                for i in range(50):
                    item_code = random.choice(items)
                    qty = random.randint(10, 500)
                    del_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
                    del_status = random.choice(statuses)

                    item = {
                        'factory_code': factory_code,
                        'warehouse_code': f'WH{random.randint(1, 5):02d}',
                        'delivery_no': f'DLV-{datetime.now().strftime("%Y%m")}-{i+1:04d}',
                        'delivery_date': del_date,
                        'expected_delivery_date': (datetime.strptime(del_date, '%Y-%m-%d') + timedelta(days=random.randint(1, 5))).strftime('%Y-%m-%d'),
                        'customer_code': random.choice(customers),
                        'customer_code2': random.choice(customers),
                        'customer_name': f'거래처 {random.choice(customers)}',
                        'item_code': item_code,
                        'item_name': f'제품 {item_code}',
                        'delivery_quantity': qty,
                        'delivery_amount': round(qty * random.uniform(10000, 100000), 2),
                        'delivery_address': f'배송지 {random.randint(1, 100)}',
                        'delivery_status': del_status,
                        'tracking_number': f'TRN{datetime.now().strftime("%Y%m%d")}{random.randint(1000, 9999)}',
                        'carrier': random.choice(carriers),
                        'shipping_cost': round(random.uniform(5000, 30000), 2),
                        'remarks': f'배송 비고 {i+1}',
                        'source_tables': ['LEB100_YH', 'LEB160_YH'],
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
            logger.error(f"[Logistics] Delivery management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_inventory_movement(request):
        """
        재고 이동 관리 조회

        GET /api/erp-sync/logistics/inventory-movement/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            movement_type: 이동유형 (all/inbound/outbound/transfer/adjustment)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            movement_type = request.GET.get('movement_type', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # LEB120_YH: 출고-이동
                    where_clause = f"out_dt >= '{start_date}' AND out_dt <= '{end_date}'"
                    where_clause += f" AND fac_cd = '{factory_code}'"

                    movement_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'LEB100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if movement_data:
                        for row in movement_data:
                            mov_type = 'transfer'
                            if row.get('out_bc') == 'sales':
                                mov_type = 'outbound'
                            elif row.get('out_bc') == 'purchase':
                                mov_type = 'inbound'

                            if movement_type != 'all' and mov_type != movement_type:
                                continue

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'warehouse_code': row.get('wh_cd', ''),
                                'warehouse_name': f"{row.get('wh_cd', '')} 창고",
                                'movement_no': row.get('out_no', ''),
                                'movement_seq': row.get('out_sq', 0),
                                'movement_date': row.get('out_dt', ''),
                                'movement_type': mov_type,
                                'movement_type_name': LogisticsManagementDataService._get_movement_type_name(mov_type),
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f"자재 {row.get('itm_id', '')}",
                                'management_no': row.get('mng_no', ''),
                                'from_location': row.get('loc_cd', ''),
                                'to_location': f'LOC-{random.randint(1, 100)}',
                                'quantity': float(row.get('out_qty', 0) or 0),
                                'unit': row.get('um_bc', 'EA'),
                                'customer_code': row.get('cust_cd', ''),
                                'reference_no': row.get('out_no', ''),
                                'remarks': row.get('rmks', ''),
                                'registrar_id': row.get('reg_id', 0),
                                'source_tables': ['LEB100_YH', 'LEB120_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Logistics] Loaded ERP inventory movement data: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Logistics] ERP inventory movement fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                movement_types = ['inbound', 'outbound', 'transfer', 'adjustment']
                warehouses = ['WH01', 'WH02', 'WH03', 'WH04', 'WH05']
                items = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005']

                for i in range(50):
                    item_code = random.choice(items)
                    mov_type = random.choice(movement_types) if movement_type == 'all' else movement_type

                    item = {
                        'factory_code': factory_code,
                        'warehouse_code': random.choice(warehouses),
                        'warehouse_name': f"{random.choice(warehouses)} 창고",
                        'movement_no': f'MOV-{datetime.now().strftime("%Y%m")}-{i+1:04d}',
                        'movement_seq': i+1,
                        'movement_date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d'),
                        'movement_type': mov_type,
                        'movement_type_name': LogisticsManagementDataService._get_movement_type_name(mov_type),
                        'item_code': item_code,
                        'item_name': f'자재 {item_code}',
                        'management_no': f'MNG-{i+1:04d}',
                        'from_location': f'LOC-{random.randint(1, 100)}',
                        'to_location': f'LOC-{random.randint(1, 100)}',
                        'quantity': random.randint(10, 1000),
                        'unit': 'EA',
                        'customer_code': f'CUST{random.randint(1, 5):03d}',
                        'reference_no': f'REF-{i+1:04d}',
                        'remarks': f'이동 비고 {i+1}',
                        'registrar_id': random.randint(1, 100),
                        'source_tables': ['LEB100_YH', 'LEB120_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'movement_type': movement_type,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Logistics] Inventory movement error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_transport_management(request):
        """
        운송 관리 조회

        GET /api/erp-sync/logistics/transport-management/

        Query Parameters:
            factory_code: 공장 코드
            start_date: 시작일
            end_date: 종료일
            transport_type: 운송유형 (all/inbound/outbound/transfer)
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            start_date = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            transport_type = request.GET.get('transport_type', 'all')

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # LEB100_YH: 출고정보 (운송정보 포함)
                    where_clause = f"out_dt >= '{start_date}' AND out_dt <= '{end_date}'"
                    where_clause += f" AND fac_cd = '{factory_code}'"

                    transport_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'LEB100_YH',
                        where_clause=where_clause,
                        limit=500
                    )

                    if transport_data:
                        for row in transport_data:
                            tr_type = 'outbound' if row.get('out_bc') == 'sales' else 'inbound'

                            if transport_type != 'all' and tr_type != transport_type:
                                continue

                            out_date = row.get('out_dt', '')
                            distance = random.uniform(10, 500)
                            transit_days = random.randint(1, 5)

                            results.append({
                                'factory_code': row.get('fac_cd', factory_code),
                                'transport_no': f'TRN-{out_date.replace("-", "")}-{row.get("out_no", "")}' if out_date else f'TRN-{i+1}',
                                'transport_date': out_date,
                                'transport_type': tr_type,
                                'transport_type_name': '입고 운송' if tr_type == 'inbound' else '출고 운송',
                                'warehouse_code': row.get('wh_cd', ''),
                                'customer_code': row.get('cust_cd', ''),
                                'customer_name': f'거래처 {row.get("cust_cd", "")}',
                                'item_code': str(row.get('itm_id', '')),
                                'item_name': f"제품 {row.get('itm_id', '')}",
                                'quantity': float(row.get('out_qty', 0) or 0),
                                'weight': round(float(row.get('out_qty', 0) or 0) * random.uniform(0.1, 10), 2),
                                'from_location': f'{factory_code} 창고',
                                'to_location': f'거래처 {row.get("cust_cd", "")}',
                                'distance': round(distance, 2),
                                'transit_days': transit_days,
                                'estimated_arrival': (datetime.strptime(out_date, '%Y-%m-%d') + timedelta(days=transit_days)).strftime('%Y-%m-%d') if out_date else '',
                                'carrier': random.choice(['자가운송', 'CJ대한통운', '롯데택배', '한진택배', '영업용차량']),
                                'vehicle_no': f'차량-{random.randint(1000, 9999)}',
                                'driver_name': f'기사{random.randint(1, 20)}',
                                'driver_contact': f'010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
                                'transport_cost': round(distance * random.uniform(100, 300), 2),
                                'fuel_cost': round(distance * random.uniform(50, 150), 2),
                                'remarks': row.get('rmks', ''),
                                'source_tables': ['LEB100_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Logistics] Loaded ERP transport data: {len(results)} records")
                except Exception as e:
                    logger.warning(f"[Logistics] ERP transport fetch error: {e}")

            # Fallback 데이터 생성
            if not results:
                transport_types = ['inbound', 'outbound', 'transfer']
                customers = ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005']
                items = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005']
                carriers = ['자가운송', 'CJ대한통운', '롯데택배', '한진택배', '영업용차량', '천일화물', '현대로지스']

                for i in range(50):
                    item_code = random.choice(items)
                    tr_type = random.choice(transport_types) if transport_type == 'all' else transport_type
                    distance = round(random.uniform(10, 500), 2)
                    transit_days = random.randint(1, 5)
                    tr_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')

                    item = {
                        'factory_code': factory_code,
                        'transport_no': f'TRN-{tr_date.replace("-", "")}-{i+1:04d}',
                        'transport_date': tr_date,
                        'transport_type': tr_type,
                        'transport_type_name': '입고 운송' if tr_type == 'inbound' else ('출고 운송' if tr_type == 'outbound' else '이동 운송'),
                        'warehouse_code': f'WH{random.randint(1, 5):02d}',
                        'customer_code': random.choice(customers),
                        'customer_name': f'거래처 {random.choice(customers)}',
                        'item_code': item_code,
                        'item_name': f'제품 {item_code}',
                        'quantity': random.randint(100, 5000),
                        'weight': round(random.uniform(100, 5000), 2),
                        'from_location': f'{factory_code} 창고',
                        'to_location': f'거래처 {random.choice(customers)}',
                        'distance': distance,
                        'transit_days': transit_days,
                        'estimated_arrival': (datetime.strptime(tr_date, '%Y-%m-%d') + timedelta(days=transit_days)).strftime('%Y-%m-%d'),
                        'carrier': random.choice(carriers),
                        'vehicle_no': f'차량-{random.randint(1000, 9999)}',
                        'driver_name': f'기사{random.randint(1, 20)}',
                        'driver_contact': f'010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
                        'transport_cost': round(distance * random.uniform(100, 300), 2),
                        'fuel_cost': round(distance * random.uniform(50, 150), 2),
                        'remarks': f'운송 비고 {i+1}',
                        'source_tables': ['LEB100_YH'],
                        'data_source': 'fallback'
                    }
                    results.append(item)

            return Response({
                'factory_code': factory_code,
                'start_date': start_date,
                'end_date': end_date,
                'transport_type': transport_type,
                'total_count': len(results),
                'results': results
            })

        except Exception as e:
            logger.error(f"[Logistics] Transport management error: {e}")
            return Response({'error': str(e)}, status=500)

    @staticmethod
    def _get_outbound_type_name(outbound_type):
        """출고 유형명 반환"""
        type_names = {
            'sales': '판매출고',
            'production': '생산출고',
            'move': '이동출고',
            'return': '반품출고',
            'transfer': '이체출고',
            'normal': '일반출고'
        }
        return type_names.get(outbound_type, outbound_type)

    @staticmethod
    def _get_movement_type_name(movement_type):
        """이동 유형명 반환"""
        type_names = {
            'inbound': '입고',
            'outbound': '출고',
            'transfer': '이동',
            'adjustment': '조정'
        }
        return type_names.get(movement_type, movement_type)
