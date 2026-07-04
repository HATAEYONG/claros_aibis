# -*- coding: utf-8 -*-
"""
Data Hub Django 앱 설정
"""
from django.apps import AppConfig


class DataHubConfig(AppConfig):
    """Data Hub 앱 설정"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'data_hub'
    verbose_name = 'Data Hub'

    def ready(self):
        """앱 초기화"""
        # Signals module is optional
        try:
            import data_hub.signals  # noqa
        except ImportError:
            pass
