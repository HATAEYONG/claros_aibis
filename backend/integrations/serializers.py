# -*- coding: utf-8 -*-
"""
External Integration Serializers
외부 연동 시리얼라이저
"""
from rest_framework import serializers
from .models import IntegrationConfig, IntegrationLog, WebhookConfig, WebhookDelivery, DataExchange


class IntegrationConfigSerializer(serializers.ModelSerializer):
    """연동 설정 시리얼라이저"""

    class Meta:
        model = IntegrationConfig
        fields = [
            'id', 'name', 'code', 'integration_type', 'endpoint_url',
            'auth_type', 'auth_config', 'headers', 'parameters',
            'is_active', 'sync_interval', 'last_sync_at',
            'created_at', 'updated_at', 'description'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_sync_at']


class IntegrationLogSerializer(serializers.ModelSerializer):
    """연동 로그 시리얼라이저"""
    integration_name = serializers.CharField(source='integration.name', read_only=True)

    class Meta:
        model = IntegrationLog
        fields = [
            'id', 'integration', 'integration_name', 'action_type', 'status',
            'request_data', 'response_data', 'error_message',
            'records_processed', 'records_succeeded', 'records_failed',
            'started_at', 'completed_at', 'duration_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class WebhookConfigSerializer(serializers.ModelSerializer):
    """웹훅 설정 시리얼라이저"""

    class Meta:
        model = WebhookConfig
        fields = [
            'id', 'name', 'code', 'event_type', 'target_url', 'http_method',
            'headers', 'payload_template', 'retry_policy', 'is_active',
            'created_at', 'updated_at', 'description'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WebhookDeliverySerializer(serializers.ModelSerializer):
    """웹훅 전송 기록 시리얼라이저"""
    webhook_name = serializers.CharField(source='webhook.name', read_only=True)

    class Meta:
        model = WebhookDelivery
        fields = [
            'id', 'webhook', 'webhook_name', 'event_id', 'payload',
            'response_status', 'response_body', 'error_message',
            'attempt_count', 'status', 'delivered_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'delivered_at']


class DataExchangeSerializer(serializers.ModelSerializer):
    """데이터 교환 시리얼라이저"""

    class Meta:
        model = DataExchange
        fields = [
            'id', 'exchange_type', 'data_type', 'file_format',
            'file_path', 'file_size', 'record_count', 'status',
            'columns', 'filters', 'error_message', 'requested_by',
            'started_at', 'completed_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'completed_at']
