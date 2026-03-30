# FOM ERP - Health Check Module
# Version: 2.0.0
# Description: System health monitoring and diagnostics with Prometheus metrics

import logging
import os
import psutil
from datetime import datetime
from typing import Dict, List, Any
from django.db import connection
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from django.views.decorators.http import require_GET

logger = logging.getLogger(__name__)


class HealthCheckResult:
    """Health check result container"""

    def __init__(self, component: str, status: str, message: str = "", details: Dict = None):
        self.component = component
        self.status = status  # 'healthy', 'warning', 'critical', 'unknown'
        self.message = message
        self.details = details or {}
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict:
        return {
            'component': self.component,
            'status': self.status,
            'message': self.message,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }


class HealthChecker:
    """System health checker"""

    def __init__(self):
        self.checks = [
            'database',
            'cache',
            'disk_space',
            'memory',
            'cpu',
            'erp_connection',
        ]

    def check_all(self) -> Dict[str, HealthCheckResult]:
        """Run all health checks"""
        results = {}

        for check_name in self.checks:
            check_method = getattr(self, f'check_{check_name}', None)
            if check_method:
                try:
                    results[check_name] = check_method()
                except Exception as e:
                    results[check_name] = HealthCheckResult(
                        component=check_name,
                        status='unknown',
                        message=f'Health check failed: {str(e)}'
                    )
                    logger.error(f"Health check failed for {check_name}: {e}")

        return results

    def check_database(self) -> HealthCheckResult:
        """Check database connectivity"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()

                if row and row[0] == 1:
                    return HealthCheckResult(
                        component='database',
                        status='healthy',
                        message='Database connection successful'
                    )

                return HealthCheckResult(
                    component='database',
                    status='critical',
                    message='Database query returned unexpected result'
                )

        except Exception as e:
            return HealthCheckResult(
                component='database',
                status='critical',
                message=f'Database connection failed: {str(e)}'
            )

    def check_cache(self) -> HealthCheckResult:
        """Check cache connectivity"""
        try:
            cache.set('health_check', 'ok', 10)
            value = cache.get('health_check')

            if value == 'ok':
                return HealthCheckResult(
                    component='cache',
                    status='healthy',
                    message='Cache connection successful'
                )

            return HealthCheckResult(
                component='cache',
                status='warning',
                message='Cache read failed'
            )

        except Exception as e:
            return HealthCheckResult(
                component='cache',
                status='warning',
                message=f'Cache connection failed: {str(e)}'
            )

    def check_disk_space(self) -> HealthCheckResult:
        """Check disk space"""
        try:
            disk = psutil.disk_usage('/')

            used_percent = (disk.used / disk.total) * 100
            free_gb = disk.free / (1024**3)

            if used_percent > 90:
                return HealthCheckResult(
                    component='disk_space',
                    status='critical',
                    message=f'Disk space critically low: {used_percent:.1f}% used',
                    details={
                        'used_percent': round(used_percent, 2),
                        'free_gb': round(free_gb, 2),
                        'total_gb': round(disk.total / (1024**3), 2)
                    }
                )
            elif used_percent > 75:
                return HealthCheckResult(
                    component='disk_space',
                    status='warning',
                    message=f'Disk space running low: {used_percent:.1f}% used',
                    details={
                        'used_percent': round(used_percent, 2),
                        'free_gb': round(free_gb, 2),
                        'total_gb': round(disk.total / (1024**3), 2)
                    }
                )

            return HealthCheckResult(
                component='disk_space',
                status='healthy',
                message='Disk space adequate',
                details={
                    'used_percent': round(used_percent, 2),
                    'free_gb': round(free_gb, 2),
                    'total_gb': round(disk.total / (1024**3), 2)
                }
            )

        except Exception as e:
            return HealthCheckResult(
                component='disk_space',
                status='unknown',
                message=f'Disk space check failed: {str(e)}'
            )

    def check_memory(self) -> HealthCheckResult:
        """Check memory usage"""
        try:
            mem = psutil.virtual_memory()

            if mem.percent > 90:
                return HealthCheckResult(
                    component='memory',
                    status='critical',
                    message=f'Memory usage critically high: {mem.percent}% used',
                    details={
                        'used_percent': mem.percent,
                        'available_gb': round(mem.available / (1024**3), 2),
                        'total_gb': round(mem.total / (1024**3), 2)
                    }
                )
            elif mem.percent > 75:
                return HealthCheckResult(
                    component='memory',
                    status='warning',
                    message=f'Memory usage high: {mem.percent}% used',
                    details={
                        'used_percent': mem.percent,
                        'available_gb': round(mem.available / (1024**3), 2),
                        'total_gb': round(mem.total / (1024**3), 2)
                    }
                )

            return HealthCheckResult(
                component='memory',
                status='healthy',
                message='Memory usage normal',
                details={
                    'used_percent': mem.percent,
                    'available_gb': round(mem.available / (1024**3), 2),
                    'total_gb': round(mem.total / (1024**3), 2)
                }
            )

        except Exception as e:
            return HealthCheckResult(
                component='memory',
                status='unknown',
                message=f'Memory check failed: {str(e)}'
            )

    def check_cpu(self) -> HealthCheckResult:
        """Check CPU usage"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)

            if cpu_percent > 90:
                return HealthCheckResult(
                    component='cpu',
                    status='critical',
                    message=f'CPU usage critically high: {cpu_percent}% used',
                    details={
                        'used_percent': cpu_percent,
                        'core_count': psutil.cpu_count()
                    }
                )
            elif cpu_percent > 75:
                return HealthCheckResult(
                    component='cpu',
                    status='warning',
                    message=f'CPU usage high: {cpu_percent}% used',
                    details={
                        'used_percent': cpu_percent,
                        'core_count': psutil.cpu_count()
                    }
                )

            return HealthCheckResult(
                component='cpu',
                status='healthy',
                message='CPU usage normal',
                details={
                    'used_percent': cpu_percent,
                    'core_count': psutil.cpu_count()
                }
            )

        except Exception as e:
            return HealthCheckResult(
                component='cpu',
                status='unknown',
                message=f'CPU check failed: {str(e)}'
            )

    def check_erp_connection(self) -> HealthCheckResult:
        """Check ERP (MS SQL) connection"""
        try:
            from erp_sync.services import ERPConnectionManager

            conn_manager = ERPConnectionManager()
            conn_manager.connect()
            conn_manager.disconnect()

            return HealthCheckResult(
                component='erp_connection',
                status='healthy',
                message='ERP connection successful'
            )

        except ImportError:
            return HealthCheckResult(
                component='erp_connection',
                status='warning',
                message='ERP sync module not available'
            )
        except Exception as e:
            return HealthCheckResult(
                component='erp_connection',
                status='critical',
                message=f'ERP connection failed: {str(e)}'
            )


class ServiceMonitor:
    """Service availability and performance monitoring"""

    def __init__(self):
        self.start_time = datetime.now()

    def get_uptime(self) -> str:
        """Get service uptime"""
        uptime = datetime.now() - self.start_time
        seconds = int(uptime.total_seconds())

        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60

        return f"{days}d {hours}h {minutes}m {secs}s"

    def get_service_info(self) -> Dict[str, Any]:
        """Get service information"""
        return {
            'service': 'Netplus MIS AI Dashboard',
            'version': '1.0.0',
            'environment': settings.DEBUG,
            'uptime': self.get_uptime(),
            'started_at': self.start_time.isoformat(),
            'python_version': f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
            'django_version': self._get_django_version(),
        }

    def _get_django_version(self) -> str:
        """Get Django version"""
        try:
            import django
            return django.get_version()
        except ImportError:
            return "unknown"


def get_system_health() -> Dict[str, Any]:
    """Get complete system health status"""
    checker = HealthChecker()
    monitor = ServiceMonitor()

    results = checker.check_all()

    # Update Prometheus metrics
    if getattr(settings, 'ENABLE_METRICS', False):
        try:
            from .metrics import metrics_collector
            for check_name, result in results.items():
                # Export health check status as metrics
                status_value = 1 if result.status == 'healthy' else (0.5 if result.status == 'warning' else 0)
                # Note: You can add custom metrics here if needed
        except Exception as e:
            logger.warning(f"Failed to update Prometheus metrics: {e}")

    # Determine overall status
    status_counts = {'healthy': 0, 'warning': 0, 'critical': 0, 'unknown': 0}
    for result in results.values():
        status_counts[result.status] += 1

    if status_counts['critical'] > 0:
        overall_status = 'critical'
    elif status_counts['warning'] > 0:
        overall_status = 'warning'
    elif status_counts['unknown'] > 0:
        overall_status = 'degraded'
    else:
        overall_status = 'healthy'

    return {
        'overall_status': overall_status,
        'service_info': monitor.get_service_info(),
        'checks': {name: result.to_dict() for name, result in results.items()},
        'summary': status_counts
    }


@require_GET
def health_metrics_view(request):
    """
    Prometheus health check metrics endpoint
    Returns health status as Prometheus metrics
    """
    try:
        checker = HealthChecker()
        results = checker.check_all()

        metrics_lines = []
        metrics_lines.append('# HELP netplus_health_check_status Health check status (1=healthy, 0.5=warning, 0=critical)')
        metrics_lines.append('# TYPE netplus_health_check_status gauge')

        for check_name, result in results.items():
            status_value = 1 if result.status == 'healthy' else (0.5 if result.status == 'warning' else 0)
            metrics_lines.append(f'netplus_health_check_status{{check="{check_name}"}} {status_value}')

        return HttpResponse('\n'.join(metrics_lines), content_type='text/plain')

    except Exception as e:
        logger.error(f"Health metrics view failed: {e}")
        return HttpResponse(f'# Error: {str(e)}', content_type='text/plain', status=500)
