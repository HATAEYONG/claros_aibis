# -*- coding: utf-8 -*-
"""
Data Hub 직렬화기
데이터 통합 계층 모델 직렬화
"""
from rest_framework import serializers
from data_hub.models import (
    DataSource, DataSyncLog, DataMart,
    DataQualityRule, DataQualityCheck, DataLineage
)


class DataSourceSerializer(serializers.ModelSerializer):
    """데이터 소스 직렬화기"""

    class Meta:
        model = DataSource
        fields = [
            'id', 'name', 'source_type', 'sync_schedule', 'status',
            'is_active', 'last_sync_at', 'last_sync_status',
            'batch_size', 'timeout_seconds', 'retry_attempts',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_sync_at', 'last_sync_status']


class DataSyncLogSerializer(serializers.ModelSerializer):
    """데이터 동기화 로그 직렬화기"""

    data_source_name = serializers.CharField(source='data_source.name', read_only=True)

    class Meta:
        model = DataSyncLog
        fields = [
            'id', 'data_source', 'data_source_name', 'status', 'sync_type',
            'started_at', 'completed_at', 'duration_seconds',
            'records_processed', 'records_succeeded', 'records_failed',
            'error_message', 'metadata', 'tables_synced',
        ]
        read_only_fields = ['id', 'started_at', 'completed_at', 'duration_seconds']


class DataMartSerializer(serializers.ModelSerializer):
    """데이터 마트 직렬화기"""

    class Meta:
        model = DataMart
        fields = [
            'id', 'name', 'mart_type', 'target_table', 'source_query',
            'refresh_schedule', 'status', 'is_active',
            'last_refresh_at', 'last_refresh_status',
            'row_count', 'size_mb',
            'description', 'business_domain',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_refresh_at', 'row_count', 'size_mb']


class DataQualityRuleSerializer(serializers.ModelSerializer):
    """데이터 품질 규칙 직렬화기"""

    class Meta:
        model = DataQualityRule
        fields = [
            'id', 'name', 'rule_type', 'target_table', 'target_column',
            'rule_params', 'severity', 'is_active',
            'description', 'error_message',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DataQualityCheckSerializer(serializers.ModelSerializer):
    """데이터 품질 검사 직렬화기"""

    rule_name = serializers.CharField(source='rule.name', read_only=True)

    class Meta:
        model = DataQualityCheck
        fields = [
            'id', 'rule', 'rule_name', 'status', 'checked_at',
            'total_records', 'failed_records', 'failure_rate',
            'error_details', 'metadata',
        ]
        read_only_fields = ['id', 'checked_at']


class DataLineageSerializer(serializers.ModelSerializer):
    """데이터 계보 직렬화기"""

    class Meta:
        model = DataLineage
        fields = [
            'id', 'source_entity_type', 'source_entity',
            'target_entity_type', 'target_entity',
            'transformation', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

