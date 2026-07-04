# -*- coding: utf-8 -*-
"""
Copilot Django 앱 설정
"""
from django.apps import AppConfig


class CopilotConfig(AppConfig):
    """Copilot 앱 설정"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai.copilot'
    verbose_name = 'AI Copilot'

    def ready(self):
        """앱 초기화"""
        # Signals module is optional
        try:
            import ai.copilot.signals  # noqa
        except ImportError:
            pass
