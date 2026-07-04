"""
Observability Module

Complete system monitoring and observability
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class SystemMonitor:
    """
    System Performance Monitor

    Monitors all aspects of the AI system
    """

    def __init__(
        self,
        metrics_retention_days: int = 30,
        alert_thresholds: Dict[str, float] = None
    ):
        """
        Initialize System Monitor

        Args:
            metrics_retention_days: Days to retain metrics
            alert_thresholds: Thresholds for alerts
        """
        self.metrics_retention_days = metrics_retention_days
        self.alert_thresholds = alert_thresholds or {
            'error_rate': 0.05,
            'latency_p95': 200,
            'cpu_usage': 0.8,
            'memory_usage': 0.85
        }

        self.metrics_store = defaultdict(list)
        self.alerts = []
        self.monitoring_start = datetime.now()

    def record_metric(
        self,
        metric_name: str,
        value: float,
        labels: Dict[str, str] = None
    ) -> None:
        """
        Record a metric

        Args:
            metric_name: Name of the metric
            value: Metric value
            labels: Additional labels
        """
        timestamp = datetime.now()

        self.metrics_store[metric_name].append({
            'timestamp': timestamp,
            'value': float(value),
            'labels': labels or {}
        })

        # Prune old metrics
        cutoff = timestamp - timedelta(days=self.metrics_retention_days)
        self.metrics_store[metric_name] = [
            m for m in self.metrics_store[metric_name]
            if m['timestamp'] > cutoff
        ]

        # Check for alerts
        self._check_alerts(metric_name, value)

    def _check_alerts(
        self,
        metric_name: str,
        value: float
    ) -> None:
        """Check if metric exceeds thresholds"""
        if metric_name in self.alert_thresholds:
            threshold = self.alert_thresholds[metric_name]
            if value > threshold:
                alert = {
                    'timestamp': datetime.now(),
                    'metric': metric_name,
                    'value': value,
                    'threshold': threshold,
                    'severity': 'warning' if value < threshold * 1.5 else 'critical'
                }
                self.alerts.append(alert)
                logger.warning(f"Alert: {metric_name} = {value} > {threshold}")

    def get_metrics(
        self,
        metric_name: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get metrics for a specific metric

        Args:
            metric_name: Name of the metric
            start_time: Start time filter
            end_time: End time filter

        Returns:
            List of metric values
        """
        if metric_name not in self.metrics_store:
            return []

        metrics = self.metrics_store[metric_name]

        if start_time:
            metrics = [m for m in metrics if m['timestamp'] >= start_time]
        if end_time:
            metrics = [m for m in metrics if m['timestamp'] <= end_time]

        return metrics

    def get_metric_summary(
        self,
        metric_name: str,
        window_minutes: int = 60
    ) -> Dict[str, float]:
        """
        Get metric summary

        Args:
            metric_name: Name of the metric
            window_minutes: Time window in minutes

        Returns:
            Summary statistics
        """
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=window_minutes)

        metrics = self.get_metrics(metric_name, start_time, end_time)

        if not metrics:
            return {}

        values = [m['value'] for m in metrics]

        return {
            'count': len(values),
            'mean': float(np.mean(values)),
            'std': float(np.std(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'p50': float(np.percentile(values, 50)),
            'p95': float(np.percentile(values, 95)),
            'p99': float(np.percentile(values, 99))
        }

    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        health = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'uptime_seconds': (datetime.now() - self.monitoring_start).total_seconds(),
            'metrics': {}
        }

        # Get summary for all tracked metrics
        for metric_name in self.metrics_store.keys():
            summary = self.get_metric_summary(metric_name, window_minutes=5)

            if summary:
                health['metrics'][metric_name] = summary

                # Check health status
                if metric_name in self.alert_thresholds:
                    if summary.get('mean', 0) > self.alert_thresholds[metric_name]:
                        health['status'] = 'unhealthy'

        return health


class AlertManager:
    """
    Alert Manager

    Manages alerts and notifications
    """

    def __init__(
        self,
        alert_channels: List[str] = None,
        severity_levels: List[str] = None
    ):
        """
        Initialize Alert Manager

        Args:
            alert_channels: Available alert channels
            severity_levels: Severity levels
        """
        self.alert_channels = alert_channels or ['email', 'slack', 'pagerduty']
        self.severity_levels = severity_levels or ['info', 'warning', 'critical']

        self.active_alerts = []
        self.alert_history = []
        self.alert_rules = {}

    def create_alert_rule(
        self,
        rule_id: str,
        condition: Dict[str, Any],
        severity: str = 'warning',
        channels: List[str] = None
    ) -> bool:
        """
        Create alert rule

        Args:
            rule_id: Unique rule identifier
            condition: Alert condition
            severity: Alert severity
            channels: Notification channels

        Returns:
            True if successful
        """
        self.alert_rules[rule_id] = {
            'condition': condition,
            'severity': severity,
            'channels': channels or ['email'],
            'created_at': datetime.now()
        }

        logger.info(f"Alert rule created: {rule_id}")
        return True

    def evaluate_alert_rules(
        self,
        metrics: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Evaluate alert rules against metrics

        Args:
            metrics: Current metrics

        Returns:
            Triggered alerts
        """
        triggered = []

        for rule_id, rule in self.alert_rules.items():
            if self._evaluate_condition(rule['condition'], metrics):
                alert = {
                    'rule_id': rule_id,
                    'severity': rule['severity'],
                    'channels': rule['channels'],
                    'timestamp': datetime.now(),
                    'metrics': metrics
                }

                triggered.append(alert)
                self.active_alerts.append(alert)
                self.alert_history.append(alert)

                # Send notifications
                self._send_notifications(alert)

        return triggered

    def _evaluate_condition(
        self,
        condition: Dict[str, Any],
        metrics: Dict[str, float]
    ) -> bool:
        """Evaluate alert condition"""
        metric = condition.get('metric')
        operator = condition.get('operator', '>')
        threshold = condition.get('threshold', 0)

        if metric not in metrics:
            return False

        value = metrics[metric]

        if operator == '>':
            return value > threshold
        elif operator == '<':
            return value < threshold
        elif operator == '>=':
            return value >= threshold
        elif operator == '<=':
            return value <= threshold
        elif operator == '==':
            return value == threshold
        else:
            return False

    def _send_notifications(self, alert: Dict[str, Any]) -> None:
        """Send alert notifications"""
        for channel in alert['channels']:
            logger.info(f"Sending {alert['severity']} alert to {channel}")

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get active alerts"""
        return self.active_alerts.copy()

    def acknowledge_alert(
        self,
        alert_id: str,
        user: str
    ) -> bool:
        """
        Acknowledge an alert

        Args:
            alert_id: Alert identifier
            user: User acknowledging

        Returns:
            True if successful
        """
        for alert in self.active_alerts:
            if alert.get('id') == alert_id:
                alert['acknowledged'] = True
                alert['acknowledged_by'] = user
                alert['acknowledged_at'] = datetime.now()
                return True

        return False


class DashboardGenerator:
    """
    Dashboard Generator

    Creates monitoring dashboards
    """

    def __init__(
        self,
        refresh_interval: int = 30,
        dashboard_templates: Dict[str, Dict] = None
    ):
        """
        Initialize Dashboard Generator

        Args:
            refresh_interval: Dashboard refresh interval (seconds)
            dashboard_templates: Predefined dashboard templates
        """
        self.refresh_interval = refresh_interval
        self.dashboard_templates = dashboard_templates or self._get_default_templates()

    def _get_default_templates(self) -> Dict[str, Dict]:
        """Get default dashboard templates"""
        return {
            'overview': {
                'title': 'System Overview',
                'panels': [
                    {'type': 'metric', 'title': 'Request Rate', 'metric': 'requests_per_second'},
                    {'type': 'metric', 'title': 'Error Rate', 'metric': 'error_rate'},
                    {'type': 'metric', 'title': 'Latency (p95)', 'metric': 'latency_p95'},
                    {'type': 'metric', 'title': 'CPU Usage', 'metric': 'cpu_usage'}
                ]
            },
            'predictions': {
                'title': 'Prediction Metrics',
                'panels': [
                    {'type': 'graph', 'title': 'Prediction Volume', 'metric': 'prediction_count'},
                    {'type': 'graph', 'title': 'Model Accuracy', 'metric': 'accuracy'},
                    {'type': 'graph', 'title': 'Prediction Latency', 'metric': 'prediction_latency'}
                ]
            },
            'models': {
                'title': 'Model Performance',
                'panels': [
                    {'type': 'table', 'title': 'Model Rankings', 'metric': 'model_rankings'},
                    {'type': 'heatmap', 'title': 'Model Usage', 'metric': 'model_usage'}
                ]
            }
        }

    def generate_dashboard(
        self,
        template_name: str,
        time_range: str = '1h'
    ) -> Dict[str, Any]:
        """
        Generate dashboard

        Args:
            template_name: Template to use
            time_range: Time range for data

        Returns:
            Dashboard configuration
        """
        if template_name not in self.dashboard_templates:
            return {
                'error': f'Template {template_name} not found'
            }

        template = self.dashboard_templates[template_name]

        return {
            'title': template['title'],
            'refresh_interval': self.refresh_interval,
            'time_range': time_range,
            'panels': [
                self._render_panel(panel, time_range)
                for panel in template['panels']
            ]
        }

    def _render_panel(
        self,
        panel: Dict[str, Any],
        time_range: str
    ) -> Dict[str, Any]:
        """Render dashboard panel"""
        return {
            'title': panel['title'],
            'type': panel['type'],
            'metric': panel['metric'],
            'time_range': time_range,
            'queries': self._generate_queries(panel['metric'], time_range)
        }

    def _generate_queries(
        self,
        metric: str,
        time_range: str
    ) -> List[str]:
        """Generate queries for metric"""
        # Simulated query generation
        return [
            f"SELECT mean({metric}) FROM metrics WHERE time > now() - {time_range}",
            f"SELECT max({metric}) FROM metrics WHERE time > now() - {time_range}",
            f"SELECT min({metric}) FROM metrics WHERE time > now() - {time_range}"
        ]

    def create_custom_dashboard(
        self,
        title: str,
        panels: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create custom dashboard

        Args:
            title: Dashboard title
            panels: Panel configurations

        Returns:
            Dashboard configuration
        """
        return {
            'title': title,
            'refresh_interval': self.refresh_interval,
            'panels': [
                self._render_panel(panel, '1h')
                for panel in panels
            ]
        }


class TelemetryCollector:
    """
    Telemetry Collector

    Collects telemetry data from the system
    """

    def __init__(
        self,
        sampling_rate: float = 1.0,
        batch_size: int = 100
    ):
        """
        Initialize Telemetry Collector

        Args:
            sampling_rate: Sampling rate (0-1)
            batch_size: Batch size for sending telemetry
        """
        self.sampling_rate = sampling_rate
        self.batch_size = batch_size

        self.telemetry_buffer = []
        self.session_id = self._generate_session_id()

    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{np.random.randint(10000)}"

    def collect_event(
        self,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> None:
        """
        Collect telemetry event

        Args:
            event_type: Type of event
            event_data: Event data
        """
        if np.random.rand() > self.sampling_rate:
            return

        event = {
            'timestamp': datetime.now().isoformat(),
            'session_id': self.session_id,
            'event_type': event_type,
            'data': event_data
        }

        self.telemetry_buffer.append(event)

        # Flush buffer if full
        if len(self.telemetry_buffer) >= self.batch_size:
            self._flush_telemetry()

    def _flush_telemetry(self) -> None:
        """Flush telemetry buffer"""
        if not self.telemetry_buffer:
            return

        logger.info(f"Flushing {len(self.telemetry_buffer)} telemetry events")

        # In production, would send to telemetry backend
        self.telemetry_buffer = []

    def get_telemetry_summary(self) -> Dict[str, Any]:
        """Get telemetry summary"""
        return {
            'session_id': self.session_id,
            'events_collected': len(self.telemetry_buffer),
            'sampling_rate': self.sampling_rate,
            'buffer_size': len(self.telemetry_buffer)
        }


# Utility functions
def create_system_monitor(
    retention_days: int = 30
) -> SystemMonitor:
    """Create system monitor"""
    return SystemMonitor(metrics_retention_days=retention_days)


def create_alert_manager(
    channels: List[str] = None
) -> AlertManager:
    """Create alert manager"""
    return AlertManager(alert_channels=channels)


def create_dashboard_generator(
    refresh_interval: int = 30
) -> DashboardGenerator:
    """Create dashboard generator"""
    return DashboardGenerator(refresh_interval=refresh_interval)


def create_telemetry_collector(
    sampling_rate: float = 1.0
) -> TelemetryCollector:
    """Create telemetry collector"""
    return TelemetryCollector(sampling_rate=sampling_rate)
