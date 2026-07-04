# -*- coding: utf-8 -*-
"""
External Integration App Configuration
외부 연동 앱 설정
"""
from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'integrations'
    verbose_name = 'External Integration'
