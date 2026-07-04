# -*- coding: utf-8 -*-
"""
Visualization App Configuration
데이터 시각화 앱 설정
"""
from django.apps import AppConfig


class VisualizationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'visualization'
    verbose_name = 'Data Visualization'
