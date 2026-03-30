# Adaptive Batch Size Module
# Dynamically adjust batch size based on network conditions

import time
import socket
import logging
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class NetworkCondition(Enum):
    """Network condition levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    VERY_POOR = "very_poor"
    UNAVAILABLE = "unavailable"


@dataclass
class NetworkMetrics:
    """Network metrics data"""
    latency_ms: float
    packet_loss_percent: float
    bandwidth_mbps: Optional[float] = None
    last_check: datetime = None

    def __post_init__(self):
        if self.last_check is None:
            self.last_check = datetime.now()


@dataclass
class BatchSizeConfig:
    """Batch size configuration"""
    min_batch_size: int = 100
    max_batch_size: int = 5000
    initial_batch_size: int = 1000

    # Network condition thresholds (latency in ms)
    excellent_threshold: float = 50
    good_threshold: float = 150
    fair_threshold: float = 300
    poor_threshold: float = 500

    # Batch sizes for each condition
    excellent_batch_size: int = 5000
    good_batch_size: int = 2000
    fair_batch_size: int = 1000
    poor_batch_size: int = 500
    very_poor_batch_size: int = 100

    # Adaptive settings
    increase_factor: float = 1.1  # 10% increase on success
    decrease_factor: float = 0.5  # 50% decrease on failure
    max_increase_rate: int = 500  # Maximum increase per adjustment
    min_decrease_rate: int = 50   # Minimum decrease per adjustment


class NetworkHealthChecker:
    """
    Check network health and connection quality
    """

    def __init__(self, config: BatchSizeConfig = None):
        self.config = config or BatchSizeConfig()
        self._metrics_cache_key = 'network_metrics'
        self._condition_cache_key = 'network_condition'
        self._cache_timeout = 60  # Cache for 1 minute

    def check_network_health(self, host: str = None, port: int = None) -> NetworkMetrics:
        """
        Check network health by measuring latency

        Args:
            host: Target host (defaults to database host)
            port: Target port

        Returns:
            NetworkMetrics with measured values
        """
        # Try to get from cache first
        cached_metrics = cache.get(self._metrics_cache_key)
        if cached_metrics:
            return NetworkMetrics(**cached_metrics)

        # Default to database host if not specified
        if host is None:
            host = settings.DATABASES.get('default', {}).get('HOST', 'localhost')
        if port is None:
            port = settings.DATABASES.get('default', {}).get('PORT', 5432)

        try:
            latency = self._measure_latency(host, port)
            packet_loss = self._estimate_packet_loss(host, port)

            metrics = NetworkMetrics(
                latency_ms=latency,
                packet_loss_percent=packet_loss,
                bandwidth_mbps=self._estimate_bandwidth(latency)
            )

            # Cache the results
            cache.set(self._metrics_cache_key, {
                'latency_ms': metrics.latency_ms,
                'packet_loss_percent': metrics.packet_loss_percent,
                'bandwidth_mbps': metrics.bandwidth_mbps,
            }, self._cache_timeout)

            return metrics

        except Exception as e:
            logger.error(f"Network health check failed: {e}")
            return NetworkMetrics(
                latency_ms=float('inf'),
                packet_loss_percent=100.0
            )

    def _measure_latency(self, host: str, port: int, timeout: float = 5.0) -> float:
        """Measure network latency using TCP connection"""
        start_time = time.time()
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((host, port))
            sock.close()
            latency_ms = (time.time() - start_time) * 1000
            return latency_ms
        except socket.timeout:
            return float('inf')
        except socket.error as e:
            logger.warning(f"Socket error measuring latency: {e}")
            return float('inf')

    def _estimate_packet_loss(self, host: str, port: int, samples: int = 5) -> float:
        """Estimate packet loss by multiple connection attempts"""
        failed = 0
        for _ in range(samples):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2.0)
                sock.connect((host, port))
                sock.close()
            except (socket.timeout, socket.error):
                failed += 1

        return (failed / samples) * 100

    def _estimate_bandwidth(self, latency_ms: float) -> Optional[float]:
        """Estimate bandwidth based on latency (rough approximation)"""
        if latency_ms == float('inf'):
            return None

        # Rough approximation based on typical connection speeds
        if latency_ms < 10:
            return 1000  # 1 Gbps
        elif latency_ms < 50:
            return 100   # 100 Mbps
        elif latency_ms < 150:
            return 50    # 50 Mbps
        elif latency_ms < 300:
            return 10    # 10 Mbps
        else:
            return 1     # 1 Mbps


class AdaptiveBatchSizer:
    """
    Dynamically adjust batch size based on network conditions
    """

    def __init__(self, config: BatchSizeConfig = None):
        self.config = config or BatchSizeConfig()
        self.health_checker = NetworkHealthChecker(self.config)
        self._batch_size_cache_key = 'adaptive_batch_size'
        self._failure_count_cache_key = 'batch_failure_count'

    def get_batch_size(self, host: str = None, port: int = None) -> int:
        """
        Get current adaptive batch size

        Args:
            host: Target host for network check
            port: Target port for network check

        Returns:
            Recommended batch size
        """
        # Check recent failures
        failure_count = cache.get(self._failure_count_cache_key, 0)
        if failure_count > 0:
            # Reduce batch size due to recent failures
            current_size = cache.get(self._batch_size_cache_key, self.config.initial_batch_size)
            new_size = max(
                self.config.min_batch_size,
                int(current_size * self.config.decrease_factor)
            )
            cache.set(self._batch_size_cache_key, new_size, 300)
            return new_size

        # Check network health
        metrics = self.health_checker.check_network_health(host, port)
        condition = self._classify_network_condition(metrics)

        # Get base batch size for condition
        base_size = self._get_base_batch_size(condition)

        # Apply adaptive adjustment
        current_size = cache.get(self._batch_size_cache_key, base_size)

        # Gradually increase if network is good
        if condition in [NetworkCondition.EXCELLENT, NetworkCondition.GOOD]:
            if current_size < base_size:
                increase = min(
                    self.config.max_increase_rate,
                    int(base_size * (self.config.increase_factor - 1))
                )
                new_size = min(base_size, current_size + increase)
                cache.set(self._batch_size_cache_key, new_size, 300)
                return new_size

        return base_size

    def record_success(self, batch_size: int):
        """Record successful batch processing"""
        # Reset failure count
        cache.delete(self._failure_count_cache_key)

        # Slightly increase batch size for next time
        current_size = cache.get(self._batch_size_cache_key, batch_size)
        if current_size < self.config.max_batch_size:
            increase = min(
                self.config.max_increase_rate,
                int(batch_size * (self.config.increase_factor - 1))
            )
            new_size = min(self.config.max_batch_size, current_size + increase)
            cache.set(self._batch_size_cache_key, new_size, 300)

    def record_failure(self, batch_size: int, error: Exception = None):
        """Record failed batch processing"""
        # Increment failure count
        failure_count = cache.get(self._failure_count_cache_key, 0) + 1
        cache.set(self._failure_count_cache_key, failure_count, 300)

        # Decrease batch size
        current_size = cache.get(self._batch_size_cache_key, batch_size)
        decrease = max(
            self.config.min_decrease_rate,
            int(batch_size * (1 - self.config.decrease_factor))
        )
        new_size = max(self.config.min_batch_size, current_size - decrease)
        cache.set(self._batch_size_cache_key, new_size, 300)

        logger.warning(
            f"Batch processing failed (count: {failure_count}). "
            f"Reducing batch size from {current_size} to {new_size}. "
            f"Error: {error}"
        )

    def _classify_network_condition(self, metrics: NetworkMetrics) -> NetworkCondition:
        """Classify network condition based on metrics"""
        latency = metrics.latency_ms
        packet_loss = metrics.packet_loss_percent

        # Check for network unavailability
        if latency == float('inf') or packet_loss >= 100:
            return NetworkCondition.UNAVAILABLE

        # High packet loss significantly degrades condition
        if packet_loss > 10:
            return NetworkCondition.VERY_POOR

        # Classify based on latency
        if latency < self.config.excellent_threshold:
            return NetworkCondition.EXCELLENT
        elif latency < self.config.good_threshold:
            return NetworkCondition.GOOD
        elif latency < self.config.fair_threshold:
            return NetworkCondition.FAIR
        elif latency < self.config.poor_threshold:
            return NetworkCondition.POOR
        else:
            return NetworkCondition.VERY_POOR

    def _get_base_batch_size(self, condition: NetworkCondition) -> int:
        """Get base batch size for network condition"""
        sizes = {
            NetworkCondition.EXCELLENT: self.config.excellent_batch_size,
            NetworkCondition.GOOD: self.config.good_batch_size,
            NetworkCondition.FAIR: self.config.fair_batch_size,
            NetworkCondition.POOR: self.config.poor_batch_size,
            NetworkCondition.VERY_POOR: self.config.very_poor_batch_size,
            NetworkCondition.UNAVAILABLE: self.config.min_batch_size,
        }
        return sizes.get(condition, self.config.initial_batch_size)

    def reset(self):
        """Reset batch size to initial value"""
        cache.set(self._batch_size_cache_key, self.config.initial_batch_size, 300)
        cache.delete(self._failure_count_cache_key)


# Global instance
_adaptive_batch_sizer: Optional[AdaptiveBatchSizer] = None


def get_adaptive_batch_sizer() -> AdaptiveBatchSizer:
    """Get the global adaptive batch sizer instance"""
    global _adaptive_batch_sizer
    if _adaptive_batch_sizer is None:
        _adaptive_batch_sizer = AdaptiveBatchSizer()
    return _adaptive_batch_sizer


def get_adaptive_batch_size(host: str = None, port: int = None) -> int:
    """
    Get current adaptive batch size

    Args:
        host: Target host for network check
        port: Target port for network check

    Returns:
        Recommended batch size
    """
    sizer = get_adaptive_batch_sizer()
    return sizer.get_batch_size(host, port)


def record_batch_success(batch_size: int):
    """Record successful batch processing"""
    sizer = get_adaptive_batch_sizer()
    sizer.record_success(batch_size)


def record_batch_failure(batch_size: int, error: Exception = None):
    """Record failed batch processing"""
    sizer = get_adaptive_batch_sizer()
    sizer.record_failure(batch_size, error)


def reset_adaptive_batch():
    """Reset adaptive batch size to initial value"""
    sizer = get_adaptive_batch_sizer()
    sizer.reset()
