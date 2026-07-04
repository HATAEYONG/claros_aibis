# -*- coding: utf-8 -*-
"""
External Integration Models
외부 연동 모델
"""
from django.db import models
from django.core.validators import URLValidator
from django.utils import timezone
import json
import uuid


class IntegrationConfig(models.Model):
    """연동 설정 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField('연동명', max_length=200)
    code = models.CharField('연동 코드', max_length=100, unique=True)
    integration_type = models.CharField('연동 유형', max_length=50, choices=[
        ('erp', 'ERP 시스템'),
        ('api', '외부 API'),
        ('database', '데이터베이스'),
        ('file', '파일'),
        ('webhook', '웹훅'),
    ])
    endpoint_url = models.URLField('엔드포인트 URL', max_length=500, blank=True)
    auth_type = models.CharField('인증 유형', max_length=50, choices=[
        ('none', '없음'),
        ('basic', 'Basic Auth'),
        ('bearer', 'Bearer Token'),
        ('api_key', 'API Key'),
        ('oauth2', 'OAuth 2.0'),
    ], default='none')
    auth_config = models.JSONField('인증 설정', default=dict, blank=True)
    headers = models.JSONField('요청 헤더', default=dict, blank=True)
    parameters = models.JSONField('연동 파라미터', default=dict, blank=True)
    is_active = models.BooleanField('활성화 여부', default=True)
    sync_interval = models.IntegerField('동기화 간격(분)', default=60)
    last_sync_at = models.DateTimeField('마지막 동기화', null=True, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)
    description = models.TextField('설명', blank=True)

    class Meta:
        db_table = 'integration_config'
        verbose_name = '연동 설정'
        verbose_name_plural = '연동 설정'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"


class IntegrationLog(models.Model):
    """연동 로그 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    integration = models.ForeignKey(IntegrationConfig, on_delete=models.CASCADE,
                                   related_name='logs', verbose_name='연동')
    action_type = models.CharField('작업 유형', max_length=50, choices=[
        ('sync', '동기화'),
        ('export', '내보내기'),
        ('import', '가져오기'),
        ('webhook', '웹훅'),
        ('api_call', 'API 호출'),
    ])
    status = models.CharField('상태', max_length=20, choices=[
        ('pending', '대기 중'),
        ('running', '실행 중'),
        ('success', '성공'),
        ('failed', '실패'),
        ('partial', '부분 성공'),
    ], default='pending')
    request_data = models.JSONField('요청 데이터', default=dict, blank=True)
    response_data = models.JSONField('응답 데이터', default=dict, blank=True)
    error_message = models.TextField('에러 메시지', blank=True)
    records_processed = models.IntegerField('처理된 레코드 수', default=0)
    records_succeeded = models.IntegerField('성공 레코드 수', default=0)
    records_failed = models.IntegerField('실패 레코드 수', default=0)
    started_at = models.DateTimeField('시작 시간', null=True, blank=True)
    completed_at = models.DateTimeField('완료 시간', null=True, blank=True)
    duration_seconds = models.FloatField('소요 시간(초)', null=True, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'integration_log'
        verbose_name = '연동 로그'
        verbose_name_plural = '연동 로그'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['integration', 'status']),
            models.Index(fields=['action_type', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.integration.name} - {self.action_type} ({self.status})"


class WebhookConfig(models.Model):
    """웹훅 설정 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField('웹훅명', max_length=200)
    code = models.CharField('웹훅 코드', max_length=100, unique=True)
    event_type = models.CharField('이벤트 유형', max_length=100)
    target_url = models.URLField('대상 URL', max_length=500)
    http_method = models.CharField('HTTP 메서드', max_length=10, choices=[
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
    ], default='POST')
    headers = models.JSONField('요청 헤더', default=dict, blank=True)
    payload_template = models.JSONField('페이로드 템플릿', default=dict, blank=True)
    retry_policy = models.JSONField('재시도 정책', default=dict, blank=True)
    is_active = models.BooleanField('활성화 여부', default=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)
    description = models.TextField('설명', blank=True)

    class Meta:
        db_table = 'webhook_config'
        verbose_name = '웹훅 설정'
        verbose_name_plural = '웹훅 설정'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.event_type})"


class WebhookDelivery(models.Model):
    """웹훅 전송 기록 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    webhook = models.ForeignKey(WebhookConfig, on_delete=models.CASCADE,
                               related_name='deliveries', verbose_name='웹훅')
    event_id = models.CharField('이벤트 ID', max_length=100, blank=True)
    payload = models.JSONField('전송 데이터')
    response_status = models.IntegerField('응답 상태코드', null=True, blank=True)
    response_body = models.TextField('응답 본문', blank=True)
    error_message = models.TextField('에러 메시지', blank=True)
    attempt_count = models.IntegerField('시도 횟수', default=1)
    status = models.CharField('상태', max_length=20, choices=[
        ('pending', '대기 중'),
        ('delivered', '전송 완료'),
        ('failed', '실패'),
        ('retrying', '재시도 중'),
    ], default='pending')
    delivered_at = models.DateTimeField('전송 시간', null=True, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'webhook_delivery'
        verbose_name = '웹훅 전송 기록'
        verbose_name_plural = '웹훅 전송 기록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['webhook', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.webhook.name} - {self.status}"


class DataExchange(models.Model):
    """데이터 교환 기록 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    exchange_type = models.CharField('교환 유형', max_length=20, choices=[
        ('export', '내보내기'),
        ('import', '가져오기'),
    ])
    data_type = models.CharField('데이터 유형', max_length=50)
    file_format = models.CharField('파일 형식', max_length=20, choices=[
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
        ('xml', 'XML'),
    ])
    file_path = models.CharField('파일 경로', max_length=500, blank=True)
    file_size = models.IntegerField('파일 크기(bytes)', null=True, blank=True)
    record_count = models.IntegerField('레코드 수', null=True, blank=True)
    status = models.CharField('상태', max_length=20, choices=[
        ('pending', '대기 중'),
        ('processing', '처리 중'),
        ('completed', '완료'),
        ('failed', '실패'),
    ], default='pending')
    columns = models.JSONField('열 정보', default=list, blank=True)
    filters = models.JSONField('필터 조건', default=dict, blank=True)
    error_message = models.TextField('에러 메시지', blank=True)
    requested_by = models.CharField('요청자', max_length=100, blank=True)
    started_at = models.DateTimeField('시작 시간', null=True, blank=True)
    completed_at = models.DateTimeField('완료 시간', null=True, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'data_exchange'
        verbose_name = '데이터 교환'
        verbose_name_plural = '데이터 교환'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['exchange_type', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.exchange_type} - {self.data_type} ({self.status})"
