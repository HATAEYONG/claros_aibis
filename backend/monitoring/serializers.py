# -*- coding: utf-8 -*-
"""
Monitoring Serializers
시스템 모니터링 시리얼라이저
"""
from rest_framework import serializers
from .models import SystemMetric, APILog, ErrorLog, PerformanceLog, HealthCheck, CacheStatistics


class SystemMetricSerializer(serializers.ModelSerializer):
    """시스템 메트릭 시리얼라이저"""

    class Meta:
        model = SystemMetric
        fields = [
            'id', 'metric_name', 'metric_type', 'value', 'unit',
            'tags', 'timestamp', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class APILogSerializer(serializers.ModelSerializer):
    """API 로그 시리얼라이저"""
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = APILog
        fields = [
            'id', 'method', 'path', 'query_params', 'user', 'username',
            'ip_address', 'user_agent', 'status_code', 'response_time_ms',
            'error_message', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class ErrorLogSerializer(serializers.ModelSerializer):
    """에러 로그 시리얼라이저"""
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True, allow_null=True)

    class Meta:
        model = ErrorLog
        fields = [
            'id', 'error_type', 'error_message', 'stack_trace',
            'request_path', 'request_method', 'user', 'username',
            'ip_address', 'is_resolved', 'resolved_at', 'resolved_by_username',
            'occurred_at', 'created_at'
        ]
        read_only_fields = ['id', 'occurred_at', 'created_at']


class PerformanceLogSerializer(serializers.ModelSerializer):
    """성능 로그 시리얼라이저"""

    class Meta:
        model = PerformanceLog
        fields = [
            'id', 'operation_name', 'operation_type', 'duration_ms',
            'metadata', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class HealthCheckSerializer(serializers.ModelSerializer):
    """헬스 체크 시리얼라이저"""

    class Meta:
        model = HealthCheck
        fields = [
            'id', 'service_name', 'status', 'check_type',
            'response_time_ms', 'details', 'last_check', 'created_at'
        ]
        read_only_fields = ['id', 'last_check', 'created_at']


class CacheStatisticsSerializer(serializers.ModelSerializer):
    """캐시 통계 시리얼라이저"""
    hit_rate = serializers.SerializerMethodField()

    class Meta:
        model = CacheStatistics
        fields = [
            'id', 'cache_key_pattern', 'hits', 'misses', 'hit_rate',
            'avg_size_bytes', 'total_size_bytes', 'eviction_count',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

    def get_hit_rate(self, obj):
        total = obj.hits + obj.misses
        if total > 0:
            return round(obj.hits / total * 100, 2)
        return 0.0


class SystemHealthSerializer(serializers.Serializer):
    """시스템 헬스 시리얼라이저"""
    status = serializers.CharField()
    version = serializers.CharField()
    uptime_seconds = serializers.FloatField()
    services = HealthCheckSerializer(many=True)
    metrics = SystemMetricSerializer(many=True)
    timestamp = serializers.DateTimeField()
