# Prometheus Metrics Module
# Custom metrics collection for Claros MIS-AI Dashboard

import time
import os
import logging
from typing import Dict, List, Optional
from prometheus_client import (
    Counter, Gauge, Histogram, Summary, Info,
    CollectorRegistry, multiprocess, start_http_server,
    REGISTRY
)
from prometheus_client.exposition import generate_latest

logger = logging.getLogger(__name__)


class MetricsCollector:
    """
    Centralized metrics collector for Prometheus
    """

    def __init__(self):
        self.registry = CollectorRegistry()

        # Enable multiprocess mode for uWSGI/Gunicorn
        if 'PROMETHEUS_MULTIPROC_DIR' in os.environ:
            multiprocess.MultiProcessCollector(self.registry)

        # ==========================================
        # HTTP Request Metrics
        # ==========================================
        self.http_requests_total = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status'],
            registry=self.registry
        )

        self.http_request_duration_seconds = Histogram(
            'http_request_duration_seconds',
            'HTTP request latency',
            ['method', 'endpoint'],
            buckets=(.005, .01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0, 7.5, 10.0),
            registry=self.registry
        )

        self.http_requests_in_progress = Gauge(
            'http_requests_in_progress',
            'HTTP requests currently in progress',
            ['method', 'endpoint'],
            registry=self.registry
        )

        self.http_response_size_bytes = Histogram(
            'http_response_size_bytes',
            'HTTP response size',
            ['method', 'endpoint'],
            registry=self.registry
        )

        # ==========================================
        # System Metrics
        # ==========================================
        self.system_cpu_usage = Gauge(
            'system_cpu_usage_percent',
            'System CPU usage percentage',
            registry=self.registry
        )

        self.system_memory_usage = Gauge(
            'system_memory_usage_percent',
            'System memory usage percentage',
            registry=self.registry
        )

        self.system_disk_usage = Gauge(
            'system_disk_usage_percent',
            'System disk usage percentage',
            ['mount_point'],
            registry=self.registry
        )

        self.system_memory_available_bytes = Gauge(
            'system_memory_available_bytes',
            'System available memory in bytes',
            registry=self.registry
        )

        # ==========================================
        # Database Metrics
        # ==========================================
        self.db_connections_total = Gauge(
            'db_connections_total',
            'Total database connections',
            ['database', 'state'],
            registry=self.registry
        )

        self.db_query_duration_seconds = Histogram(
            'db_query_duration_seconds',
            'Database query duration',
            ['database', 'operation'],
            registry=self.registry
        )

        self.db_queries_total = Counter(
            'db_queries_total',
            'Total database queries',
            ['database', 'operation', 'status'],
            registry=self.registry
        )

        # ==========================================
        # Cache Metrics
        # ==========================================
        self.cache_operations_total = Counter(
            'cache_operations_total',
            'Total cache operations',
            ['operation', 'status'],
            registry=self.registry
        )

        self.cache_hit_ratio = Gauge(
            'cache_hit_ratio',
            'Cache hit ratio',
            ['cache_type'],
            registry=self.registry
        )

        # ==========================================
        # AI/Prediction Metrics
        # ==========================================
        self.ai_predictions_total = Counter(
            'ai_predictions_total',
            'Total AI predictions',
            ['model_type', 'status'],
            registry=self.registry
        )

        self.ai_prediction_duration_seconds = Histogram(
            'ai_prediction_duration_seconds',
            'AI prediction duration',
            ['model_type'],
            registry=self.registry
        )

        self.ai_model_accuracy = Gauge(
            'ai_model_accuracy',
            'AI model accuracy',
            ['model_type', 'metric_type'],
            registry=self.registry
        )

        # ==========================================
        # Celery Task Metrics
        # ==========================================
        self.celery_tasks_total = Counter(
            'celery_tasks_total',
            'Total Celery tasks',
            ['task_name', 'status', 'queue'],
            registry=self.registry
        )

        self.celery_task_duration_seconds = Histogram(
            'celery_task_duration_seconds',
            'Celery task duration',
            ['task_name', 'queue'],
            buckets=(.1, .5, 1, 2, 5, 10, 30, 60, 120, 300),
            registry=self.registry
        )

        self.celery_queue_length = Gauge(
            'celery_queue_length',
            'Celery queue length',
            ['queue'],
            registry=self.registry
        )

        self.celery_workers_active = Gauge(
            'celery_workers_active',
            'Number of active Celery workers',
            registry=self.registry
        )

        # ==========================================
        # Business Metrics
        # ==========================================
        self.kpi_calculation_duration_seconds = Histogram(
            'kpi_calculation_duration_seconds',
            'KPI calculation duration',
            ['kpi_type'],
            registry=self.registry
        )

        self.erp_sync_duration_seconds = Histogram(
            'erp_sync_duration_seconds',
            'ERP sync duration',
            ['sync_type', 'table'],
            registry=self.registry
        )

        self.erp_sync_records_total = Counter(
            'erp_sync_records_total',
            'Total ERP sync records',
            ['sync_type', 'table', 'status'],
            registry=self.registry
        )

        # ==========================================
        # Application Info
        # ==========================================
        self.app_info = Info(
            'app',
            'Application information',
            registry=self.registry
        )

        self.app_info.info({
            'name': 'claros-mis',
            'version': '1.0.0',
            'environment': os.getenv('DJANGO_ENV', 'development')
        })

    def record_request(self, method: str, path: str, status: int, duration: float):
        """Record HTTP request metrics"""
        endpoint = self._normalize_path(path)
        self.http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status=status
        ).inc()
        self.http_request_duration_seconds.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)

    def record_db_query(self, database: str, operation: str, duration: float, status: str = 'success'):
        """Record database query metrics"""
        self.db_queries_total.labels(
            database=database,
            operation=operation,
            status=status
        ).inc()
        self.db_query_duration_seconds.labels(
            database=database,
            operation=operation
        ).observe(duration)

    def record_cache_operation(self, operation: str, status: str):
        """Record cache operation metrics"""
        self.cache_operations_total.labels(
            operation=operation,
            status=status
        ).inc()

    def record_ai_prediction(self, model_type: str, duration: float, status: str = 'success'):
        """Record AI prediction metrics"""
        self.ai_predictions_total.labels(
            model_type=model_type,
            status=status
        ).inc()
        self.ai_prediction_duration_seconds.labels(
            model_type=model_type
        ).observe(duration)

    def record_celery_task(self, task_name: str, queue: str, duration: float, status: str = 'success'):
        """Record Celery task metrics"""
        self.celery_tasks_total.labels(
            task_name=task_name,
            status=status,
            queue=queue
        ).inc()
        self.celery_task_duration_seconds.labels(
            task_name=task_name,
            queue=queue
        ).observe(duration)

    def record_kpi_calculation(self, kpi_type: str, duration: float):
        """Record KPI calculation metrics"""
        self.kpi_calculation_duration_seconds.labels(
            kpi_type=kpi_type
        ).observe(duration)

    def record_erp_sync(self, sync_type: str, table: str, duration: float, records: int, status: str = 'success'):
        """Record ERP sync metrics"""
        self.erp_sync_duration_seconds.labels(
            sync_type=sync_type,
            table=table
        ).observe(duration)
        self.erp_sync_records_total.labels(
            sync_type=sync_type,
            table=table,
            status=status
        ).inc(records)

    def update_system_metrics(self):
        """Update system metrics (CPU, memory, disk)"""
        try:
            import psutil

            # CPU
            self.system_cpu_usage.set(psutil.cpu_percent(interval=0.1))

            # Memory
            mem = psutil.virtual_memory()
            self.system_memory_usage.set(mem.percent)
            self.system_memory_available_bytes.set(mem.available)

            # Disk
            disk = psutil.disk_usage('/')
            self.system_disk_usage.labels(mount_point='/').set(
                (disk.used / disk.total) * 100
            )

        except ImportError:
            logger.warning("psutil not available for system metrics")
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")

    def update_celery_metrics(self):
        """Update Celery queue and worker metrics"""
        try:
            from celery import current_app
            from celery.task.control import inspect

            insp = inspect()

            # Get active workers
            stats = insp.stats()
            if stats:
                self.celery_workers_active.set(len(stats))

            # Get queue lengths
            active_queues = insp.active_queues()
            if active_queues:
                for worker, queues in active_queues.items():
                    for queue_info in queues:
                        queue_name = queue_info.get('name', 'default')
                        # Note: getting actual queue length requires Redis inspection
                        # This is a simplified version
                        self.celery_queue_length.labels(queue=queue_name).set(0)

        except Exception as e:
            logger.error(f"Error updating Celery metrics: {e}")

    def _normalize_path(self, path: str) -> str:
        """Normalize path for metrics (replace IDs with placeholders)"""
        # Common API patterns
        replacements = [
            (r'/api/\d+', '/api/:id'),
            (r'/api/[^/]+/\d+', '/api/:resource/:id'),
            (r'/api/[^/]+/[^/]+/\d+', '/api/:resource/:sub/:id'),
        ]

        import re
        for pattern, replacement in replacements:
            if re.match(pattern, path):
                return replacement

        return path

    def get_metrics(self) -> bytes:
        """Get metrics in Prometheus format"""
        return generate_latest(self.registry)


# Global metrics collector instance
_metrics_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """Get the global metrics collector instance"""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector


def start_metrics_server(port: int = 9090):
    """Start Prometheus metrics HTTP server"""
    start_http_server(port)
    logger.info(f"Prometheus metrics server started on port {port}")


metrics_collector = get_metrics_collector()
