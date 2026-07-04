# Celery Tasks for ERP Synchronization
# Priority-based task routing for async ERP data sync

import logging
from datetime import datetime, timedelta
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


# ==========================================
# High Priority Tasks (Urgent, Real-time)
# ==========================================

@shared_task(
    name='claros_mis.erp_sync.tasks.urgent_sync',
    queue='high',
    priority=9,
    max_retries=3,
    default_retry_delay=60
)
def urgent_sync_task(table_name: str, record_id: int = None):
    """
    Urgent sync for critical data changes
    Used for real-time updates
    """
    try:
        logger.info(f"Starting urgent sync: {table_name}")

        from .services import ERPConnectionManager, ERPSyncService

        conn_manager = ERPConnectionManager()
        sync_service = ERPSyncService(conn_manager)

        # Sync specific table
        if record_id:
            result = sync_service.sync_record(table_name, record_id)
        else:
            result = sync_service.sync_table(table_name)

        logger.info(f"Completed urgent sync: {table_name}")
        return {
            'table': table_name,
            'status': 'completed',
            'synced_count': result.get('synced_count', 0),
            'completed_at': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Urgent sync failed for {table_name}: {e}")
        raise urgent_sync_task.retry(exc=e)


# ==========================================
# Medium Priority Tasks (Standard Operations)
# ==========================================

@shared_task(
    name='claros_mis.erp_sync.tasks.sync_realtime_task',
    queue='medium',
    priority=5,
    max_retries=2
)
def sync_realtime_task():
    """
    Real-time data sync (runs every 15 minutes)
    Syncs critical operational tables
    """
    try:
        logger.info("Starting realtime sync")

        from .services import ERPConnectionManager, ERPSyncService

        conn_manager = ERPConnectionManager()
        sync_service = ERPSyncService(conn_manager)

        # Realtime tables to sync
        realtime_tables = [
            'FOMORD',      # Production orders
            'FOMBOM',      # BOM data
            'FOMRTE',      # Routing data
        ]

        results = {}
        for table in realtime_tables:
            try:
                result = sync_service.sync_table(table, batch_size=100)
                results[table] = {
                    'status': 'success',
                    'synced_count': result.get('synced_count', 0)
                }
            except Exception as e:
                logger.error(f"Failed to sync {table}: {e}")
                results[table] = {'status': 'error', 'error': str(e)}

        logger.info(f"Realtime sync completed: {len(results)} tables")
        return {
            'sync_type': 'realtime',
            'tables': results,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Realtime sync failed: {e}")
        raise sync_realtime_task.retry(exc=e, countdown=300)


@shared_task(
    name='claros_mis.erp_sync.tasks.sync_hourly_task',
    queue='medium',
    priority=5,
    max_retries=2
)
def sync_hourly_task():
    """
    Hourly data sync
    Syncs hourly operational and summary data
    """
    try:
        logger.info("Starting hourly sync")

        from .services import ERPConnectionManager, ERPSyncService

        conn_manager = ERPConnectionManager()
        sync_service = ERPSyncService(conn_manager)

        # Hourly tables to sync
        hourly_tables = [
            'FOORD',       # Orders
            'FOINV',       # Invoices
            'FOMTXD',      # Material transactions
        ]

        results = {}
        for table in hourly_tables:
            try:
                result = sync_service.sync_table(table, batch_size=500)
                results[table] = {
                    'status': 'success',
                    'synced_count': result.get('synced_count', 0)
                }
            except Exception as e:
                logger.error(f"Failed to sync {table}: {e}")
                results[table] = {'status': 'error', 'error': str(e)}

        logger.info(f"Hourly sync completed: {len(results)} tables")
        return {
            'sync_type': 'hourly',
            'tables': results,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Hourly sync failed: {e}")
        raise sync_hourly_task.retry(exc=e, countdown=600)


# ==========================================
# Low Priority Tasks (Batch, Background)
# ==========================================

@shared_task(
    name='claros_mis.erp_sync.tasks.batch_sync',
    queue='low',
    priority=2,
    max_retries=1
)
def batch_sync_task(tables: list = None):
    """
    Batch sync for large tables
    Runs during low traffic periods
    """
    try:
        logger.info(f"Starting batch sync: {tables}")

        from .services import ERPConnectionManager, ERPSyncService
        from utils.adaptive_batch import get_adaptive_batch_sizer

        conn_manager = ERPConnectionManager()
        sync_service = ERPSyncService(conn_manager)
        batch_sizer = get_adaptive_batch_sizer()

        # Default batch tables
        if tables is None:
            tables = [
                'FOITEM',      # Item master
                'FOCUST',      # Customer master
                'FOSUPP',      # Supplier master
                'FOWKCT',      # Work center
            ]

        # Get adaptive batch size
        batch_size = batch_sizer.get_batch_size(
            host=conn_manager.config.get('host'),
            port=conn_manager.config.get('port')
        )

        results = {}
        for table in tables:
            try:
                result = sync_service.sync_table(table, batch_size=batch_size)
                results[table] = {
                    'status': 'success',
                    'synced_count': result.get('synced_count', 0),
                    'batch_size': batch_size
                }
            except Exception as e:
                logger.error(f"Failed to sync {table}: {e}")
                results[table] = {'status': 'error', 'error': str(e)}

        logger.info(f"Batch sync completed: {len(results)} tables")
        return {
            'sync_type': 'batch',
            'tables': results,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Batch sync failed: {e}")
        raise batch_sync_task.retry(exc=e, countdown=3600)


@shared_task(
    name='claros_mis.erp_sync.tasks.full_sync',
    queue='low',
    priority=1,
    max_retries=1
)
def full_sync_task():
    """
    Full ERP data synchronization
    Runs daily (typically at midnight)
    """
    try:
        logger.info("Starting full sync")

        from .services import ERPConnectionManager, ERPSyncService

        conn_manager = ERPConnectionManager()
        sync_service = ERPSyncService(conn_manager)

        # All tables to sync
        all_tables = [
            'FOMORD', 'FOMBOM', 'FOMRTE',  # Production
            'FOORD', 'FOINV', 'FOMTXD',    # Sales/Inventory
            'FOITEM', 'FOCUST', 'FOSUPP', 'FOWKCT',  # Master data
        ]

        results = {}
        for table in all_tables:
            try:
                result = sync_service.sync_table(table, batch_size=1000)
                results[table] = {
                    'status': 'success',
                    'synced_count': result.get('synced_count', 0)
                }
            except Exception as e:
                logger.error(f"Failed to sync {table}: {e}")
                results[table] = {'status': 'error', 'error': str(e)}

        logger.info(f"Full sync completed: {len(results)} tables")
        return {
            'sync_type': 'full',
            'tables': results,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Full sync failed: {e}")
        raise full_sync_task.retry(exc=e, countdown=7200)


@shared_task(
    name='claros_mis.erp_sync.tasks.verify_sync',
    queue='medium',
    priority=4,
    max_retries=2
)
def verify_sync_task(table_name: str = None):
    """
    Verify data integrity between ERP and local DB
    """
    try:
        logger.info(f"Starting sync verification: {table_name}")

        from .services import ERPConnectionManager
        from django.db import connection

        conn_manager = ERPConnectionManager()

        # Connect to ERP
        conn_manager.connect()

        results = {}

        if table_name:
            tables = [table_name]
        else:
            tables = ['FOMORD', 'FOMBOM', 'FOITEM']

        for table in tables:
            try:
                # Get ERP count
                with conn_manager.connection.cursor() as cursor:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    erp_count = cursor.fetchone()[0]

                # Get local count
                with connection.cursor() as cursor:
                    local_table = table.lower()  # Assuming local tables use lowercase
                    cursor.execute(f"SELECT COUNT(*) FROM {local_table}")
                    local_count = cursor.fetchone()[0]

                match = erp_count == local_count
                results[table] = {
                    'erp_count': erp_count,
                    'local_count': local_count,
                    'match': match
                }

            except Exception as e:
                logger.error(f"Verification failed for {table}: {e}")
                results[table] = {'status': 'error', 'error': str(e)}

        conn_manager.disconnect()

        logger.info(f"Sync verification completed: {len(results)} tables")
        return {
            'verification_results': results,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Sync verification failed: {e}")
        raise verify_sync_task.retry(exc=e, countdown=300)
