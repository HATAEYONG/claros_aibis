"""
컨트롤 타워 API 시리얼라이저
"""
from rest_framework import serializers
from .models import ControlTowerConfig, DashboardLayout


class ControlTowerConfigSerializer(serializers.ModelSerializer):
    """컨트롤 타워 설정 시리얼라이저"""

    tower_type_display = serializers.CharField(source='get_tower_type_display', read_only=True)
    is_active_display = serializers.CharField(source='get_is_active_display', read_only=True)

    class Meta:
        model = ControlTowerConfig
        fields = [
            'config_id', 'name', 'code', 'tower_type', 'tower_type_display',
            'description', 'config', 'metrics', 'alert_config',
            'is_active', 'is_active_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['config_id', 'created_at', 'updated_at']


class DashboardLayoutSerializer(serializers.ModelSerializer):
    """대시보드 레이아웃 시리얼라이저"""

    tower_config_name = serializers.CharField(source='tower_config.name', read_only=True)
    tower_config_type = serializers.CharField(source='tower_config.tower_type', read_only=True)

    class Meta:
        model = DashboardLayout
        fields = [
            'layout_id', 'tower_config', 'tower_config_name', 'tower_config_type',
            'name', 'layout', 'widgets', 'is_default',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['layout_id', 'created_at', 'updated_at']


class TowerWidgetSerializer(serializers.Serializer):
    """타워 위젯 시리얼라이저"""

    widget_id = serializers.UUIDField(read_only=True)
    widget_type = serializers.CharField()
    title = serializers.CharField()
    position = serializers.DictField()
    config = serializers.DictField()
    data = serializers.DictField(required=False)


class ExecutiveTowerRequestSerializer(serializers.Serializer):
    """경영진 타워 요청 시리얼라이저"""

    time_range = serializers.ChoiceField(
        choices=['today', 'week', 'month', 'quarter', 'year'],
        default='month'
    )
    domains = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=['financial', 'production', 'quality', 'sales']
    )


class FunctionalTowerRequestSerializer(serializers.Serializer):
    """기능별 타워 요청 시리얼라이저"""

    domain = serializers.ChoiceField(
        choices=['cost', 'financial', 'purchase', 'production', 'quality'],
        required=True
    )
    time_range = serializers.ChoiceField(
        choices=['today', 'week', 'month', 'quarter'],
        default='month'
    )
    filters = serializers.DictField(required=False, default={})


class ProcessTowerRequestSerializer(serializers.Serializer):
    """프로세스 타워 요청 시리얼라이저"""

    process_type = serializers.ChoiceField(
        choices=['approval', 'sop', 'delay', 'all'],
        default='all'
    )
    time_range_days = serializers.IntegerField(default=7, min_value=1, max_value=90)
    department = serializers.CharField(required=False, allow_blank=True, default='')
