# -*- coding: utf-8 -*-
"""
ML Pipeline Models
Machine Learning Pipeline 데이터 모델
"""
import uuid
import json
from django.db import models
from django.utils import timezone


class MLModel(models.Model):
    """
    ML 모델 모델
    학습된 머신러닝 모델 정보 저장
    """

    MODEL_TYPE_CHOICES = [
        ('regression', '회귀'),
        ('classification', '분류'),
        ('time_series', '시계열'),
        ('clustering', '클러스터링'),
        ('anomaly_detection', '이상탐지'),
        ('forecasting', '예측'),
    ]

    STATUS_CHOICES = [
        ('training', '학습 중'),
        ('trained', '학습 완료'),
        ('deployed', '배포됨'),
        ('failed', '실패'),
        ('archived', '보관됨'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 모델 식별
    name = models.CharField('모델명', max_length=200)
    code = models.CharField('모델 코드', max_length=100, unique=True)
    version = models.CharField('버전', max_length=50, default='1.0.0')

    # 모델 유형
    model_type = models.CharField('모델 유형', max_length=50, choices=MODEL_TYPE_CHOICES)
    algorithm = models.CharField('알고리즘', max_length=100)

    # 타겟 정보
    target_feature = models.CharField('타겟 피쳐', max_length=100)
    features = models.JSONField('피쳐 목록', default=list)

    # 모델 파일 (Pickle/Joblib)
    model_file = models.FileField('모델 파일', upload_to='ml_models/', null=True, blank=True)

    # 모델 메타데이터
    hyperparameters = models.JSONField('하이퍼파라미터', default=dict)
    metrics = models.JSONField('성능 지표', default=dict)

    # 학습 정보
    trained_at = models.DateTimeField('학습일', null=True, blank=True)
    training_samples = models.IntegerField('학습 데이터 수', default=0)
    training_time_ms = models.IntegerField('학습 시간(ms)', default=0)

    # 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='training')
    error_message = models.TextField('에러 메시지', blank=True)

    # 배포 정보
    is_deployed = models.BooleanField('배포 여부', default=False)
    deployed_at = models.DateTimeField('배포일', null=True, blank=True)

    # 메타데이터
    description = models.TextField('설명', blank=True)
    created_by = models.CharField('생성자', max_length=100, blank=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'ml_model'
        verbose_name = 'ML 모델'
        verbose_name_plural = 'ML 모델'
        indexes = [
            models.Index(fields=['model_type', 'status']),
            models.Index(fields=['code', 'version']),
            models.Index(fields=['is_deployed']),
        ]

    def __str__(self):
        return f"[{self.model_type}] {self.name} v{self.version}"


class TrainingJob(models.Model):
    """
    학습 작업 모델
    모델 학습 작업 추적
    """

    STATUS_CHOICES = [
        ('pending', '대기 중'),
        ('running', '실행 중'),
        ('completed', '완료'),
        ('failed', '실패'),
        ('cancelled', '취소됨'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 연결
    model = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name='training_jobs',
        verbose_name='ML 모델',
        null=True,
        blank=True
    )

    # 작업 정보
    job_name = models.CharField('작업명', max_length=200)
    job_type = models.CharField('작업 유형', max_length=50)

    # 학습 파라미터
    parameters = models.JSONField('학습 파라미터', default=dict)
    data_source = models.CharField('데이터 소스', max_length=200, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField('진행률(%)', default=0)
    current_step = models.CharField('현재 단계', max_length=100, blank=True)

    # 결과
    result = models.JSONField('결과', default=dict, null=True, blank=True)
    error_message = models.TextField('에러 메시지', blank=True)

    # 성능 메트릭
    started_at = models.DateTimeField('시작일', null=True, blank=True)
    completed_at = models.DateTimeField('완료일', null=True, blank=True)
    duration_ms = models.IntegerField('실행 시간(ms)', null=True, blank=True)

    # 리소스 사용
    cpu_usage = models.FloatField('CPU 사용률(%)', null=True, blank=True)
    memory_usage_mb = models.FloatField('메모리 사용량(MB)', null=True, blank=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'ml_training_job'
        verbose_name = '학습 작업'
        verbose_name_plural = '학습 작업'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['model', '-created_at']),
        ]

    def __str__(self):
        return f"{self.job_name} ({self.status})"


class PredictionRequest(models.Model):
    """
    예측 요청 모델
    모델 예측 요청 기록
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 연결
    model = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name='ML 모델'
    )

    # 요청 정보
    request_id = models.CharField('요청 ID', max_length=100, unique=True)
    input_data = models.JSONField('입력 데이터')
    prediction_result = models.JSONField('예측 결과', default=dict)

    # 성능
    inference_time_ms = models.IntegerField('추론 시간(ms)', null=True, blank=True)

    # 메타데이터
    requested_by = models.CharField('요청자', max_length=100, blank=True)
    request_source = models.CharField('요청 소스', max_length=100, blank=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'ml_prediction_request'
        verbose_name = '예측 요청'
        verbose_name_plural = '예측 요청'
        indexes = [
            models.Index(fields=['model', '-created_at']),
            models.Index(fields=['request_id']),
        ]

    def __str__(self):
        return f"Prediction {self.request_id}"


class FeatureStore(models.Model):
    """
    피쳐 저장소 모델
    머신러닝 피쳐 저장 및 관리
    """

    FEATURE_TYPE_CHOICES = [
        ('numerical', '수치형'),
        ('categorical', '범주형'),
        ('text', '텍스트'),
        ('datetime', '날짜시간'),
        ('boolean', '불린'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 피쳐 정보
    name = models.CharField('피쳐명', max_length=100, unique=True)
    display_name = models.CharField('표시명', max_length=200)
    feature_type = models.CharField('피쳐 유형', max_length=20, choices=FEATURE_TYPE_CHOICES)

    # 데이터 소스
    source_table = models.CharField('소스 테이블', max_length=100)
    source_column = models.CharField('소스 컬럼', max_length=100)

    # 피쳐 설명
    description = models.TextField('설명', blank=True)
    data_type = models.CharField('데이터 타입', max_length=50)

    # 통계 정보
    statistics = models.JSONField('통계 정보', default=dict)  # mean, std, min, max, etc.

    # 변환 정보
    transformation = models.JSONField('변환 방법', default=dict)
    is_active = models.BooleanField('활성 여부', default=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'ml_feature_store'
        verbose_name = '피쳐 저장소'
        verbose_name_plural = '피쳐 저장소'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['feature_type']),
            models.Index(fields=['source_table']),
        ]

    def __str__(self):
        return f"{self.name} ({self.feature_type})"


class Experiment(models.Model):
    """
    실험 모델
    ML 실험 추적 및 관리
    """

    STATUS_CHOICES = [
        ('running', '실행 중'),
        ('completed', '완료'),
        ('failed', '실패'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 실험 정보
    name = models.CharField('실험명', max_length=200)
    description = models.TextField('설명', blank=True)

    # 실험 파라미터
    parameters = models.JSONField('파라미터', default=dict)
    metrics = models.JSONField('지표', default=dict)

    # 연결
    model = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name='experiments',
        verbose_name='ML 모델',
        null=True,
        blank=True
    )

    # 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='running')

    # 결과
    artifacts = models.JSONField('아티팩트', default=dict)  # model paths, logs, etc.
    logs = models.TextField('로그', blank=True)

    # 시각
    started_at = models.DateTimeField('시작일', auto_now_add=True)
    completed_at = models.DateTimeField('완료일', null=True, blank=True)

    class Meta:
        db_table = 'ml_experiment'
        verbose_name = 'ML 실험'
        verbose_name_plural = 'ML 실험'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.name} ({self.status})"
