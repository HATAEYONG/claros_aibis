# -*- coding: utf-8 -*-
"""
Anomaly Detection Models
이상탐지 데이터 모델
"""
import uuid
from django.db import models
from django.utils import timezone


class AnomalyDetector(models.Model):
    """
    이상탐지기 모델
    이상탐지 알고리즘 설정
    """

    DETECTOR_TYPE_CHOICES = [
        ('statistical', '통계적'),
        ('ml_based', '머신러닝 기반'),
        ('isolation_forest', 'Isolation Forest'),
        ('autoencoder', '오토인코더'),
        ('lstm_ad', 'LSTM AD'),
        ('ensemble', '앙상블'),
    ]

    STATUS_CHOICES = [
        ('training', '학습 중'),
        ('ready', '준비 완료'),
        ('active', '활성'),
        ('disabled', '비활성'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 탐지기 정보
    name = models.CharField('탐지기명', max_length=200)
    code = models.CharField('탐지기 코드', max_length=100, unique=True)

    # 탐지 대상
    target_metric = models.CharField('타겟 지표', max_length=100)
    target_entity = models.CharField('타겟 엔티티', max_length=100, blank=True)  # equipment, product, etc.

    # 탐지기 유형
    detector_type = models.CharField('탐지기 유형', max_length=50, choices=DETECTOR_TYPE_CHOICES)

    # 파라미터
    parameters = models.JSONField('파라미터', default=dict)

    # 임계값
    threshold = models.FloatField('임계값', default=2.0)  # z-score threshold
    sensitivity = models.CharField(
        '민감도',
        max_length=20,
        choices=[('low', '낮음'), ('medium', '중간'), ('high', '높음')],
        default='medium'
    )

    # 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='training')
    last_trained = models.DateTimeField('마지막 학습일', null=True, blank=True)

    # 메타데이터
    description = models.TextField('설명', blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'anomaly_detector'
        verbose_name = '이상탐지기'
        verbose_name_plural = '이상탐지기'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['target_metric', 'status']),
        ]

    def __str__(self):
        return f"[{self.detector_type}] {self.name}"


class AnomalyAlert(models.Model):
    """
    이상 알림 모델
    감지된 이상 이벤트
    """

    SEVERITY_CHOICES = [
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
        ('critical', '매우 높음'),
    ]

    STATUS_CHOICES = [
        ('open', '열림'),
        ('investigating', '조사 중'),
        ('resolved', '해결됨'),
        ('false_positive', '오탐'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 연결
    detector = models.ForeignKey(
        AnomalyDetector,
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name='이상탐지기'
    )

    # 이상 정보
    detected_at = models.DateTimeField('감지일')
    metric_name = models.CharField('지표명', max_length=100)
    entity_id = models.CharField('엔티티 ID', max_length=100, blank=True)

    # 이상값
    actual_value = models.FloatField('실제값')
    expected_value = models.FloatField('예상값')
    deviation_score = models.FloatField('편차 점수')

    # 심각도
    severity = models.CharField('심각도', max_length=20, choices=SEVERITY_CHOICES)

    # 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='open')

    # 상세 정보
    description = models.TextField('설명', blank=True)
    context = models.JSONField('컨텍스트', default=dict)

    # 조치 정보
    resolved_at = models.DateTimeField('해결일', null=True, blank=True)
    resolved_by = models.CharField('해결자', max_length=100, blank=True)
    resolution_notes = models.TextField('해결 비고', blank=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'anomaly_alert'
        verbose_name = '이상 알림'
        verbose_name_plural = '이상 알림'
        indexes = [
            models.Index(fields=['detector', '-detected_at']),
            models.Index(fields=['status', '-detected_at']),
            models.Index(fields=['severity', '-detected_at']),
        ]

    def __str__(self):
        return f"Anomaly {self.metric_name} - {self.detected_at.strftime('%Y-%m-%d %H:%M')}"


class AnomalyPattern(models.Model):
    """
    이상 패턴 모델
    반복되는 이상 패턴 학습
    """

    PATTERN_TYPE_CHOICES = [
        ('seasonal', '계절적'),
        ('trend', '추세'),
        ('sporadic', '산발적'),
        ('cyclical', '주기적'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 패턴 정보
    name = models.CharField('패턴명', max_length=200)
    pattern_type = models.CharField('패턴 유형', max_length=20, choices=PATTERN_TYPE_CHOICES)

    # 패턴 특징
    metrics = models.JSONField('관련 지표', default=list)
    time_window = models.CharField('시간 윈도우', max_length=50)  # e.g., "daily 9-11am"
    frequency = models.IntegerField('빈도', default=1)  # occurrences per period

    # 패턴 규칙
    conditions = models.JSONField('조건', default=dict)
    threshold_exceeded = models.FloatField('초과 임계값', default=2.0)

    # 통계
    occurrence_count = models.IntegerField('발생 횟수', default=0)
    last_occurrence = models.DateTimeField('마지막 발생', null=True, blank=True)

    # 활성화
    is_active = models.BooleanField('활성 여부', default=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'anomaly_pattern'
        verbose_name = '이상 패턴'
        verbose_name_plural = '이상 패턴'
        indexes = [
            models.Index(fields=['pattern_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.pattern_type})"
