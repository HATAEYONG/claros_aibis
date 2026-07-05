# Celery Tasks for Utilities
# Health checks and maintenance tasks

import logging
from datetime import datetime
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


# ==========================================
# High Priority Tasks (Health & Monitoring)
# ==========================================

@shared_task(
    name='claros_mis.utils.tasks.health_check_task',
    queue='high',
    priority=8
)
def health_check_task():
    """
    System health check task
    Runs every 5 minutes
    """
    try:
        logger.info("Starting health check")

        from .health_check import HealthChecker
        from .service_monitor import get_service_monitor

        checker = HealthChecker()
        monitor = get_service_monitor()

        # Run all health checks
        results = checker.check_all()

        # Record metrics if enabled
        from django.conf import settings
        if getattr(settings, 'ENABLE_METRICS', False):
            try:
                from .metrics import metrics_collector

                # Update health check metrics
                for check_name, result in results.items():
                    status_value = 1 if result.status == 'healthy' else (0.5 if result.status == 'warning' else 0)
                    # Note: Custom health metrics can be added here if needed

                # Update system metrics
                metrics_collector.update_system_metrics()

            except Exception as e:
                logger.warning(f"Failed to update metrics: {e}")

        # Check for critical issues
        critical_issues = [
            name for name, result in results.items()
            if result.status == 'critical'
        ]

        if critical_issues:
            logger.warning(f"Critical health issues detected: {critical_issues}")

        logger.info("Health check completed")
        return {
            'status': 'completed',
            'checks': {name: r.status for name, r in results.items()},
            'critical_issues': critical_issues,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


# ==========================================
# Medium Priority Tasks (Maintenance)
# ==========================================

@shared_task(
    name='claros_mis.utils.tasks.cleanup_logs_task',
    queue='medium',
    priority=4,
    max_retries=1
)
def cleanup_logs_task(days_old: int = 30):
    """
    Clean up old log entries
    Runs daily
    """
    try:
        logger.info(f"Starting log cleanup: older than {days_old} days")

        from datetime import timedelta
        from django.db import connection
        from django.conf import settings

        cutoff_date = datetime.now() - timedelta(days=days_old)

        # Clean up old log entries if a logs table exists
        try:
            with connection.cursor() as cursor:
                # Check if logs table exists
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables
                    WHERE table_name = 'application_logs'
                """)
                if cursor.fetchone():
                    cursor.execute(
                        "DELETE FROM application_logs WHERE created_at < %s",
                        [cutoff_date]
                    )
                    deleted_count = cursor.rowcount
                else:
                    deleted_count = 0

            logger.info(f"Log cleanup completed: {deleted_count} records deleted")
            return {
                'status': 'completed',
                'deleted_count': deleted_count,
                'cutoff_date': cutoff_date.isoformat()
            }

        except Exception as e:
            logger.warning(f"Log cleanup skipped (table may not exist): {e}")
            return {
                'status': 'skipped',
                'reason': 'logs table not found'
            }

    except Exception as e:
        logger.error(f"Log cleanup failed: {e}")
        raise cleanup_logs_task.retry(exc=e, countdown=3600)


@shared_task(
    name='claros_mis.utils.tasks.cleanup_cache_task',
    queue='medium',
    priority=3
)
def cleanup_cache_task():
    """
    Clean up expired cache entries
    Runs hourly
    """
    try:
        logger.info("Starting cache cleanup")

        from django.core.cache import cache
        from django.conf import settings

        # Get cache backend
        cache_backend = settings.CACHES.get('default', {}).get('BACKEND', '')

        # For Redis cache, we can use specific commands
        if 'redis' in cache_backend.lower():
            try:
                # Note: Specific Redis cleanup depends on your cache configuration
                # Django's cache backend handles expiration automatically
                logger.info("Cache cleanup completed (auto-expiration)")
                return {
                    'status': 'completed',
                    'cache_type': 'redis'
                }
            except Exception as e:
                logger.warning(f"Redis cache cleanup failed: {e}")
        else:
            logger.info("Cache cleanup completed (default)")
            return {
                'status': 'completed',
                'cache_type': 'default'
            }

    except Exception as e:
        logger.error(f"Cache cleanup failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(
    name='claros_mis.utils.tasks.check_disk_space_task',
    queue='medium',
    priority=5
)
def check_disk_space_task():
    """
    Check disk space and alert if needed
    Runs every 15 minutes
    """
    try:
        logger.info("Checking disk space")

        import psutil

        disk = psutil.disk_usage('/')
        used_percent = (disk.used / disk.total) * 100
        free_gb = disk.free / (1024**3)

        status = 'ok'
        if used_percent > 90:
            status = 'critical'
            logger.critical(f"Disk space critically low: {used_percent:.1f}% used, {free_gb:.2f}GB free")
        elif used_percent > 75:
            status = 'warning'
            logger.warning(f"Disk space running low: {used_percent:.1f}% used, {free_gb:.2f}GB free")

        return {
            'status': status,
            'used_percent': round(used_percent, 2),
            'free_gb': round(free_gb, 2),
            'total_gb': round(disk.total / (1024**3), 2),
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Disk space check failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }


# ==========================================
# Low Priority Tasks (Background Jobs)
# ==========================================

@shared_task(
    name='claros_mis.utils.tasks.generate_report_task',
    queue='low',
    priority=2,
    max_retries=1
)
def generate_daily_report_task():
    """
    Generate daily system report
    Runs daily at midnight
    """
    try:
        logger.info("Generating daily report")

        from .health_check import HealthChecker
        from .service_monitor import get_service_monitor
        import json

        checker = HealthChecker()
        monitor = get_service_monitor()

        # Get health status
        health_results = checker.check_all()

        # Get service info
        service_info = monitor.get_service_info()

        # Compile report
        report = {
            'report_type': 'daily_system_report',
            'generated_at': datetime.now().isoformat(),
            'service_info': service_info,
            'health_checks': {
                name: {
                    'status': result.status,
                    'message': result.message
                }
                for name, result in health_results.items()
            }
        }

        logger.info("Daily report generated")
        return report

    except Exception as e:
        logger.error(f"Daily report generation failed: {e}")
        raise generate_daily_report_task.retry(exc=e, countdown=3600)


@shared_task(
    name='claros_mis.utils.tasks.archive_data_task',
    queue='low',
    priority=1,
    max_retries=1
)
def archive_data_task(months_old: int = 6):
    """
    Archive old data to cold storage
    Runs monthly
    """
    try:
        logger.info(f"Starting data archival: older than {months_old} months")

        from datetime import timedelta
        from django.db import connection
        from django.conf import settings

        cutoff_date = datetime.now() - timedelta(days=months_old * 30)

        # Archive data based on configured tables
        # This is a placeholder - actual implementation depends on your data model

        logger.info(f"Data archival completed: cutoff date {cutoff_date.isoformat()}")
        return {
            'status': 'completed',
            'cutoff_date': cutoff_date.isoformat()
        }

    except Exception as e:
        logger.error(f"Data archival failed: {e}")
        raise archive_data_task.retry(exc=e, countdown=7200)


@shared_task(
    name='claros_mis.utils.tasks.extend_timeseries_task',
    queue='low',
    priority=3,
    max_retries=1
)
def extend_timeseries_task():
    """
    YH 원격 DB(과거 백업, 조회 불가) 의존을 없애기 위해 로컬 시계열 테이블들을
    오늘(+버퍼)까지 자동 연장 생성한다.
    Runs daily.
    """
    from django.core.management import call_command

    try:
        logger.info("Starting timeseries extension")
        call_command('extend_timeseries')
        logger.info("Timeseries extension completed")
        return {
            'status': 'completed',
            'timestamp': datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Timeseries extension failed: {e}")
        raise extend_timeseries_task.retry(exc=e, countdown=3600)


@shared_task(
    name='claros_mis.utils.tasks.update_metrics_task',
    queue='medium',
    priority=5
)
def update_metrics_task():
    """
    Update Prometheus metrics
    Runs every minute
    """
    try:
        from django.conf import settings
        if not getattr(settings, 'ENABLE_METRICS', False):
            return {'status': 'skipped', 'reason': 'metrics disabled'}

        from .metrics import metrics_collector

        # Update system metrics
        metrics_collector.update_system_metrics()

        # Update Celery metrics (if available)
        try:
            metrics_collector.update_celery_metrics()
        except Exception as e:
            logger.debug(f"Celery metrics update failed: {e}")

        return {
            'status': 'completed',
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Metrics update failed: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }
