# -*- coding: utf-8 -*-
"""
Security Models
보안 모델
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
import json
import uuid


class AuditLog(models.Model):
    """감사 로그 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    action = models.CharField('작업', max_length=100, db_index=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                             related_name='audit_logs', verbose_name='수행자')
    actor_type = models.CharField('수행자 유형', max_length=50, choices=[
        ('user', '사용자'),
        ('system', '시스템'),
        ('api', 'API'),
    ], default='user')
    target_type = models.CharField('대상 유형', max_length=100, blank=True)
    target_id = models.CharField('대상 ID', max_length=100, blank=True)
    ip_address = models.GenericIPAddressField('IP 주소', null=True, blank=True)
    user_agent = models.TextField('User Agent', blank=True)
    changes = models.JSONField('변경 사항', default=dict, blank=True)
    old_values = models.JSONField('이전 값', default=dict, blank=True)
    new_values = models.JSONField('새 값', default=dict, blank=True)
    status = models.CharField('상태', max_length=20, choices=[
        ('success', '성공'),
        ('failed', '실패'),
        ('partial', '부분 성공'),
    ], default='success')
    error_message = models.TextField('에러 메시지', blank=True)
    timestamp = models.DateTimeField('시간戳', db_index=True, default=timezone.now)
    metadata = models.JSONField('메타데이터', default=dict, blank=True)

    class Meta:
        db_table = 'audit_log'
        verbose_name = '감사 로그'
        verbose_name_plural = '감사 로그'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['actor', '-timestamp']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.actor_type} - {self.action} ({self.status})"


class RateLimitRecord(models.Model):
    """속도 제한 기록 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    identifier = models.CharField('식별자', max_length=200, db_index=True)
    identifier_type = models.CharField('식별자 유형', max_length=50, choices=[
        ('ip', 'IP 주소'),
        ('user', '사용자'),
        ('api_key', 'API 키'),
    ], default='ip')
    endpoint = models.CharField('엔드포인트', max_length=200, db_index=True)
    request_count = models.IntegerField('요청 수', default=1)
    window_start = models.DateTimeField('윈도우 시작', db_index=True)
    blocked = models.BooleanField('차단 여부', default=False)
    block_until = models.DateTimeField('차단 해제 시간', null=True, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'rate_limit_record'
        verbose_name = '속도 제한 기록'
        verbose_name_plural = '속도 제한 기록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['identifier', 'endpoint', '-window_start']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.identifier} - {self.endpoint}: {self.request_count}"


class SecurityEvent(models.Model):
    """보안 이벤트 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    event_type = models.CharField('이벤트 유형', max_length=100, choices=[
        ('login_attempt', '로그인 시도'),
        ('login_success', '로그인 성공'),
        ('login_failure', '로그인 실패'),
        ('logout', '로그아웃'),
        ('permission_denied', '권한 거부'),
        ('suspicious_activity', '의심스러운 활동'),
        ('data_access', '데이터 접근'),
        ('data_modification', '데이터 수정'),
        ('rate_limit_exceeded', '속도 제한 초과'),
        ('brute_force_detected', '무차별 대입 공격 감지'),
    ], db_index=True)
    severity = models.CharField('심각도', max_length=20, choices=[
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
        ('critical', '치명적'),
    ], default='medium')
    description = models.TextField('설명')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                            related_name='security_events', verbose_name='사용자')
    ip_address = models.GenericIPAddressField('IP 주소', null=True, blank=True)
    user_agent = models.TextField('User Agent', blank=True)
    request_data = models.JSONField('요청 데이터', default=dict, blank=True)
    is_resolved = models.BooleanField('해결 여부', default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='resolved_security_events', blank=True)
    resolved_at = models.DateTimeField('해결 시간', null=True, blank=True)
    resolution_notes = models.TextField('해결 노트', blank=True)
    timestamp = models.DateTimeField('시간戳', db_index=True, default=timezone.now)

    class Meta:
        db_table = 'security_event'
        verbose_name = '보안 이벤트'
        verbose_name_plural = '보안 이벤트'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
            models.Index(fields=['is_resolved', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.severity}"


class LoginAttempt(models.Model):
    """로그인 시도 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    username = models.CharField('사용자명', max_length=150, db_index=True)
    ip_address = models.GenericIPAddressField('IP 주소')
    user_agent = models.TextField('User Agent', blank=True)
    was_successful = models.BooleanField('성공 여부', default=False)
    failure_reason = models.CharField('실패 사유', max_length=200, blank=True)
    timestamp = models.DateTimeField('시간戳', db_index=True, default=timezone.now)

    class Meta:
        db_table = 'login_attempt'
        verbose_name = '로그인 시도'
        verbose_name_plural = '로그인 시도'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['username', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['was_successful', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.username} - {self.ip_address} ({'성공' if self.was_successful else '실패'})"
