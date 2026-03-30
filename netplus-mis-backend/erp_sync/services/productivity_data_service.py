# -*- coding: utf-8 -*-
"""
생산성분석 데이터 서비스

OEE, 라인별 생산성, 설비 가동률, 시간대별 생산 데이터 제공
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime, timedelta
import logging

from erp_sync.models.erp_source import ERPSource
from erp_sync.services.dashboard_data_service import DataSyncService

logger = logging.getLogger(__name__)


class ProductivityDataService:
    """생산성분석 데이터 서비스"""

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_oee_analysis(request):
        """
        OEE (설비종합효율) 분석 데이터 조회

        GET /api/erp-sync/productivity/oee-analysis/

        Query Parameters:
            factory_code: 공장 코드
            line_code: 라인 코드
            date: 조회 일자
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            line_code = request.GET.get('line_code', 'LINE01')
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            data = None

            if erp_source:
                try:
                    # PPB120_YH: 생산실적집계
                    where_clause = f"fac_cd = '{factory_code}' AND work_date = '{date}'"
                    if line_code:
                        where_clause += f" AND line_cd = '{line_code}'"

                    production_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB120_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if production_data:
                        # OEE 계산
                        for row in production_data:
                            planned_qty = float(row.get('plan_qty', 0) or 0)
                            actual_qty = float(row.get('prod_qty', 0) or 0)
                            good_qty = float(row.get('good_qty', 0) or 0)
                            operating_time = float(row.get('operating_time', 0) or 0)
                            downtime = float(row.get('downtime', 0) or 0)

                            # 가동률 = (계획시간 - 비가동시간) / 계획시간 × 100
                            availability = ((operating_time - downtime) / operating_time * 100) if operating_time > 0 else 0

                            # 성능률 = 실제생산량 / 이론생산량 × 100
                            performance = (actual_qty / planned_qty * 100) if planned_qty > 0 else 0

                            # 양품률 = 양품수량 / 실제생산량 × 100
                            quality = (good_qty / actual_qty * 100) if actual_qty > 0 else 0

                            # OEE = 가동률 × 성능률 × 양품률 / 10000
                            oee = (availability * performance * quality) / 10000

                            data = {
                                'factory_code': factory_code,
                                'line_code': line_code,
                                'work_date': date,
                                'planned_time': operating_time,
                                'actual_time': operating_time - downtime,
                                'downtime': downtime,
                                'availability_rate': round(availability, 2),
                                'performance_rate': round(performance, 2),
                                'quality_rate': round(quality, 2),
                                'oee_rate': round(oee, 2),
                                'planned_qty': int(planned_qty),
                                'actual_qty': int(actual_qty),
                                'good_qty': int(good_qty),
                                'defect_qty': int(actual_qty - good_qty),
                                'source_tables': ['PPB120_YH', 'PPC150_YH'],
                                'data_source': 'erp'
                            }
                            break

                        logger.info(f"[Productivity] Loaded ERP OEE data: {len(production_data)} records")

                except Exception as e:
                    logger.warning(f"[Productivity] ERP query failed: {str(e)}")

            # 폴백 데이터
            if data is None:
                data = {
                    'factory_code': factory_code,
                    'line_code': line_code,
                    'work_date': date,
                    'planned_time': 600.0,  # 10시간
                    'actual_time': 540.0,   # 9시간
                    'downtime': 60.0,      # 1시간
                    'availability_rate': 90.0,  # 90%
                    'performance_rate': 93.0,    # 93%
                    'quality_rate': 98.0,        # 98%
                    'oee_rate': 82.3,            # OEE 82.3%
                    'planned_qty': 5000,
                    'actual_qty': 4650,
                    'good_qty': 4560,
                    'defect_qty': 90,
                    'source_tables': ['PPB120_YH', 'PPC150_YH'],
                    'data_source': 'fallback'
                }

            return Response({'results': [data]})

        except Exception as e:
            logger.error(f"[Productivity] OEE analysis error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_line_productivity(request):
        """
        라인별 생산성 분석 데이터 조회

        GET /api/erp-sync/productivity/line-productivity/

        Query Parameters:
            factory_code: 공장 코드
            date: 조회 일자
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPB125_YH: 공장별 생산실적 집계
                    where_clause = f"fac_cd = '{factory_code}' AND work_date = '{date}'"
                    production_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB125_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if production_data:
                        for row in production_data:
                            planned_qty = float(row.get('plan_qty', 0) or 0)
                            actual_qty = float(row.get('prod_qty', 0) or 0)
                            good_qty = float(row.get('good_qty', 0) or 0)
                            manpower = int(row.get('manpower', 0) or 0)

                            # 시간당 생산량 (UPH: Unit Per Hour)
                            uph = (actual_qty / 8) if actual_qty > 0 else 0  # 8시간 기준

                            # 1인당 UPH
                            uph_per_person = (uph / manpower) if manpower > 0 else 0

                            results.append({
                                'factory_code': factory_code,
                                'line_code': row.get('line_cd', ''),
                                'work_date': date,
                                'work_hour': row.get('work_hour', 8),
                                'planned_qty': int(planned_qty),
                                'actual_qty': int(actual_qty),
                                'good_qty': int(good_qty),
                                'defect_qty': int(actual_qty - good_qty),
                                'achievement_rate': round((actual_qty / planned_qty * 100) if planned_qty > 0 else 0, 2),
                                'yield_rate': round((good_qty / actual_qty * 100) if actual_qty > 0 else 0, 2),
                                'uph': round(uph, 2),
                                'manpower': manpower,
                                'uph_per_person': round(uph_per_person, 2),
                                'source_tables': ['PPB125_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Productivity] Loaded ERP line productivity data: {len(production_data)} records")

                except Exception as e:
                    logger.warning(f"[Productivity] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not results:
                for i in range(1, 4):  # 3개 라인
                    results.append({
                        'factory_code': factory_code,
                        'line_code': f'LINE0{i}',
                        'work_date': date,
                        'work_hour': 8,
                        'planned_qty': 5000,
                        'actual_qty': 4700,
                        'good_qty': 4600,
                        'defect_qty': 100,
                        'achievement_rate': 94.0,
                        'yield_rate': 97.9,
                        'uph': 587.5,
                        'manpower': 8,
                        'uph_per_person': 73.4,
                        'source_tables': ['PPB125_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Productivity] Line productivity error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_equipment_utilization(request):
        """
        설비 가동률 분석 데이터 조회

        GET /api/erp-sync/productivity/equipment-utilization/

        Query Parameters:
            factory_code: 공장 코드
            date: 조회 일자
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPC140_YH: 설비가동률 데이터
                    where_clause = f"fac_cd = '{factory_code}' AND work_date = '{date}'"
                    utilization_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPC140_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if utilization_data:
                        for row in utilization_data:
                            planned_time = float(row.get('planned_time', 0) or 0)
                            actual_time = float(row.get('actual_time', 0) or 0)
                            downtime = float(row.get('downtime', 0) or 0)

                            utilization_rate = (actual_time / planned_time * 100) if planned_time > 0 else 0

                            results.append({
                                'factory_code': factory_code,
                                'line_code': row.get('line_cd', ''),
                                'equipment_code': row.get('equip_cd', ''),
                                'work_date': date,
                                'planned_operating_time': int(planned_time),
                                'actual_operating_time': int(actual_time),
                                'downtime': int(downtime),
                                'utilization_rate': round(utilization_rate, 2),
                                'source_tables': ['PPC140_YH', 'MESTagValue_YH'],
                                'data_source': 'erp'
                            })

                        logger.info(f"[Productivity] Loaded ERP equipment utilization data: {len(utilization_data)} records")

                except Exception as e:
                    logger.warning(f"[Productivity] ERP query failed: {str(e)}")

            # 폴백 데이터
            if not results:
                # 5개 설비에 대한 가상 데이터
                for i in range(1, 6):
                    planned_time = 600  # 10시간
                    actual_time = 540 - (i * 30)  # 540, 510, 480...
                    downtime = planned_time - actual_time
                    utilization_rate = (actual_time / planned_time * 100)

                    results.append({
                        'factory_code': factory_code,
                        'line_code': 'LINE01',
                        'equipment_code': f'EQ{i:03d}',
                        'work_date': date,
                        'planned_operating_time': planned_time,
                        'actual_operating_time': int(actual_time),
                        'downtime': int(downtime),
                        'utilization_rate': round(utilization_rate, 2),
                        'source_tables': ['PPC140_YH', 'MESTagValue_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Productivity] Equipment utilization error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)

    @staticmethod
    @api_view(['GET'])
    @permission_classes([AllowAny])
    def get_hourly_production(request):
        """
        시간대별 생산 분석 데이터 조회

        GET /api/erp-sync/productivity/hourly-production/

        Query Parameters:
            factory_code: 공장 코드
            line_code: 라인 코드
            date: 조회 일자
        """
        try:
            factory_code = request.GET.get('factory_code', 'FAC01')
            line_code = request.GET.get('line_code', 'LINE01')
            date = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))

            erp_source = DataSyncService.get_default_source()
            results = []

            if erp_source:
                try:
                    # PPB131_YH: 공정별 집계 (시간대별 데이터)
                    where_clause = f"fac_cd = '{factory_code}' AND work_date = '{date}'"
                    if line_code:
                        where_clause += f" AND line_cd = '{line_code}'"

                    hourly_data = DataSyncService.fetch_from_erp(
                        erp_source,
                        'PPB131_YH',
                        where_clause=where_clause,
                        limit=100
                    )

                    if hourly_data:
                        for row in hourly_data:
                            results.append({
                                'factory_code': factory_code,
                                'line_code': line_code,
                                'work_date': date,
                                'work_hour': int(row.get('work_hour', 0)),
                                'cycle_time': float(row.get('cycle_time', 0) or 0),
                                'output_qty': int(row.get('output_qty', 0)),
                                'target_qty': int(row.get('target_qty', 0)),
                                'defect_count': int(row.get('defect_count', 0)),
                                'uph': round(float(row.get('output_qty', 0)) / 60, 2),
                                'operators': int(row.get('operators', 0)),
                                'source_tables': ['PPB131_YH'],
                                'data_source': 'erp'
                            })

                    # 계산 필드 추가
                    for item in results:
                        output_qty = float(item['output_qty'])
                        target_qty = float(item['target_qty'])
                        good_qty = output_qty - item['defect_count']

                        item['achievement_rate'] = round((output_qty / target_qty * 100) if target_qty > 0 else 0, 2)
                        item['yield_rate'] = round((good_qty / output_qty * 100) if output_qty > 0 else 0, 2)

                        logger.info(f"[Productivity] Loaded ERP hourly production data: {len(hourly_data)} records")

                except Exception as e:
                    logger.warning(f"[Productivity] ERP query failed: {str(e)}")

            # 폴백 데이터 (8시간분: 08~17시)
            if not results:
                import random
                for hour in range(8, 17):
                    base_output = 550 + random.randint(-30, 30)
                    target_output = 600
                    cycle_time = 6.5 + random.uniform(-0.3, 0.3)

                    results.append({
                        'factory_code': factory_code,
                        'line_code': line_code,
                        'work_date': date,
                        'work_hour': hour,
                        'cycle_time': round(cycle_time, 2),
                        'output_qty': base_output,
                        'target_qty': target_output,
                        'achievement_rate': round((base_output / target_output * 100), 2),
                        'defect_count': random.randint(3, 15),
                        'yield_rate': round((base_output - random.randint(3, 15)) / base_output * 100, 2),
                        'uph': round(base_output / 60, 2),
                        'operators': 8,
                        'source_tables': ['PPB131_YH'],
                        'data_source': 'fallback'
                    })

            return Response({'results': results})

        except Exception as e:
            logger.error(f"[Productivity] Hourly production error: {str(e)}", exc_info=True)
            return Response({'error': f'Data fetch failed: {str(e)}'}, status=500)
