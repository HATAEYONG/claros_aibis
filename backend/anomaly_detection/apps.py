# -*- coding: utf-8 -*-
"""
Anomaly Detection App Configuration
이상탐지 앱 설정
"""
from django.apps import AppConfig


class AnomalyDetectionConfig(AppConfig):
    """Anomaly Detection 앱 설정"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'anomaly_detection'
    verbose_name = 'Anomaly Detection'

    def ready(self):
        """앱 초기화 시점에 호출"""
        try:
            import anomaly_detection.signals
        except ImportError:
            pass
