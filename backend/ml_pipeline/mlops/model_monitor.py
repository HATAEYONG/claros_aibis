# ML Pipeline MLOps - Model Monitoring
# 모델 성능 및 데이터 드리프트 모니터링

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
from collections import deque
import json

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """알림 심각도"""
    INFO = 'info'
    WARNING = 'warning'
    CRITICAL = 'critical'


class MonitorMetric(Enum):
    """모니터링 메트릭"""
    ACCURACY = 'accuracy'
    MAPE = 'mape'
    MAE = 'mae'
    RMSE = 'rmse'
    LATENCY = 'latency'
    THROUGHPUT = 'throughput'
    DATA_DRIFT = 'data_drift'
    MODEL_DRIFT = 'model_drift'


@dataclass
class Alert:
    """알림"""
    timestamp: str
    metric: MonitorMetric
    severity: AlertSeverity
    message: str
    model_name: str
    current_value: float
    threshold: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MonitorConfig:
    """모니터링 설정"""
    model_name: str
    check_interval_seconds: int = 300  # 5분
    window_size: int = 100  # 이동 윈도우 크기

    # 임계값
    mape_threshold: float = 10.0  # MAPE 10% 초과 시 알림
    mae_threshold: float = 100.0
    rmse_threshold: float = 150.0
    latency_threshold_ms: float = 1000.0

    # 드리프트 감지
    drift_detection_method: str = 'ks_test'  # 'ks_test', 'psi', 'chi_square'
    drift_threshold: float = 0.05  # p-value 기준

    # 알림 설정
    enable_alerts: bool = True
    alert_handlers: List[str] = field(default_factory=list)  # 'email', 'slack', 'webhook'


class ModelMonitor:
    """
    모델 모니터링 시스템

    기능:
    - 실시간 성능 모니터링
    - 데이터 드리프트 감지
    - 모델 드리프트 감지
    - 알림 발송
    - 대시보드 메트릭 제공
    """

    def __init__(
        self,
        config: Optional[MonitorConfig] = None,
        alert_callback: Optional[Callable[[Alert], None]] = None
    ):
        """
        모델 모니터링 초기화

        Args:
            config: 모니터링 설정
            alert_callback: 알림 콜백 함수
        """
        self.config = config or MonitorConfig(model_name='default')
        self.alert_callback = alert_callback

        # 메트릭 저장 (최근 N개)
        self.metrics_history: Dict[MonitorMetric, deque] = {
            metric: deque(maxlen=self.config.window_size)
            for metric in MonitorMetric
        }

        # 알림 저장
        self.alerts: List[Alert] = []

        # 기준 분포 (드리프트 감지용)
        self.baseline_distribution: Optional[Dict] = None

        # 모니터링 활성화 상태
        self.is_monitoring = False

        logger.info(f"모델 모니터링 초기화: {self.config.model_name}")

    def start_monitoring(self):
        """모니터링 시작"""
        self.is_monitoring = True
        logger.info(f"모니터링 시작: {self.config.model_name}")

    def stop_monitoring(self):
        """모니터링 중지"""
        self.is_monitoring = False
        logger.info(f"모니터링 중지: {self.config.model_name}")

    def record_prediction(
        self,
        prediction: float,
        actual: Optional[float] = None,
        latency_ms: Optional[float] = None,
        timestamp: Optional[str] = None
    ):
        """
        예측 결과 기록

        Args:
            prediction: 예측값
            actual: 실제값
            latency_ms: 예측 지연 시간 (ms)
            timestamp: 타임스탬프
        """
        if not self.is_monitoring:
            return

        timestamp = timestamp or datetime.now().isoformat()

        # 성능 메트릭 계산
        if actual is not None:
            error = abs(actual - prediction)
            pct_error = abs((actual - prediction) / (actual + 1e-8)) * 100

            self.metrics_history[MonitorMetric.MAE].append({
                'value': error,
                'timestamp': timestamp
            })
            self.metrics_history[MonitorMetric.MAPE].append({
                'value': pct_error,
                'timestamp': timestamp
            })
            self.metrics_history[MonitorMetric.RMSE].append({
                'value': error ** 2,
                'timestamp': timestamp
            })

        # 지연 시간
        if latency_ms is not None:
            self.metrics_history[MonitorMetric.LATENCY].append({
                'value': latency_ms,
                'timestamp': timestamp
            })

        # 임계값 확인 및 알림
        if self.config.enable_alerts:
            self._check_thresholds(timestamp)

    def record_batch_predictions(
        self,
        predictions: List[float],
        actuals: Optional[List[float]] = None
    ):
        """
        배치 예측 결과 기록

        Args:
            predictions: 예측값 리스트
            actuals: 실제값 리스트
        """
        for i, pred in enumerate(predictions):
            actual = actuals[i] if actuals and i < len(actuals) else None
            self.record_prediction(pred, actual)

    def _check_thresholds(self, timestamp: str):
        """임계값 확인 및 알림 발송"""
        # MAPE 확인
        if len(self.metrics_history[MonitorMetric.MAPE]) > 0:
            recent_mape = np.mean([
                m['value'] for m in list(self.metrics_history[MonitorMetric.MAPE])[-10:]
            ])

            if recent_mape > self.config.mape_threshold:
                self._create_alert(
                    metric=MonitorMetric.MAPE,
                    severity=AlertSeverity.WARNING,
                    message=f"MAPE 임계값 초과: {recent_mape:.2f}%",
                    current_value=recent_mape,
                    threshold=self.config.mape_threshold
                )

        # MAE 확인
        if len(self.metrics_history[MonitorMetric.MAE]) > 0:
            recent_mae = np.mean([
                m['value'] for m in list(self.metrics_history[MonitorMetric.MAE])[-10:]
            ])

            if recent_mae > self.config.mae_threshold:
                self._create_alert(
                    metric=MonitorMetric.MAE,
                    severity=AlertSeverity.WARNING,
                    message=f"MAE 임계값 초과: {recent_mae:.2f}",
                    current_value=recent_mae,
                    threshold=self.config.mae_threshold
                )

        # 지연 시간 확인
        if len(self.metrics_history[MonitorMetric.LATENCY]) > 0:
            recent_latency = np.mean([
                m['value'] for m in list(self.metrics_history[MonitorMetric.LATENCY])[-10:]
            ])

            if recent_latency > self.config.latency_threshold_ms:
                self._create_alert(
                    metric=MonitorMetric.LATENCY,
                    severity=AlertSeverity.CRITICAL,
                    message=f"지연 시간 임계값 초과: {recent_latency:.0f}ms",
                    current_value=recent_latency,
                    threshold=self.config.latency_threshold_ms
                )

    def _create_alert(
        self,
        metric: MonitorMetric,
        severity: AlertSeverity,
        message: str,
        current_value: float,
        threshold: float
    ):
        """알림 생성"""
        alert = Alert(
            timestamp=datetime.now().isoformat(),
            metric=metric,
            severity=severity,
            message=message,
            model_name=self.config.model_name,
            current_value=current_value,
            threshold=threshold
        )

        self.alerts.append(alert)

        # 콜백 호출
        if self.alert_callback:
            try:
                self.alert_callback(alert)
            except Exception as e:
                logger.error(f"알림 콜백 오류: {str(e)}")

        logger.warning(f"[{severity.value.upper()}] {message}")

    def detect_data_drift(
        self,
        current_data: np.ndarray,
        feature_name: str = 'value'
    ) -> Dict[str, Any]:
        """
        데이터 드리프트 감지

        Args:
            current_data: 현재 데이터
            feature_name: 피처 이름

        Returns:
            드리프트 감지 결과
        """
        if self.baseline_distribution is None:
            # 기준 분포 설정 (초기 실행)
            self.baseline_distribution = {
                'mean': np.mean(current_data),
                'std': np.std(current_data),
                'min': np.min(current_data),
                'max': np.max(current_data),
                'percentiles': {
                    '25': np.percentile(current_data, 25),
                    '50': np.percentile(current_data, 50),
                    '75': np.percentile(current_data, 75)
                }
            }
            return {
                'drift_detected': False,
                'message': '기준 분포 설정 완료',
                'baseline': self.baseline_distribution
            }

        baseline_mean = self.baseline_distribution['mean']
        baseline_std = self.baseline_distribution['std']
        current_mean = np.mean(current_data)
        current_std = np.std(current_data)

        # KS 검정
        from scipy import stats
        baseline_sample = np.random.normal(
            baseline_mean,
            baseline_std,
            size=len(current_data)
        )

        ks_statistic, p_value = stats.ks_2samp(baseline_sample, current_data)

        drift_detected = p_value < self.config.drift_threshold

        result = {
            'drift_detected': drift_detected,
            'p_value': p_value,
            'ks_statistic': ks_statistic,
            'baseline_mean': baseline_mean,
            'current_mean': current_mean,
            'mean_shift': current_mean - baseline_mean,
            'baseline_std': baseline_std,
            'current_std': current_std
        }

        if drift_detected:
            self._create_alert(
                metric=MonitorMetric.DATA_DRIFT,
                severity=AlertSeverity.WARNING,
                message=f"데이터 드리프트 감지: {feature_name} (p-value: {p_value:.4f})",
                current_value=current_mean,
                threshold=baseline_mean
            )

        return result

    def detect_model_drift(
        self,
        recent_metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        모델 드리프트 감지

        Args:
            recent_metrics: 최근 메트릭

        Returns:
            드리프트 감지 결과
        """
        # 최근 30일 메트릭 평균과 비교
        window_metrics = {
            metric: [m['value'] for m in list(history)[-30:]]
            for metric, history in self.metrics_history.items()
            if len(history) > 0
        }

        drift_detected = False
        drift_details = {}

        for metric_name, current_value in recent_metrics.items():
            try:
                metric_enum = MonitorMetric(metric_name)
            except ValueError:
                continue

            if metric_enum in window_metrics and len(window_metrics[metric_enum]) > 0:
                historical_mean = np.mean(window_metrics[metric_enum])
                historical_std = np.std(window_metrics[metric_enum])

                # Z-score 기반 이상 탐지
                if historical_std > 0:
                    z_score = abs(current_value - historical_mean) / historical_std
                    drift_detected = z_score > 2  # 2시그마

                    drift_details[metric_name] = {
                        'current_value': current_value,
                        'historical_mean': historical_mean,
                        'historical_std': historical_std,
                        'z_score': z_score,
                        'drift_detected': drift_detected
                    }

                    if drift_detected:
                        self._create_alert(
                            metric=MonitorMetric.MODEL_DRIFT,
                            severity=AlertSeverity.WARNING,
                            message=f"모델 드리프트 감지: {metric_name} (Z-score: {z_score:.2f})",
                            current_value=current_value,
                            threshold=historical_mean
                        )

        return {
            'drift_detected': drift_detected,
            'details': drift_details
        }

    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        메트릭 요약 조회

        Returns:
            메트릭 요약
        """
        summary = {}

        for metric, history in self.metrics_history.items():
            if len(history) > 0:
                values = [m['value'] for m in history]
                summary[metric.value] = {
                    'count': len(values),
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values)),
                    'latest': float(values[-1]),
                    'trend': 'increasing' if len(values) > 1 and values[-1] > values[-2] else 'decreasing'
                }
            else:
                summary[metric.value] = {
                    'count': 0,
                    'message': 'No data'
                }

        return summary

    def get_recent_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        limit: int = 100
    ) -> List[Alert]:
        """
        최근 알림 조회

        Args:
            severity: 필터링할 심각도
            limit: 최대 개수

        Returns:
            알림 리스트
        """
        alerts = self.alerts

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        return alerts[-limit:]

    def clear_alerts(self, older_than_hours: Optional[int] = None):
        """
        알림 비우기

        Args:
            older_than_hours: 해당 시간 이전의 알림만 삭제 (None = 전체)
        """
        if older_than_hours is None:
            self.alerts = []
        else:
            cutoff = datetime.now() - timedelta(hours=older_than_hours)
            self.alerts = [
                a for a in self.alerts
                if datetime.fromisoformat(a.timestamp) > cutoff
            ]

    def export_metrics(
        self,
        filepath: str,
        format: str = 'json'
    ):
        """
        메트릭 내보내기

        Args:
            filepath: 파일 경로
            format: 형식 ('json', 'csv')
        """
        if format == 'json':
            data = {
                'model_name': self.config.model_name,
                'timestamp': datetime.now().isoformat(),
                'metrics': {
                    metric.value: [
                        {'value': m['value'], 'timestamp': m['timestamp']}
                        for m in history
                    ]
                    for metric, history in self.metrics_history.items()
                },
                'alerts': [
                    {
                        'timestamp': a.timestamp,
                        'metric': a.metric.value,
                        'severity': a.severity.value,
                        'message': a.message,
                        'current_value': a.current_value,
                        'threshold': a.threshold
                    }
                    for a in self.alerts[-100:]  # 최근 100개
                ]
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        elif format == 'csv':
            # 메트릭을 DataFrame으로 변환
            rows = []
            for metric, history in self.metrics_history.items():
                for entry in history:
                    rows.append({
                        'metric': metric.value,
                        'value': entry['value'],
                        'timestamp': entry['timestamp']
                    })

            df = pd.DataFrame(rows)
            df.to_csv(filepath, index=False)

        logger.info(f"메트릭 내보내기 완료: {filepath}")


class PrometheusExporter:
    """
    Prometheus 형식 메트릭 내보내기

    Grafana 등에서 시각화 가능
    """

    def __init__(
        self,
        namespace: str = 'ml_pipeline',
        subsystem: str = 'model_monitoring'
    ):
        """
        PrometheusExporter 초기화

        Args:
            namespace: 메트릭 네임스페이스
            subsystem: 서브시스템
        """
        self.namespace = namespace
        self.subsystem = subsystem

        # 메트릭 저장
        self.metrics: Dict[str, Dict] = {}

    def set_metric(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None,
        metric_type: str = 'gauge'
    ):
        """
        메트릭 설정

        Args:
            name: 메트릭 이름
            value: 값
            labels: 라벨
            metric_type: 메트릭 타입 (gauge, counter)
        """
        metric_key = f"{name}_{hash(str(labels)) % 10000}"

        self.metrics[metric_key] = {
            'name': name,
            'value': value,
            'labels': labels or {},
            'type': metric_type,
            'timestamp': datetime.now().isoformat()
        }

    def export_prometheus_format(self) -> str:
        """
        Prometheus 형식으로 내보내기

        Returns:
            Prometheus 텍스트 형식
        """
        lines = []

        for metric in self.metrics.values():
            # 메트릭 헬퍼
            lines.append(f"# HELP {metric['name']} {metric['name']} metric")
            lines.append(f"# TYPE {metric['name']} {metric['type']}")

            # 라벨 문자열
            label_str = ""
            if metric['labels']:
                label_str = "{" + ",".join([
                    f'{k}="{v}"'
                    for k, v in metric['labels'].items()
                ]) + "}"

            # 메트릭 값
            lines.append(
                f"{self.namespace}_{self.subsystem}_{metric['name']}{label_str} {metric['value']}"
            )

        return "\n".join(lines)

    def save_to_file(self, filepath: str):
        """파일로 저장"""
        content = self.export_prometheus_format()

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        logger.info(f"Prometheus 메트릭 저장: {filepath}")


class DashboardMetrics:
    """
    대시보드용 메트릭 집계

    Grafana, Kibana 등에서 시각화 가능한 형식
    """

    def __init__(self):
        self.metrics: Dict[str, Any] = {
            'timestamp': datetime.now().isoformat(),
            'models': {}
        }

    def add_model_metrics(
        self,
        model_name: str,
        metrics: Dict[str, float],
        predictions_count: int = 0
    ):
        """
        모델 메트릭 추가

        Args:
            model_name: 모델 이름
            metrics: 메트릭 딕셔너리
            predictions_count: 예측 수
        """
        if model_name not in self.metrics['models']:
            self.metrics['models'][model_name] = {}

        self.metrics['models'][model_name].update(metrics)
        self.metrics['models'][model_name]['predictions_count'] = \
            self.metrics['models'][model_name].get('predictions_count', 0) + predictions_count
        self.metrics['models'][model_name]['last_updated'] = datetime.now().isoformat()

    def get_summary(self) -> Dict[str, Any]:
        """요약 정보 조회"""
        summary = {
            'timestamp': self.metrics['timestamp'],
            'total_models': len(self.metrics['models']),
            'models': {}
        }

        for model_name, model_metrics in self.metrics['models'].items():
            summary['models'][model_name] = {
                'mape': model_metrics.get('mape', 0),
                'mae': model_metrics.get('mae', 0),
                'rmse': model_metrics.get('rmse', 0),
                'predictions_count': model_metrics.get('predictions_count', 0),
                'status': 'healthy' if model_metrics.get('mape', 0) < 10 else 'warning'
            }

        return summary

    def to_json(self) -> str:
        """JSON 형식으로 변환"""
        return json.dumps(self.get_summary(), indent=2, ensure_ascii=False)

    def save_to_file(self, filepath: str):
        """파일로 저장"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(self.to_json())

        logger.info(f"대시보드 메트릭 저장: {filepath}")
