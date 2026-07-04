# -*- coding: utf-8 -*-
"""
Forecasting App Configuration
시계열 예측 앱 설정
"""
from django.apps import AppConfig


class ForecastingConfig(AppConfig):
    """Forecasting 앱 설정"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'forecasting'
    verbose_name = 'Forecasting'

    def ready(self):
        """앱 초기화 시점에 호출"""
        try:
            import forecasting.signals
        except ImportError:
            pass
