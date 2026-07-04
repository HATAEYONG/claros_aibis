# -*- coding: utf-8 -*-
"""
Security Serializers
보안 시리얼라이저
"""
from rest_framework import serializers
from .models import AuditLog, RateLimitRecord, SecurityEvent, LoginAttempt


class AuditLogSerializer(serializers.ModelSerializer):
    """감사 로그 시리얼라이저"""
    username = serializers.CharField(source='actor.username', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'actor', 'username', 'actor_type',
            'target_type', 'target_id', 'ip_address', 'user_agent',
            'changes', 'old_values', 'new_values', 'status',
            'error_message', 'timestamp', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class RateLimitRecordSerializer(serializers.ModelSerializer):
    """속도 제한 기록 시리얼라이저"""

    class Meta:
        model = RateLimitRecord
        fields = [
            'id', 'identifier', 'identifier_type', 'endpoint',
            'request_count', 'window_start', 'blocked',
            'block_until', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SecurityEventSerializer(serializers.ModelSerializer):
    """보안 이벤트 시리얼라이저"""
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    resolved_by_username = serializers.CharField(source='resolved_by.username', read_only=True, allow_null=True)

    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'event_type', 'severity', 'description',
            'user', 'username', 'ip_address', 'user_agent',
            'request_data', 'is_resolved', 'resolved_by_username',
            'resolved_at', 'resolution_notes', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class LoginAttemptSerializer(serializers.ModelSerializer):
    """로그인 시도 시리얼라이저"""

    class Meta:
        model = LoginAttempt
        fields = [
            'id', 'username', 'ip_address', 'user_agent',
            'was_successful', 'failure_reason', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
