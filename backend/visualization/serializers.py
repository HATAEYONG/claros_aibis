# -*- coding: utf-8 -*-
"""
Visualization Serializers
데이터 시각화 시리얼라이저
"""
from rest_framework import serializers
from .models import Dashboard, DashboardWidget, ChartTemplate, DataStream, VisualizationSettings


class DashboardWidgetSerializer(serializers.ModelSerializer):
    """대시보드 위젯 시리얼라이저"""

    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'dashboard', 'widget_type', 'title', 'description',
            'position', 'size', 'data_config', 'chart_config',
            'refresh_interval', 'data_source', 'query', 'is_active',
            'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardSerializer(serializers.ModelSerializer):
    """대시보드 시리얼라이저"""
    widgets = DashboardWidgetSerializer(many=True, read_only=True)

    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'code', 'description', 'layout', 'theme',
            'is_public', 'is_active', 'refresh_interval',
            'created_by', 'created_at', 'updated_at', 'last_viewed_at',
            'widgets'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_viewed_at']


class ChartTemplateSerializer(serializers.ModelSerializer):
    """차트 템플릿 시리얼라이저"""

    class Meta:
        model = ChartTemplate
        fields = [
            'id', 'name', 'code', 'chart_type', 'category', 'description',
            'config_schema', 'default_config', 'preview_image',
            'is_public', 'is_active', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DataStreamSerializer(serializers.ModelSerializer):
    """데이터 스트림 시리얼라이저"""

    class Meta:
        model = DataStream
        fields = [
            'id', 'name', 'code', 'topic', 'data_type', 'source',
            'query', 'update_frequency', 'buffer_size', 'is_active',
            'subscriber_count', 'last_update_at', 'created_at', 'description'
        ]
        read_only_fields = ['id', 'created_at', 'last_update_at']


class VisualizationSettingsSerializer(serializers.ModelSerializer):
    """시각화 설정 시리얼라이저"""

    class Meta:
        model = VisualizationSettings
        fields = [
            'id', 'user_id', 'default_theme', 'chart_preferences',
            'color_palette', 'language', 'timezone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
