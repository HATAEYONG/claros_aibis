"""
Adaptive Learning Module

Online learning and concept drift detection for time series forecasting
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AdaptiveLearner:
    """
    Adaptive Learning System

    Automatically adapts models to changing data patterns
    """

    def __init__(
        self,
        window_size: int = 100,
        adaptation_threshold: float = 0.1,
        min_samples_for_update: int = 50
    ):
        """
        Initialize Adaptive Learner

        Args:
            window_size: Size of sliding window for adaptation
            adaptation_threshold: Threshold for triggering adaptation
            min_samples_for_update: Minimum samples required for update
        """
        self.window_size = window_size
        self.adaptation_threshold = adaptation_threshold
        self.min_samples_for_update = min_samples_for_update

        self.model_buffer = []
        self.performance_buffer = []
        self.adaptation_count = 0
        self.last_adaptation = None

    def should_adapt(
        self,
        recent_performance: float,
        baseline_performance: float
    ) -> bool:
        """
        Determine if model should adapt

        Args:
            recent_performance: Recent model performance
            baseline_performance: Baseline performance

        Returns:
            True if adaptation is needed
        """
        # Calculate performance degradation
        degradation = (baseline_performance - recent_performance) / baseline_performance

        return degradation > self.adaptation_threshold

    def adapt(
        self,
        model: Any,
        new_data: pd.DataFrame,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Adapt model to new data

        Args:
            model: Model to adapt
            new_data: New data for adaptation
            target_col: Target column name

        Returns:
            Adaptation results
        """
        logger.info(f"Adapting model with {len(new_data)} new samples")

        # Update model with new data
        adaptation_result = self._update_model(model, new_data, target_col)

        # Track adaptation
        self.adaptation_count += 1
        self.last_adaptation = datetime.now()

        return {
            'status': 'success',
            'adaptation_count': self.adaptation_count,
            'adaptation_time': self.last_adaptation.isoformat(),
            'samples_used': len(new_data),
            'result': adaptation_result
        }

    def _update_model(
        self,
        model: Any,
        data: pd.DataFrame,
        target_col: str
    ) -> Dict[str, Any]:
        """Update model with new data"""
        # In production, would implement actual model update
        # For now, simulate adaptation
        return {
            'method': 'incremental_learning',
            'update_samples': len(data),
            'new_performance': np.random.rand() * 0.1 + 0.85
        }

    def get_adaptation_stats(self) -> Dict[str, Any]:
        """Get adaptation statistics"""
        return {
            'total_adaptations': self.adaptation_count,
            'last_adaptation': self.last_adaptation.isoformat() if self.last_adaptation else None,
            'window_size': self.window_size,
            'threshold': self.adaptation_threshold
        }


class OnlineModelUpdater:
    """
    Online Model Updater

    Updates models incrementally as new data arrives
    """

    def __init__(
        self,
        update_frequency: int = 10,
        batch_size: int = 32,
        learning_rate: float = 0.01
    ):
        """
        Initialize Online Model Updater

        Args:
            update_frequency: Update model every N samples
            batch_size: Batch size for updates
            learning_rate: Learning rate for updates
        """
        self.update_frequency = update_frequency
        self.batch_size = batch_size
        self.learning_rate = learning_rate

        self.samples_seen = 0
        self.update_history = []
        self.current_batch = []

    def process_sample(
        self,
        sample: Dict[str, Any],
        model: Any
    ) -> Optional[Dict[str, Any]]:
        """
        Process a new sample

        Args:
            sample: New data sample
            model: Model to update

        Returns:
            Update result if update occurred, None otherwise
        """
        self.samples_seen += 1
        self.current_batch.append(sample)

        # Check if update is needed
        if self.samples_seen % self.update_frequency == 0:
            return self._update_model(model)
        elif len(self.current_batch) >= self.batch_size:
            return self._update_model(model)

        return None

    def _update_model(self, model: Any) -> Dict[str, Any]:
        """Update model with current batch"""
        batch = self.current_batch[-self.batch_size:]
        self.current_batch = []

        # Simulate update
        update_result = {
            'samples_processed': self.samples_seen,
            'batch_size': len(batch),
            'learning_rate': self.learning_rate,
            'update_time': datetime.now().isoformat()
        }

        self.update_history.append(update_result)

        return update_result

    def get_update_stats(self) -> Dict[str, Any]:
        """Get update statistics"""
        return {
            'total_samples': self.samples_seen,
            'total_updates': len(self.update_history),
            'update_frequency': self.update_frequency,
            'batch_size': self.batch_size,
            'last_update': self.update_history[-1] if self.update_history else None
        }


class ConceptDriftDetector:
    """
    Concept Drift Detector

    Detects changes in data distribution that affect model performance
    """

    def __init__(
        self,
        detection_method: str = 'ddm',
        warning_level: float = 0.1,
        drift_level: float = 0.2,
        window_size: int = 100
    ):
        """
        Initialize Concept Drift Detector

        Args:
            detection_method: Detection method ('ddm', 'eddm', 'adwin', 'page_hinkley')
            warning_level: Warning threshold
            drift_level: Drift threshold
            window_size: Window size for detection
        """
        self.detection_method = detection_method
        self.warning_level = warning_level
        self.drift_level = drift_level
        self.window_size = window_size

        self.error_buffer = []
        self.warning_count = 0
        self.drift_count = 0
        self.last_drift = None
        self.last_warning = None

    def detect(
        self,
        prediction: float,
        actual: float,
        baseline_error: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Detect concept drift

        Args:
            prediction: Model prediction
            actual: Actual value
            baseline_error: Baseline error for comparison

        Returns:
            Detection result
        """
        # Calculate error
        error = abs(prediction - actual) / (abs(actual) + 1e-10)

        self.error_buffer.append(error)

        # Keep buffer size limited
        if len(self.error_buffer) > self.window_size:
            self.error_buffer.pop(0)

        # Detect drift
        if self.detection_method == 'ddm':
            return self._ddm_detect(error, baseline_error)
        elif self.detection_method == 'eddm':
            return self._eddm_detect(error)
        elif self.detection_method == 'adwin':
            return self._adwin_detect()
        elif self.detection_method == 'page_hinkley':
            return self._page_hinkley_detect(error)
        else:
            return self._ddm_detect(error, baseline_error)

    def _ddm_detect(
        self,
        error: float,
        baseline_error: Optional[float] = None
    ) -> Dict[str, Any]:
        """DDM (Drift Detection Method)"""
        if len(self.error_buffer) < 30:
            return {'status': 'insufficient_data'}

        min_error = min(self.error_buffer)
        mean_error = np.mean(self.error_buffer)
        std_error = np.std(self.error_buffer)

        if baseline_error is None:
            baseline_error = mean_error

        # Check for drift
        z_drift = 2.0
        z_warning = 1.5

        drift_threshold = baseline_error + z_drift * std_error
        warning_threshold = baseline_error + z_warning * std_error

        result = {
            'status': 'normal',
            'method': 'ddm',
            'current_error': float(error),
            'min_error': float(min_error),
            'mean_error': float(mean_error),
            'drift_threshold': float(drift_threshold),
            'warning_threshold': float(warning_threshold)
        }

        if mean_error > drift_threshold:
            result['status'] = 'drift'
            self.drift_count += 1
            self.last_drift = datetime.now()
        elif mean_error > warning_threshold:
            result['status'] = 'warning'
            self.warning_count += 1
            self.last_warning = datetime.now()

        return result

    def _eddm_detect(self, error: float) -> Dict[str, Any]:
        """EDDM (Early Drift Detection Method)"""
        if len(self.error_buffer) < 30:
            return {'status': 'insufficient_data'}

        # Calculate distance between errors
        distances = []
        for i in range(1, len(self.error_buffer)):
            distances.append(abs(self.error_buffer[i] - self.error_buffer[i-1]))

        mean_distance = np.mean(distances)
        std_distance = np.std(distances)

        # EDDM thresholds
        warning_threshold = 0.95 * mean_distance - 2 * std_distance
        drift_threshold = 0.9 * mean_distance - 3 * std_distance

        result = {
            'status': 'normal',
            'method': 'eddm',
            'current_distance': float(distances[-1]) if distances else 0.0,
            'mean_distance': float(mean_distance),
            'warning_threshold': float(warning_threshold),
            'drift_threshold': float(drift_threshold)
        }

        if distances and distances[-1] < drift_threshold:
            result['status'] = 'drift'
            self.drift_count += 1
            self.last_drift = datetime.now()
        elif distances and distances[-1] < warning_threshold:
            result['status'] = 'warning'
            self.warning_count += 1
            self.last_warning = datetime.now()

        return result

    def _adwin_detect(self) -> Dict[str, Any]:
        """ADWIN (Adaptive Windowing)"""
        if len(self.error_buffer) < 50:
            return {'status': 'insufficient_data'}

        # Split window and compare means
        mid = len(self.error_buffer) // 2
        left_mean = np.mean(self.error_buffer[:mid])
        right_mean = np.mean(self.error_buffer[mid:])

        # Calculate statistical difference
        n1, n2 = mid, len(self.error_buffer) - mid
        merged_std = np.sqrt(
            (np.var(self.error_buffer[:mid]) * n1 +
             np.var(self.error_buffer[mid:]) * n2) /
            (n1 + n2)
        )

        threshold = 1.96 * merged_std * np.sqrt(1/n1 + 1/n2)
        difference = abs(left_mean - right_mean)

        result = {
            'status': 'normal',
            'method': 'adwin',
            'left_mean': float(left_mean),
            'right_mean': float(right_mean),
            'difference': float(difference),
            'threshold': float(threshold)
        }

        if difference > threshold:
            result['status'] = 'drift'
            self.drift_count += 1
            self.last_drift = datetime.now()
        elif difference > threshold * 0.7:
            result['status'] = 'warning'
            self.warning_count += 1
            self.last_warning = datetime.now()

        return result

    def _page_hinkley_detect(self, error: float) -> Dict[str, Any]:
        """Page-Hinkley Test"""
        if len(self.error_buffer) < 30:
            return {'status': 'insufficient_data'}

        # Calculate cumulative sum
        mean_error = np.mean(self.error_buffer)
        deviations = [e - mean_error for e in self.error_buffer]

        # Page-Hinkley statistic
        m_n = np.max(deviations)
        m_n_sum = np.sum(deviations)

        alpha = 0.99
        threshold = alpha * np.sqrt(len(self.error_buffer))

        result = {
            'status': 'normal',
            'method': 'page_hinkley',
            'm_n': float(m_n),
            'sum_deviation': float(m_n_sum),
            'threshold': float(threshold)
        }

        if abs(m_n_sum) > threshold:
            result['status'] = 'drift'
            self.drift_count += 1
            self.last_drift = datetime.now()
        elif abs(m_n_sum) > threshold * 0.7:
            result['status'] = 'warning'
            self.warning_count += 1
            self.last_warning = datetime.now()

        return result

    def get_drift_stats(self) -> Dict[str, Any]:
        """Get drift statistics"""
        return {
            'total_drifts': self.drift_count,
            'total_warnings': self.warning_count,
            'last_drift': self.last_drift.isoformat() if self.last_drift else None,
            'last_warning': self.last_warning.isoformat() if self.last_warning else None,
            'detection_method': self.detection_method,
            'window_size': self.window_size
        }


class PerformanceMonitor:
    """
    Performance Monitor

    Tracks model performance and triggers adaptations
    """

    def __init__(
        self,
        metrics: List[str] = None,
        window_size: int = 100,
        alert_threshold: float = 0.15
    ):
        """
        Initialize Performance Monitor

        Args:
            metrics: List of metrics to track
            window_size: Window size for rolling metrics
            alert_threshold: Threshold for performance alerts
        """
        self.metrics = metrics or ['mape', 'mae', 'rmse']
        self.window_size = window_size
        self.alert_threshold = alert_threshold

        self.performance_history = {metric: [] for metric in self.metrics}
        self.baseline_performance = {metric: None for metric in self.metrics}
        self.alert_count = 0
        self.last_alert = None

    def update(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray
    ) -> Dict[str, float]:
        """
        Update performance metrics

        Args:
            predictions: Model predictions
            actuals: Actual values

        Returns:
            Current performance metrics
        """
        metrics = self._calculate_metrics(predictions, actuals)

        # Update history
        for metric, value in metrics.items():
            self.performance_history[metric].append(value)
            if len(self.performance_history[metric]) > self.window_size:
                self.performance_history[metric].pop(0)

        # Set baseline if not set
        for metric, value in metrics.items():
            if self.baseline_performance[metric] is None:
                self.baseline_performance[metric] = value

        # Check for alerts
        self._check_for_alerts(metrics)

        return metrics

    def _calculate_metrics(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray
    ) -> Dict[str, float]:
        """Calculate performance metrics"""
        metrics = {}

        # MAPE
        mape = np.mean(np.abs((actuals - predictions) / (actuals + 1e-10))) * 100
        metrics['mape'] = float(mape)

        # MAE
        mae = np.mean(np.abs(actuals - predictions))
        metrics['mae'] = float(mae)

        # RMSE
        rmse = np.sqrt(np.mean((actuals - predictions) ** 2))
        metrics['rmse'] = float(rmse)

        return metrics

    def _check_for_alerts(self, current_metrics: Dict[str, float]) -> None:
        """Check if performance has degraded"""
        for metric, current_value in current_metrics.items():
            baseline = self.baseline_performance.get(metric)

            if baseline is not None:
                degradation = (current_value - baseline) / baseline

                if degradation > self.alert_threshold:
                    self.alert_count += 1
                    self.last_alert = {
                        'metric': metric,
                        'baseline': baseline,
                        'current': current_value,
                        'degradation': degradation,
                        'time': datetime.now().isoformat()
                    }

                    logger.warning(
                        f"Performance alert: {metric} degraded by {degradation:.1%}"
                    )

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        summary = {
            'baseline': self.baseline_performance.copy(),
            'current': {},
            'trend': {},
            'alerts': {
                'total': self.alert_count,
                'last': self.last_alert
            }
        }

        for metric, history in self.performance_history.items():
            if history:
                summary['current'][metric] = history[-1]
                summary['trend'][metric] = {
                    'mean': float(np.mean(history)),
                    'std': float(np.std(history)),
                    'min': float(np.min(history)),
                    'max': float(np.max(history))
                }

        return summary

    def should_retrain(self) -> Tuple[bool, str]:
        """
        Determine if model should be retrained

        Returns:
            (should_retrain, reason)
        """
        if self.last_alert:
            alert_age = datetime.now() - datetime.fromisoformat(self.last_alert['time'])
            if alert_age.total_seconds() < 3600:  # Recent alert
                return True, f"Recent performance alert: {self.last_alert['metric']}"

        # Check trend
        for metric, history in self.performance_history.items():
            if len(history) >= 20:
                recent = np.mean(history[-10:])
                older = np.mean(history[-20:-10])

                if recent > older * 1.2:  # 20% degradation
                    return True, f"Trend detected: {metric} degrading"

        return False, "Performance stable"


# Utility functions
def create_adaptive_pipeline(
    models: List[Any],
    window_size: int = 100,
    adaptation_threshold: float = 0.1
) -> AdaptiveLearner:
    """Create adaptive learning pipeline"""
    learner = AdaptiveLearner(
        window_size=window_size,
        adaptation_threshold=adaptation_threshold
    )
    return learner


def create_drift_detector(
    method: str = 'ddm',
    warning_level: float = 0.1,
    drift_level: float = 0.2
) -> ConceptDriftDetector:
    """Create concept drift detector"""
    detector = ConceptDriftDetector(
        detection_method=method,
        warning_level=warning_level,
        drift_level=drift_level
    )
    return detector
