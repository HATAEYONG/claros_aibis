"""
EMAX ERP 데이터 동기화 서비스
MS-SQL (EMAX ERP) -> PostgreSQL (MIS Dashboard) 데이터 동기화
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Type
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.db.models import Model

from .models import (
    ERPSyncLog, ERPSyncConfig,
    ERPSalesYearPlan, ERPShipmentPlan, ERPShipmentPlanItem,
    ERPProductionResult, ERPShipmentInspection, ERPShipmentDefect,
    ERPLocationStock, ERPBarcodeDelivery, ERPSupplier,
    ERPAccountLedger, ERPWorkInProcess, ERPProductLedger
)

logger = logging.getLogger(__name__)


class ERPConnectionManager:
    """EMAX ERP (MS-SQL) 데이터베이스 연결 관리"""

    def __init__(self, connection_string: str = None):
        self.connection_string = connection_string or self._get_default_connection()
        self._connection = None

    def _get_default_connection(self) -> str:
        """환경 변수에서 ERP DB 연결 문자열 생성"""
        import os
        from django.conf import settings

        # 환경변수에서 설정 읽기 (settings의 MSSQL_CONFIG 우선)
        server = os.environ.get('MSSQL_HOST', getattr(settings, 'MSSQL_CONFIG', {}).get('host', ''))
        port = os.environ.get('MSSQL_PORT', str(getattr(settings, 'MSSQL_CONFIG', {}).get('port', '1433')))
        database = os.environ.get('MSSQL_DATABASE', getattr(settings, 'MSSQL_CONFIG', {}).get('database', ''))
        user = os.environ.get('MSSQL_USER', getattr(settings, 'MSSQL_CONFIG', {}).get('user', ''))
        password = os.environ.get('MSSQL_PASSWORD', getattr(settings, 'MSSQL_CONFIG', {}).get('password', ''))
        driver = os.environ.get('MSSQL_DRIVER', getattr(settings, 'MSSQL_CONFIG', {}).get('driver', 'ODBC Driver 17 for SQL Server'))
        encrypt = getattr(settings, 'MSSQL_CONFIG', {}).get('encrypt', 'no')
        trust_cert = getattr(settings, 'MSSQL_CONFIG', {}).get('trust_server_certificate', 'yes')

        # pyodbc 연결 문자열 생성
        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password};"
            f"TrustServerCertificate={trust_cert};"
            f"Encrypt={encrypt};"
        )

        return connection_string

    def connect(self):
        """데이터베이스 연결"""
        try:
            import pyodbc
            self._connection = pyodbc.connect(self.connection_string, timeout=30)
            logger.info("ERP 데이터베이스 연결 성공")
            return self._connection
        except ImportError:
            logger.error("pyodbc가 설치되지 않았습니다. 'pip install pyodbc' 실행 필요")
            raise
        except Exception as e:
            logger.error(f"ERP 데이터베이스 연결 실패: {e}")
            raise

    def disconnect(self):
        """데이터베이스 연결 해제"""
        if self._connection:
            self._connection.close()
            self._connection = None
            logger.info("ERP 데이터베이스 연결 해제")

    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """쿼리 실행 및 결과 반환"""
        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            columns = [column[0] for column in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))

            return results
        finally:
            cursor.close()

    def execute_batch_query(self, query: str, params: tuple = None, batch_size: int = None) -> List[Dict]:
        """대량 데이터 쿼리 실행 (배치 처리 - 적응형 배치 크기 지원)"""
        from django.conf import settings

        # Use adaptive batch size if enabled and not specified
        if batch_size is None and getattr(settings, 'ADAPTIVE_BATCH_ENABLED', False):
            try:
                from utils.adaptive_batch import get_adaptive_batch_size
                batch_size = get_adaptive_batch_size()
                logger.info(f"Using adaptive batch size: {batch_size}")
            except Exception as e:
                logger.warning(f"Adaptive batch sizing failed, using default: {e}")
                batch_size = getattr(settings, 'SYNC_BATCH_SIZE', 1000)
        elif batch_size is None:
            batch_size = getattr(settings, 'SYNC_BATCH_SIZE', 1000)

        if not self._connection:
            self.connect()

        cursor = self._connection.cursor()
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            columns = [column[0] for column in cursor.description]
            results = []

            while True:
                rows = cursor.fetchmany(batch_size)
                if not rows:
                    break
                for row in rows:
                    results.append(dict(zip(columns, row)))

            return results
        finally:
            cursor.close()

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()


class ERPSyncService:
    """ERP 데이터 동기화 서비스"""

    # ERP 테이블 -> MIS 모델 매핑
    TABLE_MAPPING = {
        'SDY100_YH': {
            'model': ERPSalesYearPlan,
            'mis_model': 'sales.MonthlySales',
            'query': '''
                SELECT co_cd, plan_year, plan_rev, fac_cd, plan_mon,
                       cust_cd, cust_nm, itm_id, itm_cd, itm_nm,
                       plan_qty, plan_up, plan_amt, cid, cdt, mid, mdt
                FROM SDY100_YH
                WHERE mdt > ? OR cdt > ?
                ORDER BY plan_year, plan_mon
            ''',
            'key_fields': ['co_cd', 'plan_year', 'plan_rev', 'fac_cd', 'plan_mon', 'cust_cd', 'itm_id'],
        },
        'SDA500_YH': {
            'model': ERPShipmentPlan,
            'mis_model': 'production.WorkOrder',
            'query': '''
                SELECT plan_no, dlv_dt, bs_cd, cust_cd, cust_nm, sply_cd, rmks,
                       cid, cdt, mid, mdt
                FROM SDA500_YH
                WHERE mdt > ? OR cdt > ?
                ORDER BY dlv_dt DESC
            ''',
            'key_fields': ['plan_no'],
        },
        'SDA510_YH': {
            'model': ERPShipmentPlanItem,
            'mis_model': 'production.WorkOrder',
            'query': '''
                SELECT plan_no, plan_sq, itm_id, itm_cd, itm_nm,
                       plan_qty, out_qty, rem_qty, so_no, so_sq, qc_yn, qc_bc,
                       cid, cdt, mid, mdt
                FROM SDA510_YH
                WHERE mdt > ? OR cdt > ?
            ''',
            'key_fields': ['plan_no', 'plan_sq'],
        },
        'ppc100_counter': {
            'model': ERPProductionResult,
            'mis_model': 'production.DailyProduction',
            'query': '''
                SELECT prd_dt, fac_cd, line_cd, equip_cd, itm_id, itm_cd, itm_nm,
                       plan_qty, prd_qty, good_qty, bad_qty, counter_val,
                       cid, cdt, mid, mdt
                FROM ppc100_counter
                WHERE prd_dt >= ?
                ORDER BY prd_dt DESC
            ''',
            'key_fields': ['prd_dt', 'fac_cd', 'line_cd', 'itm_id'],
        },
        'QMO100': {
            'model': ERPShipmentInspection,
            'mis_model': 'quality.QualityInspection',
            'query': '''
                SELECT qc_no, qc_dt, fac_cd, cust_cd, cust_nm,
                       itm_id, itm_cd, itm_nm, lot_no,
                       qc_qty, pass_qty, fail_qty, qc_result, inspector,
                       cid, cdt, mid, mdt
                FROM QMO100
                WHERE mdt > ? OR cdt > ?
                ORDER BY qc_dt DESC
            ''',
            'key_fields': ['qc_no'],
        },
        'QMO110': {
            'model': ERPShipmentDefect,
            'mis_model': 'quality.DefectRecord',
            'query': '''
                SELECT qc_no, defect_sq, defect_cd, defect_nm,
                       defect_qty, defect_rt, rmks,
                       cid, cdt, mid, mdt
                FROM QMO110
                WHERE mdt > ? OR cdt > ?
            ''',
            'key_fields': ['qc_no', 'defect_sq'],
        },
        'LCB100': {
            'model': ERPLocationStock,
            'mis_model': 'purchase.Inventory',
            'query': '''
                SELECT loc_cd, itm_id, itm_cd, itm_nm, lot_no,
                       stk_qty, stk_dt,
                       cid, cdt, mid, mdt
                FROM LCB100
                WHERE mdt > ? OR cdt > ?
            ''',
            'key_fields': ['loc_cd', 'itm_id', 'lot_no'],
        },
        'BAR200': {
            'model': ERPBarcodeDelivery,
            'mis_model': 'purchase.PurchaseOrder',
            'query': '''
                SELECT bar_id, bar_no, cust_cd, cust_nm, fac_cd, wh_cd,
                       itm_id, itm_cd, itm_nm, dlv_dt, mng_no, dlv_qty, dlv_bc,
                       cid, cdt, mid, mdt
                FROM BAR200
                WHERE mdt > ? OR cdt > ?
                ORDER BY dlv_dt DESC
            ''',
            'key_fields': ['bar_id'],
        },
        'CAM900_YH': {
            'model': ERPAccountLedger,
            'mis_model': 'financial.FinancialStatement',
            'query': '''
                SELECT fiscal_year, fiscal_month, acct_cd, acct_nm,
                       dr_amt, cr_amt, balance,
                       cid, cdt, mid, mdt
                FROM CAM900_YH
                WHERE mdt > ? OR cdt > ?
                ORDER BY fiscal_year, fiscal_month
            ''',
            'key_fields': ['fiscal_year', 'fiscal_month', 'acct_cd'],
        },
    }

    def __init__(self, erp_connection: ERPConnectionManager = None):
        self.erp_conn = erp_connection or ERPConnectionManager()

    def sync_table(self, table_name: str, sync_type: str = 'incremental',
                   since: datetime = None) -> ERPSyncLog:
        """단일 테이블 동기화"""

        if table_name not in self.TABLE_MAPPING:
            raise ValueError(f"알 수 없는 테이블: {table_name}")

        config = self.TABLE_MAPPING[table_name]
        model_class = config['model']

        # 동기화 로그 생성
        sync_log = ERPSyncLog.objects.create(
            sync_type=sync_type,
            target_table=table_name,
            status='running'
        )

        try:
            # Get adaptive batch size
            batch_size = None
            if getattr(settings, 'ADAPTIVE_BATCH_ENABLED', False):
                try:
                    from utils.adaptive_batch import get_adaptive_batch_size
                    batch_size = get_adaptive_batch_size()
                    logger.info(f"Using adaptive batch size: {batch_size}")
                except Exception as e:
                    logger.warning(f"Adaptive batch sizing failed: {e}")

            # 마지막 동기화 시간 결정
            if sync_type == 'full':
                since = datetime(2000, 1, 1)
            elif since is None:
                # 마지막 동기화 시간 조회
                last_config = ERPSyncConfig.objects.filter(erp_table=table_name).first()
                if last_config and last_config.last_sync_at:
                    since = last_config.last_sync_at
                else:
                    since = datetime.now() - timedelta(days=30)  # 기본 30일

            # ERP에서 데이터 조회
            with self.erp_conn as conn:
                if 'prd_dt' in config['query']:
                    # 생산 데이터는 날짜 기준
                    results = conn.execute_query(config['query'], (since.date(),))
                else:
                    results = conn.execute_query(config['query'], (since, since))

            sync_log.total_count = len(results)
            success_count = 0
            error_count = 0
            errors = []

            # 데이터 동기화
            with transaction.atomic():
                for row in results:
                    try:
                        self._upsert_record(model_class, config['key_fields'], row, table_name)
                        success_count += 1
                    except Exception as e:
                        error_count += 1
                        errors.append(f"Row {row}: {str(e)}")
                        logger.error(f"동기화 오류 - {table_name}: {e}")

            # 동기화 설정 업데이트
            ERPSyncConfig.objects.update_or_create(
                erp_table=table_name,
                defaults={
                    'mis_model': config['mis_model'],
                    'last_sync_at': timezone.now(),
                }
            )

            # 로그 업데이트
            sync_log.status = 'success' if error_count == 0 else 'partial'
            sync_log.success_count = success_count
            sync_log.error_count = error_count
            sync_log.error_message = '\n'.join(errors[:10])  # 최대 10개 오류만 저장
            sync_log.finished_at = timezone.now()
            sync_log.save()

            # Record batch success/failure for adaptive sizing
            if batch_size:
                if error_count == 0:
                    try:
                        from utils.adaptive_batch import record_batch_success
                        record_batch_success(batch_size)
                    except Exception as e:
                        logger.warning(f"Failed to record batch success: {e}")
                else:
                    try:
                        from utils.adaptive_batch import record_batch_failure
                        record_batch_failure(batch_size, Exception(f"{error_count} errors"))
                    except Exception as e:
                        logger.warning(f"Failed to record batch failure: {e}")

            logger.info(f"동기화 완료 - {table_name}: {success_count}건 성공, {error_count}건 오류")

        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.finished_at = timezone.now()
            sync_log.save()
            logger.error(f"동기화 실패 - {table_name}: {e}")

            # Record batch failure for adaptive sizing
            try:
                from utils.adaptive_batch import record_batch_failure
                record_batch_failure(getattr(settings, 'SYNC_BATCH_SIZE', 1000), e)
            except Exception:
                pass

            raise

        return sync_log

    def _upsert_record(self, model_class: Type[Model], key_fields: List[str],
                       data: Dict[str, Any], source_table: str):
        """레코드 생성 또는 업데이트"""

        # 키 필드로 lookup_kwargs 생성
        lookup_kwargs = {field: data.get(field) for field in key_fields}

        # 데이터 정리 (None 처리, 타입 변환)
        cleaned_data = self._clean_data(data, model_class)
        cleaned_data['erp_source_table'] = source_table
        cleaned_data['erp_sync_at'] = timezone.now()
        cleaned_data['is_synced'] = True

        # update_or_create
        obj, created = model_class.objects.update_or_create(
            defaults=cleaned_data,
            **lookup_kwargs
        )

        return obj, created

    def _clean_data(self, data: Dict[str, Any], model_class: Type[Model]) -> Dict[str, Any]:
        """데이터 정리 및 타입 변환"""
        cleaned = {}
        model_fields = {f.name: f for f in model_class._meta.get_fields()}

        for key, value in data.items():
            if key not in model_fields:
                continue

            field = model_fields[key]

            # None 처리
            if value is None:
                if hasattr(field, 'null') and field.null:
                    cleaned[key] = None
                elif hasattr(field, 'default'):
                    cleaned[key] = field.default
                continue

            # 타입 변환
            field_type = type(field).__name__

            if field_type in ('DecimalField',):
                cleaned[key] = Decimal(str(value)) if value else Decimal('0')
            elif field_type in ('IntegerField', 'AutoField'):
                cleaned[key] = int(value) if value else 0
            elif field_type in ('DateField',):
                if isinstance(value, str):
                    cleaned[key] = datetime.strptime(value, '%Y-%m-%d').date()
                else:
                    cleaned[key] = value
            elif field_type in ('DateTimeField',):
                if isinstance(value, str):
                    cleaned[key] = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                else:
                    cleaned[key] = value
            else:
                cleaned[key] = value

        return cleaned

    def sync_all(self, sync_type: str = 'incremental') -> List[ERPSyncLog]:
        """모든 테이블 동기화"""
        logs = []
        for table_name in self.TABLE_MAPPING.keys():
            try:
                log = self.sync_table(table_name, sync_type)
                logs.append(log)
            except Exception as e:
                logger.error(f"테이블 동기화 실패 - {table_name}: {e}")
        return logs

    def sync_by_priority(self, priority: int = 1) -> List[ERPSyncLog]:
        """우선순위별 동기화
        priority 1: 필수 (매출, 출하, 검사, 재고)
        priority 2: 중요 (재무, 입고, 생산)
        priority 3: 확장 (MES, 물류, SPC)
        """
        priority_tables = {
            1: ['SDY100_YH', 'SDA500_YH', 'SDA510_YH', 'QMO100', 'LCB100'],
            2: ['CAM900_YH', 'BAR200', 'ppc100_counter'],
            3: ['QMO110'],
        }

        tables = []
        for p in range(1, priority + 1):
            tables.extend(priority_tables.get(p, []))

        logs = []
        for table_name in tables:
            if table_name in self.TABLE_MAPPING:
                try:
                    log = self.sync_table(table_name)
                    logs.append(log)
                except Exception as e:
                    logger.error(f"테이블 동기화 실패 - {table_name}: {e}")

        return logs


class MISDataTransformer:
    """ERP 데이터 -> MIS 모델 변환 서비스"""

    @staticmethod
    def transform_sales_plan_to_monthly_sales(erp_data: ERPSalesYearPlan) -> Dict:
        """영업계획 -> MonthlySales 변환"""
        return {
            'fiscal_year': erp_data.plan_year,
            'fiscal_month': erp_data.plan_mon,
            'target_amount': float(erp_data.plan_amt),
            'target_quantity': float(erp_data.plan_qty),
            'product_name': erp_data.itm_nm,
            'customer_name': erp_data.cust_nm,
        }

    @staticmethod
    def transform_inspection_to_quality(erp_data: ERPShipmentInspection) -> Dict:
        """출하검사 -> QualityInspection 변환"""
        total = float(erp_data.qc_qty) if erp_data.qc_qty else 0
        pass_qty = float(erp_data.pass_qty) if erp_data.pass_qty else 0
        fail_qty = float(erp_data.fail_qty) if erp_data.fail_qty else 0

        return {
            'inspection_date': erp_data.qc_dt,
            'product_name': erp_data.itm_nm,
            'lot_number': erp_data.lot_no,
            'inspected_quantity': int(total),
            'pass_count': int(pass_qty),
            'fail_count': int(fail_qty),
            'pass_rate': (pass_qty / total * 100) if total > 0 else 0,
            'result': 'PASS' if erp_data.qc_result == 'PASS' else 'FAIL',
            'inspector': erp_data.inspector,
        }

    @staticmethod
    def transform_production_to_daily(erp_data: ERPProductionResult) -> Dict:
        """생산실적 -> DailyProduction 변환"""
        plan = float(erp_data.plan_qty) if erp_data.plan_qty else 0
        actual = float(erp_data.prd_qty) if erp_data.prd_qty else 0

        return {
            'production_date': erp_data.prd_dt,
            'line_name': erp_data.line_cd,
            'product_name': erp_data.itm_nm,
            'planned_quantity': int(plan),
            'actual_quantity': int(actual),
            'good_quantity': int(erp_data.good_qty) if erp_data.good_qty else 0,
            'defect_quantity': int(erp_data.bad_qty) if erp_data.bad_qty else 0,
            'achievement_rate': (actual / plan * 100) if plan > 0 else 0,
        }

    @staticmethod
    def transform_stock_to_inventory(erp_data: ERPLocationStock) -> Dict:
        """로케이션재고 -> Inventory 변환"""
        return {
            'material_code': erp_data.itm_cd,
            'material_name': erp_data.itm_nm,
            'location_code': erp_data.loc_cd,
            'lot_number': erp_data.lot_no,
            'current_stock': float(erp_data.stk_qty) if erp_data.stk_qty else 0,
            'stock_date': erp_data.stk_dt,
        }


# Celery 태스크 (비동기 동기화용)
def create_sync_tasks():
    """Celery 태스크 생성 (선택적)"""
    try:
        from celery import shared_task

        @shared_task
        def sync_erp_table_task(table_name: str, sync_type: str = 'incremental'):
            """비동기 테이블 동기화 태스크"""
            service = ERPSyncService()
            return service.sync_table(table_name, sync_type)

        @shared_task
        def sync_all_erp_tables_task(sync_type: str = 'incremental'):
            """비동기 전체 동기화 태스크"""
            service = ERPSyncService()
            return service.sync_all(sync_type)

        @shared_task
        def scheduled_sync_task():
            """스케줄 동기화 태스크 (매 5분)"""
            service = ERPSyncService()
            return service.sync_by_priority(priority=1)

        return {
            'sync_erp_table_task': sync_erp_table_task,
            'sync_all_erp_tables_task': sync_all_erp_tables_task,
            'scheduled_sync_task': scheduled_sync_task,
        }
    except ImportError:
        logger.warning("Celery가 설치되지 않았습니다. 동기 방식으로만 동작합니다.")
        return {}


# ============================================================
# FOM ERP 동기화 서비스 (SQLite 중계 방식)
# ============================================================

class FOMERPSyncService:
    """
    FOM ERP 동기화 서비스
    MS-SQL -> SQLite -> PostgreSQL (2단계 동기화)
    """

    # FOM ERP 테이블 매핑
    TABLE_MAPPINGS = {
        'PPC100': {
            'model': 'FOMProductionData',
            'source_columns': ['work_dt', 'fac_cd', 'wc_cd', 'itm_id', 'req_qty',
                             'out_qty', 'good_qty', 'bad_qty', 'pw_tm', 'stop_tm'],
            'target_columns': ['work_date', 'plant', 'line', 'product_id', 'qty_plan',
                             'qty_actual', 'qty_good', 'qty_bad', 'work_hours', 'downtime'],
            'key_columns': ['work_dt', 'fac_cd', 'wc_cd', 'itm_id'],
            'date_column': 'work_dt',
            'sync_priority': 1,
        },
        'INV100': {
            'model': 'FOMInventoryData',
            'source_columns': ['INV_DT', 'WH_CD', 'LOC_CD', 'ITEM_CD', 'ITEM_NM',
                             'LOT_NO', 'ONHAND_QTY', 'AVAIL_QTY', 'RSV_QTY',
                             'UNIT_COST', 'TTL_VALUE', 'SAFE_STOCK', 'ROP_POINT'],
            'target_columns': ['inventory_date', 'warehouse', 'location', 'product_id',
                             'product_name', 'lot_no', 'qty_on_hand', 'qty_available',
                             'qty_reserved', 'unit_cost', 'total_value', 'safety_stock',
                             'reorder_point'],
            'key_columns': ['INV_DT', 'WH_CD', 'LOC_CD', 'ITEM_CD'],
            'date_column': 'INV_DT',
            'sync_priority': 1,
        },
        'QUA100': {
            'model': 'FOMQualityData',
            'source_columns': ['INSP_DT', 'INSP_TYPE', 'ITEM_CD', 'ITEM_NM',
                             'LOT_NO', 'INSP_QTY', 'PASS_QTY', 'FAIL_QTY', 'REWORK_QTY',
                             'DFT_TYPE', 'DFT_CAUSE', 'DFT_RATE', 'INSP_ID'],
            'target_columns': ['inspection_date', 'inspection_type', 'product_id',
                             'product_name', 'lot_no', 'qty_inspected', 'qty_passed',
                             'qty_failed', 'qty_rework', 'defect_type', 'defect_cause',
                             'defect_rate', 'inspector'],
            'key_columns': ['INSP_DT', 'INSP_TYPE', 'ITEM_CD', 'LOT_NO'],
            'date_column': 'INSP_DT',
            'sync_priority': 1,
        },
        'FAC300': {
            'model': 'FOMEquipmentData',
            'source_columns': ['OPR_DT', 'EQP_ID', 'EQP_NM', 'PLANT_CD', 'LINE_CD',
                             'PLAN_TM', 'ACT_TM', 'DOWN_TM', 'FAIL_CNT', 'FAIL_TM',
                             'OUT_QTY', 'DFT_QTY', 'AVAIL_RT', 'PERF_RT', 'QUAL_RT', 'OEE_RT'],
            'target_columns': ['operation_date', 'equipment_id', 'equipment_name',
                             'plant', 'line', 'planned_time', 'actual_time', 'downtime',
                             'failure_count', 'failure_time', 'output_qty', 'defect_qty',
                             'availability', 'performance', 'quality_rate', 'oee'],
            'key_columns': ['OPR_DT', 'EQP_ID'],
            'date_column': 'OPR_DT',
            'sync_priority': 2,
        },
        'ACC200': {
            'model': 'FOMCostData',
            'source_columns': ['COST_MM', 'ITEM_CD', 'ITEM_NM', 'COST_CC',
                             'MTL_COST', 'LBR_COST', 'Ovh_COST', 'UNIT_COST',
                             'STD_COST', 'VAR_AMT', 'VAR_RT', 'OUT_QTY', 'TTL_COST'],
            'target_columns': ['cost_month', 'product_id', 'product_name', 'cost_center',
                             'material_cost', 'labor_cost', 'overhead_cost', 'unit_cost',
                             'standard_cost', 'variance', 'variance_rate', 'output_qty',
                             'total_cost'],
            'key_columns': ['COST_MM', 'ITEM_CD', 'COST_CC'],
            'date_column': 'COST_MM',
            'sync_priority': 3,
        },
        'FIN300': {
            'model': 'FOMFinanceData',
            'source_columns': ['FSC_MM', 'ACCT_TP', 'ACCT_CD', 'ACCT_NM',
                             'AMT', 'PREV_AMT', 'REV_AMT', 'COGS_AMT',
                             'GR_PROF', 'OP_PROF', 'NET_PROF'],
            'target_columns': ['fiscal_month', 'account_type', 'account_code',
                             'account_name', 'amount', 'prev_amount', 'revenue',
                             'cogs', 'gross_profit', 'operating_profit', 'net_profit'],
            'key_columns': ['FSC_MM', 'ACCT_CD'],
            'date_column': 'FSC_MM',
            'sync_priority': 4,
        },
        'MAT100': {
            'model': 'FOMProductMaster',
            'source_columns': ['ITEM_CD', 'ITEM_NM', 'ITEM_EN_NM', 'CAT_CD',
                             'ITEM_TP', 'ITEM_GP', 'SPEC_DESC', 'UNIT_CD',
                             'WEIGHT', 'STD_COST', 'SEL_PRICE', 'USE_YN'],
            'target_columns': ['product_id', 'product_name', 'product_name_en',
                             'category', 'product_type', 'product_group',
                             'specification', 'unit', 'weight', 'standard_cost',
                             'selling_price', 'is_active'],
            'key_columns': ['ITEM_CD'],
            'date_column': None,
            'sync_priority': 2,
        },
        'FAC200': {
            'model': 'FOMEquipmentMaster',
            'source_columns': ['EQP_ID', 'EQP_NM', 'PLANT_CD', 'LINE_CD',
                             'LOC_DESC', 'MAKER_NM', 'MODEL_NM', 'CAP_VAL',
                             'INST_DT', 'ACQ_COST', 'DEPR_COST', 'STATUS_CD'],
            'target_columns': ['equipment_id', 'equipment_name', 'plant', 'line',
                             'location', 'manufacturer', 'model', 'capacity',
                             'install_date', 'acquisition_cost', 'depreciation_cost',
                             'status'],
            'key_columns': ['EQP_ID'],
            'date_column': None,
            'sync_priority': 3,
        },
        'MAT200': {
            'model': 'FOMBOMData',
            'source_columns': ['PAR_ITEM', 'CHD_ITEM', 'REQ_QTY', 'UNIT_CD',
                             'BOM_LVL', 'SEQ_NO', 'SUB_YN', 'SUB_FOR',
                             'VAL_FR', 'VAL_TO', 'USE_YN'],
            'target_columns': ['parent_product', 'child_product', 'quantity',
                             'unit', 'level', 'sequence', 'is_substitute',
                             'substitute_for', 'valid_from', 'valid_to', 'is_active'],
            'key_columns': ['PAR_ITEM', 'CHD_ITEM', 'SEQ_NO'],
            'date_column': None,
            'sync_priority': 3,
        },
    }

    def __init__(self, erp_connection: ERPConnectionManager = None):
        self.erp_conn = erp_connection or ERPConnectionManager()
        self.stats = {
            'total_rows': 0,
            'inserted': 0,
            'updated': 0,
            'failed': 0,
            'start_time': None,
            'end_time': None
        }

    def sync_table(self, source_table: str, days_back: int = 30) -> Dict[str, int]:
        """단일 테이블 동기화 (MS-SQL -> PostgreSQL)"""
        if source_table not in self.TABLE_MAPPINGS:
            raise ValueError(f"알 수 없는 테이블: {source_table}")

        mapping_info = self.TABLE_MAPPINGS[source_table]
        model_name = mapping_info['model']

        # 모델 클래스 동적 임포트
        from .models import (
            FOMProductionData, FOMInventoryData, FOMQualityData, FOMEquipmentData,
            FOMCostData, FOMFinanceData, FOMProductMaster, FOMEquipmentMaster, FOMBOMData
        )
        model_map = {
            'FOMProductionData': FOMProductionData,
            'FOMInventoryData': FOMInventoryData,
            'FOMQualityData': FOMQualityData,
            'FOMEquipmentData': FOMEquipmentData,
            'FOMCostData': FOMCostData,
            'FOMFinanceData': FOMFinanceData,
            'FOMProductMaster': FOMProductMaster,
            'FOMEquipmentMaster': FOMEquipmentMaster,
            'FOMBOMData': FOMBOMData,
        }
        model_class = model_map.get(model_name)
        if not model_class:
            raise ValueError(f"모델을 찾을 수 없습니다: {model_name}")

        logger.info(f"[SYNC] Starting: {source_table} -> {model_name}")

        # 마지막 동기화 시간 확인
        last_sync = self._get_last_sync_time(source_table)

        # SELECT 쿼리 생성
        source_columns = mapping_info['source_columns']
        select_query = f"SELECT {', '.join(source_columns)} FROM [{source_table}]"

        # 날짜 필터 추가
        if last_sync and mapping_info['date_column']:
            date_column = mapping_info['date_column']
            select_query += f" WHERE {date_column} >= DATEADD(day, -{days_back}, GETDATE())"
            logger.info(f"   Date range: from {last_sync.strftime('%Y-%m-%d')}")

        results = {'inserted': 0, 'updated': 0, 'failed': 0}

        try:
            with self.erp_conn as conn:
                data_rows = conn.execute_batch_query(select_query, batch_size=1000)

                # 데이터 변환 및 저장
                with transaction.atomic():
                    for row in data_rows:
                        try:
                            # 컬럼 매핑
                            mapped_data = {}
                            for src_col, tgt_col in zip(source_columns, mapping_info['target_columns']):
                                mapped_data[tgt_col] = row.get(src_col)

                            # 키 필드 추출
                            key_kwargs = {}
                            for key_col in mapping_info['key_columns']:
                                idx = source_columns.index(key_col)
                                tgt_col = mapping_info['target_columns'][idx]
                                key_kwargs[tgt_col] = row.get(key_col)

                            # 동기화 메타데이터 추가
                            mapped_data['erp_source_table'] = source_table
                            mapped_data['erp_sync_at'] = timezone.now()
                            mapped_data['is_synced'] = True

                            # 데이터 정리 (NULL 값 처리)
                            mapped_data = self._clean_mapped_data(mapped_data, model_class)

                            # upsert
                            obj, created = model_class.objects.update_or_create(
                                defaults=mapped_data,
                                **key_kwargs
                            )

                            if created:
                                results['inserted'] += 1
                            else:
                                results['updated'] += 1

                        except Exception as e:
                            logger.error(f"   Row sync failed: {e}")
                            results['failed'] += 1

                    # 동기화 설정 업데이트
                    from .models import ERPSyncConfig
                    ERPSyncConfig.objects.update_or_create(
                        erp_table=source_table,
                        defaults={
                            'mis_model': f'erp_sync.{model_name}',
                            'last_sync_at': timezone.now(),
                        }
                    )

        except Exception as e:
            logger.error(f"[FAIL] Table sync failed ({source_table}): {e}")
            raise

        logger.info(f"[OK] {source_table} sync complete: +{results['inserted']}, ~{results['updated']}, fail:{results['failed']}")
        return results

    def sync_all(self, days_back: int = 30) -> Dict[str, Dict]:
        """모든 테이블 동기화"""
        self.stats['start_time'] = timezone.now()

        logger.info("=" * 60)
        logger.info(f"Starting full FOM ERP sync - {len(self.TABLE_MAPPINGS)} tables")
        logger.info("=" * 60)

        all_results = {}

        # 우선순위별 정렬
        tables_by_priority = {}
        for table, config in self.TABLE_MAPPINGS.items():
            priority = config['sync_priority']
            if priority not in tables_by_priority:
                tables_by_priority[priority] = []
            tables_by_priority[priority].append(table)

        # 우선순위 순서대로 동기화
        for priority in sorted(tables_by_priority.keys()):
            for table in tables_by_priority[priority]:
                try:
                    results = self.sync_table(table, days_back)
                    all_results[table] = results
                except Exception as e:
                    logger.error(f"Table sync failed - {table}: {e}")
                    all_results[table] = {'inserted': 0, 'updated': 0, 'failed': 1}

        self.stats['end_time'] = timezone.now()
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()

        logger.info("=" * 60)
        logger.info(f"Full sync complete - Duration: {duration:.2f}s")
        logger.info("=" * 60)

        return all_results

    def sync_by_priority(self, priority: int, days_back: int = 30) -> Dict[str, Dict]:
        """우선순위별 동기화"""
        results = {}
        for table, config in self.TABLE_MAPPINGS.items():
            if config['sync_priority'] == priority:
                try:
                    result = self.sync_table(table, days_back)
                    results[table] = result
                except Exception as e:
                    logger.error(f"Priority {priority} sync failed - {table}: {e}")
                    results[table] = {'inserted': 0, 'updated': 0, 'failed': 1}
        return results

    def _get_last_sync_time(self, table_name: str) -> Optional[datetime]:
        """마지막 동기화 시간 조회"""
        try:
            from .models import ERPSyncConfig
            config = ERPSyncConfig.objects.filter(erp_table=table_name).first()
            if config and config.last_sync_at:
                return config.last_sync_at
        except Exception as e:
            logger.warning(f"Last sync time not found for {table_name}: {e}")
        return None

    def _clean_mapped_data(self, mapped_data: dict, model_class) -> dict:
        """매핑된 데이터 정리 - NULL 값을 기본값으로 변환"""
        from decimal import Decimal

        cleaned = {}
        model_fields = {f.name: f for f in model_class._meta.get_fields()}

        for key, value in mapped_data.items():
            if key not in model_fields:
                continue

            field = model_fields[key]

            # NULL 값 처리
            if value is None:
                # DecimalField/IntegerField: 0으로 변환
                if field.__class__.__name__ in ('DecimalField', 'IntegerField'):
                    cleaned[key] = Decimal('0') if field.__class__.__name__ == 'DecimalField' else 0
                # CharField/TextField: 빈 문자열
                elif field.__class__.__name__ in ('CharField', 'TextField'):
                    cleaned[key] = ''
                # DateField/DateTimeField: None 허용
                elif field.null:
                    cleaned[key] = None
                # 기타: 기본값 사용
                elif hasattr(field, 'default'):
                    cleaned[key] = field.default if not callable(field.default) else field.default()
                else:
                    cleaned[key] = None
            else:
                cleaned[key] = value

        return cleaned

    def get_sync_status(self) -> Dict[str, Dict]:
        """동기화 상태 조회"""
        from .models import ERPSyncConfig

        status = {}
        for table in self.TABLE_MAPPINGS.keys():
            try:
                config = ERPSyncConfig.objects.filter(erp_table=table).first()
                if config:
                    status[table] = {
                        'last_sync': config.last_sync_at,
                        'is_active': config.is_active,
                        'interval': config.sync_interval,
                        'priority': self.TABLE_MAPPINGS[table]['sync_priority'],
                    }
                else:
                    status[table] = {
                        'last_sync': None,
                        'is_active': False,
                        'priority': self.TABLE_MAPPINGS[table]['sync_priority'],
                    }
            except Exception as e:
                status[table] = {'error': str(e)}
        return status
