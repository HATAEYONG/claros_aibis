"""
ERP 연결 설정 Serializer
DB 모델 기반 연결 설정 API 시리얼라이저
"""

from rest_framework import serializers
from erp_sync.models import ERPConnectionConfigModel


class ERPConnectionConfigSerializer(serializers.ModelSerializer):
    """ERP 연결 설정 시리얼라이저"""

    can_attempt_connection = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()

    class Meta:
        model = ERPConnectionConfigModel
        fields = [
            'config_id',
            'source_code',
            'source_name',
            'source_type',
            'description',
            'host',
            'port',
            'database_name',
            'schema_name',
            'username',
            'password',
            'is_enabled',
            'use_fallback',
            'fallback_source',
            'connection_timeout',
            'query_timeout',
            'max_retry_attempts',
            'cooldown_seconds',
            'suppress_errors',
            'last_connection_attempt',
            'last_connection_success',
            'last_connection_error',
            'failure_count',
            'created_at',
            'updated_at',
            'can_attempt_connection',
            'connection_status',
        ]
        read_only_fields = [
            'config_id',
            'created_at',
            'updated_at',
            'last_connection_attempt',
            'last_connection_success',
            'last_connection_error',
            'failure_count',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def get_can_attempt_connection(self, obj):
        """연결 시도 가능 여부"""
        return obj.can_attempt_connection()

    def get_connection_status(self, obj):
        """연결 상태 요약"""
        return {
            'enabled': obj.is_enabled,
            'in_cooldown': not obj.can_attempt_connection() if obj.is_enabled else False,
            'last_success': obj.last_connection_success,
            'last_error': obj.last_connection_error,
            'failure_count': obj.failure_count,
        }


class ERPConnectionConfigListSerializer(serializers.ModelSerializer):
    """ERP 연결 설정 목록 시리얼라이저 (간소화)"""

    class Meta:
        model = ERPConnectionConfigModel
        fields = [
            'config_id',
            'source_code',
            'source_name',
            'source_type',
            'is_enabled',
            'use_fallback',
            'last_connection_success',
            'failure_count',
        ]


class ERPConnectionConfigCreateSerializer(serializers.ModelSerializer):
    """ERP 연결 설정 생성 시리얼라이저"""

    class Meta:
        model = ERPConnectionConfigModel
        fields = [
            'source_code',
            'source_name',
            'source_type',
            'description',
            'host',
            'port',
            'database_name',
            'schema_name',
            'username',
            'password',
            'is_enabled',
            'use_fallback',
            'fallback_source',
            'connection_timeout',
            'query_timeout',
            'max_retry_attempts',
            'cooldown_seconds',
            'suppress_errors',
        ]

    def validate_source_code(self, value):
        """소스 코드 중복 확인"""
        from erp_sync.models import ERPConnectionConfigModel

        if ERPConnectionConfigModel.objects.filter(source_code=value).exists():
            raise serializers.ValidationError(f'소스 코드 "{value}"가 이미 존재합니다.')

        return value


class ERPConnectionConfigUpdateSerializer(serializers.ModelSerializer):
    """ERP 연결 설정 수정 시리얼라이저"""

    class Meta:
        model = ERPConnectionConfigModel
        fields = [
            'source_name',
            'description',
            'host',
            'port',
            'database_name',
            'schema_name',
            'username',
            'password',
            'is_enabled',
            'use_fallback',
            'fallback_source',
            'connection_timeout',
            'query_timeout',
            'max_retry_attempts',
            'cooldown_seconds',
            'suppress_errors',
        ]


class ConnectionTestSerializer(serializers.Serializer):
    """연결 테스트 시리얼라이저"""

    source_code = serializers.CharField(max_length=20, help_text='테스트할 소스 코드')


class ToggleConnectionSerializer(serializers.Serializer):
    """연결 on/off 토글 시리얼라이저"""

    source_code = serializers.CharField(max_length=20, help_text='토글할 소스 코드')
    enabled = serializers.BooleanField(required=False, help_text='활성화 상태 (None인 경우 토글)')


class ResetConnectionSerializer(serializers.Serializer):
    """연결 상태 초기화 시리얼라이저"""

    source_code = serializers.CharField(max_length=20, help_text='초기화할 소스 코드')
