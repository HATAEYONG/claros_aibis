# -*- coding: utf-8 -*-
"""
ML Pipeline App Configuration
Machine Learning Pipeline 앱 설정
"""
from django.apps import AppConfig


class MLPipelineConfig(AppConfig):
    """ML Pipeline 앱 설정"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ml_pipeline'
    verbose_name = 'ML Pipeline'

    def ready(self):
        """앱 초기화 시점에 호출"""
        try:
            import ml_pipeline.signals
        except ImportError:
            pass
