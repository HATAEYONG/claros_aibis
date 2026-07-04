# -*- coding: utf-8 -*-
"""
Monitoring Models
시스템 모니터링 모델
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
import json
import uuid


class SystemMetric(models.Model):
    """시스템 메트릭 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    metric_name = models.CharField('메트릭명', max_length=100, db_index=True)
    metric_type = models.CharField('메트릭 유형', max_length=50, choices=[
        ('counter', '카운터'),
        ('gauge', '게이지'),
        ('histogram', '히스토그램'),
        ('summary', '요약'),
    ])
    value = models.FloatField('값')
    unit = models.CharField('단위', max_length=50, blank=True)
    tags = models.JSONField('태그', default=dict, blank=True)
    timestamp = models.DateTimeField('시간戳', db_index=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'system_metric'
        verbose_name = '시스템 메트릭'
        verbose_name_plural = '시스템 메트릭'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_name', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.metric_name}: {self.value} {self.unit}"


class APILog(models.Model):
    """API 로그 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    method = models.CharField('HTTP 메서드', max_length=10)
    path = models.CharField('요청 경로', max_length=500, db_index=True)
    query_params = models.JSONField('쿼리 파라미터', default=dict, blank=True)
    request_body = models.TextField('요청 본문', blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                            related_name='api_logs', verbose_name='사용자')
    ip_address = models.GenericIPAddressField('IP 주소', null=True, blank=True)
    user_agent = models.TextField('User Agent', blank=True)
    status_code = models.IntegerField('상태 코드', db_index=True)
    response_time_ms = models.FloatField('응답 시간(ms)', db_index=True)
    response_body = models.TextField('응답 본문', blank=True)
    error_message = models.TextField('에러 메시지', blank=True)
    timestamp = models.DateTimeField('시간戳', db_index=True, default=timezone.now)

    class Meta:
        db_table = 'api_log'
        verbose_name = 'API 로그'
        verbose_name_plural = 'API 로그'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['path', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['status_code', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code}"


class ErrorLog(models.Model):
    """에러 로그 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    error_type = models.CharField('에러 유형', max_length=100, db_index=True)
    error_message = models.TextField('에러 메시지')
    stack_trace = models.TextField('스택 트레이스')
    request_path = models.CharField('요청 경로', max_length=500, blank=True)
    request_method = models.CharField('요청 메서드', max_length=10, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                            related_name='error_logs', verbose_name='사용자')
    ip_address = models.GenericIPAddressField('IP 주소', null=True, blank=True)
    user_agent = models.TextField('User Agent', blank=True)
    is_resolved = models.BooleanField('해결 여부', default=False)
    resolved_at = models.DateTimeField('해결 시간', null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='resolved_errors', blank=True)
    occurred_at = models.DateTimeField('발생 시간', db_index=True, default=timezone.now)
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'error_log'
        verbose_name = '에러 로그'
        verbose_name_plural = '에러 로그'
        ordering = ['-occurred_at']
        indexes = [
            models.Index(fields=['error_type', '-occurred_at']),
            models.Index(fields=['is_resolved', '-occurred_at']),
            models.Index(fields=['-occurred_at']),
        ]

    def __str__(self):
        return f"{self.error_type}: {self.error_message[:50]}"


class PerformanceLog(models.Model):
    """성능 로그 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    operation_name = models.CharField('작업명', max_length=100, db_index=True)
    operation_type = models.CharField('작업 유형', max_length=50, choices=[
        ('api_call', 'API 호출'),
        ('db_query', 'DB 쿼리'),
        ('cache_operation', '캐시 작업'),
        ('external_call', '외부 호출'),
        ('background_task', '백그라운드 작업'),
    ])
    duration_ms = models.FloatField('소요 시간(ms)', db_index=True)
    metadata = models.JSONField('메타데이터', default=dict, blank=True)
    timestamp = models.DateTimeField('시간戳', db_index=True, default=timezone.now)

    class Meta:
        db_table = 'performance_log'
        verbose_name = '성능 로그'
        verbose_name_plural = '성능 로그'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['operation_name', '-timestamp']),
            models.Index(fields=['operation_type', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.operation_name}: {self.duration_ms}ms"


class HealthCheck(models.Model):
    """헬스 체크 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    service_name = models.CharField('서비스명', max_length=100, db_index=True)
    status = models.CharField('상태', max_length=20, choices=[
        ('healthy', '정상'),
        ('degraded', '성능 저하'),
        ('unhealthy', '비정상'),
    ], default='healthy')
    check_type = models.CharField('체크 유형', max_length=50, choices=[
        ('database', '데이터베이스'),
        ('cache', '캐시'),
        ('external_api', '외부 API'),
        ('disk_space', '디스크 공간'),
        ('memory', '메모리'),
        ('cpu', 'CPU'),
    ])
    response_time_ms = models.FloatField('응답 시간(ms)', null=True, blank=True)
    details = models.JSONField('상세 정보', default=dict, blank=True)
    last_check = models.DateTimeField('마지막 체크', auto_now=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'health_check'
        verbose_name = '헬스 체크'
        verbose_name_plural = '헬스 체크'
        ordering = ['-last_check']
        indexes = [
            models.Index(fields=['service_name', '-last_check']),
            models.Index(fields=['status', '-last_check']),
        ]

    def __str__(self):
        return f"{self.service_name}: {self.status}"


class CacheStatistics(models.Model):
    """캐시 통계 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    cache_key_pattern = models.CharField('캐시 키 패턴', max_length=200, db_index=True)
    hits = models.IntegerField('히트 수', default=0)
    misses = models.IntegerField('미스 수', default=0)
    avg_size_bytes = models.FloatField('평균 크기(bytes)', null=True, blank=True)
    total_size_bytes = models.FloatField('전체 크기(bytes)', null=True, blank=True)
    eviction_count = models.IntegerField('제거 수', default=0)
    timestamp = models.DateTimeField('시간戳', db_index=True, auto_now_add=True)

    class Meta:
        db_table = 'cache_statistics'
        verbose_name = '캐시 통계'
        verbose_name_plural = '캐시 통계'
        ordering = ['-timestamp']

    def __str__(self):
        hit_rate = self.hits / (self.hits + self.misses) * 100 if (self.hits + self.misses) > 0 else 0
        return f"{self.cache_key_pattern}: {hit_rate:.1f}% hit rate"
