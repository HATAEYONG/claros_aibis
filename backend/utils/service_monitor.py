# FOM ERP - Service Monitor Module
# Version: 1.0.0
# Description: Service monitoring and alerting

import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Callable, Optional
from dataclasses import dataclass, field
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


@dataclass
class Alert:
    """Alert data container"""
    id: str
    severity: str  # 'info', 'warning', 'critical'
    source: str
    message: str
    created_at: datetime = field(default_factory=datetime.now)
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    metadata: Dict = field(default_factory=dict)


@dataclass
class Metric:
    """Metric data container"""
    name: str
    value: float
    unit: str
    timestamp: datetime = field(default_factory=datetime.now)
    labels: Dict = field(default_factory=dict)


class ServiceMonitor:
    """Background service monitoring"""

    def __init__(self):
        self.is_running = False
        self.monitor_thread = None
        self.callbacks: Dict[str, List[Callable]] = {}
        self.metrics: List[Metric] = []
        self.alerts: List[Alert] = []
        self.max_metrics = 10000
        self.max_alerts = 1000

    def start(self):
        """Start monitoring service"""
        if self.is_running:
            logger.warning("Service monitor is already running")
            return

        self.is_running = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("Service monitor started")

    def stop(self):
        """Stop monitoring service"""
        self.is_running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("Service monitor stopped")

    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_running:
            try:
                self._collect_metrics()
                self._check_alerts()
                self._cleanup_old_data()
                time.sleep(60)  # Collect metrics every minute
            except Exception as e:
                logger.error(f"Monitor loop error: {e}")

    def _collect_metrics(self):
        """Collect system metrics"""
        try:
            import psutil

            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            self.record_metric(Metric(
                name='system_cpu_percent',
                value=cpu_percent,
                unit='percent'
            ))

            # Memory metrics
            mem = psutil.virtual_memory()
            self.record_metric(Metric(
                name='system_memory_percent',
                value=mem.percent,
                unit='percent'
            ))
            self.record_metric(Metric(
                name='system_memory_available_gb',
                value=mem.available / (1024**3),
                unit='gb'
            ))

            # Disk metrics
            disk = psutil.disk_usage('/')
            self.record_metric(Metric(
                name='system_disk_percent',
                value=(disk.used / disk.total) * 100,
                unit='percent'
            ))
            self.record_metric(Metric(
                name='system_disk_free_gb',
                value=disk.free / (1024**3),
                unit='gb'
            ))

        except ImportError:
            logger.warning("psutil not available for system metrics collection")
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

    def _check_alerts(self):
        """Check for alert conditions"""
        try:
            # Get latest metrics
            cpu_metrics = [m for m in self.metrics if m.name == 'system_cpu_percent']
            mem_metrics = [m for m in self.metrics if m.name == 'system_memory_percent']
            disk_metrics = [m for m in self.metrics if m.name == 'system_disk_percent']

            # CPU alerts
            if cpu_metrics:
                latest_cpu = cpu_metrics[-1].value
                if latest_cpu > 90:
                    self.create_alert(
                        severity='critical',
                        source='system_monitor',
                        message=f'CPU usage critically high: {latest_cpu:.1f}%',
                        metadata={'cpu_percent': latest_cpu}
                    )
                elif latest_cpu > 75:
                    self.create_alert(
                        severity='warning',
                        source='system_monitor',
                        message=f'CPU usage high: {latest_cpu:.1f}%',
                        metadata={'cpu_percent': latest_cpu}
                    )

            # Memory alerts
            if mem_metrics:
                latest_mem = mem_metrics[-1].value
                if latest_mem > 90:
                    self.create_alert(
                        severity='critical',
                        source='system_monitor',
                        message=f'Memory usage critically high: {latest_mem:.1f}%',
                        metadata={'memory_percent': latest_mem}
                    )
                elif latest_mem > 75:
                    self.create_alert(
                        severity='warning',
                        source='system_monitor',
                        message=f'Memory usage high: {latest_mem:.1f}%',
                        metadata={'memory_percent': latest_mem}
                    )

            # Disk alerts
            if disk_metrics:
                latest_disk = disk_metrics[-1].value
                if latest_disk > 90:
                    self.create_alert(
                        severity='critical',
                        source='system_monitor',
                        message=f'Disk usage critically high: {latest_disk:.1f}%',
                        metadata={'disk_percent': latest_disk}
                    )
                elif latest_disk > 75:
                    self.create_alert(
                        severity='warning',
                        source='system_monitor',
                        message=f'Disk usage high: {latest_disk:.1f}%',
                        metadata={'disk_percent': latest_disk}
                    )

        except Exception as e:
            logger.error(f"Error checking alerts: {e}")

    def _cleanup_old_data(self):
        """Clean up old metrics and alerts"""
        # Clean old metrics (keep last max_metrics)
        if len(self.metrics) > self.max_metrics:
            self.metrics = self.metrics[-self.max_metrics:]

        # Clean old alerts (keep last max_alerts)
        if len(self.alerts) > self.max_alerts:
            self.alerts = self.alerts[-self.max_alerts:]

        # Clean alerts older than 24 hours
        cutoff = datetime.now() - timedelta(hours=24)
        self.alerts = [a for a in self.alerts if a.created_at > cutoff or not a.resolved]

    def record_metric(self, metric: Metric):
        """Record a metric"""
        self.metrics.append(metric)
        self._trigger_callbacks('metric', metric)

    def create_alert(self, severity: str, source: str, message: str, metadata: Dict = None):
        """Create an alert"""
        # Check for duplicate recent alerts
        recent_alerts = [
            a for a in self.alerts
            if not a.resolved
            and a.source == source
            and a.message == message
            and (datetime.now() - a.created_at) < timedelta(minutes=5)
        ]

        if recent_alerts:
            return  # Duplicate alert, skip

        alert = Alert(
            id=f"alert_{int(datetime.now().timestamp())}",
            severity=severity,
            source=source,
            message=message,
            metadata=metadata or {}
        )

        self.alerts.append(alert)
        self._trigger_callbacks('alert', alert)

        logger.warning(f"Alert created: [{severity.upper()}] {source}: {message}")

    def resolve_alert(self, alert_id: str):
        """Resolve an alert"""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.now()
                logger.info(f"Alert resolved: {alert_id}")
                return

    def register_callback(self, event_type: str, callback: Callable):
        """Register a callback for events"""
        if event_type not in self.callbacks:
            self.callbacks[event_type] = []
        self.callbacks[event_type].append(callback)

    def _trigger_callbacks(self, event_type: str, data):
        """Trigger callbacks for an event type"""
        if event_type in self.callbacks:
            for callback in self.callbacks[event_type]:
                try:
                    callback(data)
                except Exception as e:
                    logger.error(f"Callback error: {e}")

    def get_metrics(self, name: str = None, since: datetime = None) -> List[Metric]:
        """Get metrics"""
        metrics = self.metrics

        if name:
            metrics = [m for m in metrics if m.name == name]

        if since:
            metrics = [m for m in metrics if m.timestamp >= since]

        return metrics

    def get_alerts(self, severity: str = None, resolved: bool = None) -> List[Alert]:
        """Get alerts"""
        alerts = self.alerts

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        if resolved is not None:
            alerts = [a for a in alerts if a.resolved == resolved]

        return alerts

    def get_summary(self) -> Dict:
        """Get monitoring summary"""
        active_alerts = [a for a in self.alerts if not a.resolved]

        return {
            'is_running': self.is_running,
            'metrics_count': len(self.metrics),
            'alerts_count': len(self.alerts),
            'active_alerts_count': len(active_alerts),
            'latest_metrics': {
                m.name: m.value
                for m in self.metrics[-10:]
            },
            'active_alerts': [
                {
                    'id': a.id,
                    'severity': a.severity,
                    'source': a.source,
                    'message': a.message,
                    'created_at': a.created_at.isoformat()
                }
                for a in active_alerts[-10:]
            ]
        }


# Global service monitor instance
_service_monitor: Optional[ServiceMonitor] = None


def get_service_monitor() -> ServiceMonitor:
    """Get the global service monitor instance"""
    global _service_monitor

    if _service_monitor is None:
        _service_monitor = ServiceMonitor()

    return _service_monitor


def start_service_monitor():
    """Start the service monitor"""
    monitor = get_service_monitor()
    monitor.start()
    return monitor


def stop_service_monitor():
    """Stop the service monitor"""
    global _service_monitor

    if _service_monitor:
        _service_monitor.stop()
        _service_monitor = None
