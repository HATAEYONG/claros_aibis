# -*- coding: utf-8 -*-
"""
Monitoring App Configuration
모니터링 앱 설정
"""
from django.apps import AppConfig


class MonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'monitoring'
    verbose_name = 'System Monitoring'
