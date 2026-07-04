# -*- coding: utf-8 -*-
"""
Forecasting Models
시계열 예측 데이터 모델
"""
import uuid
from django.db import models
from django.utils import timezone


class ForecastModel(models.Model):
    """
    예측 모델 모델
    시계열 예측 모델 정보
    """

    FORECAST_TYPE_CHOICES = [
        ('arima', 'ARIMA'),
        ('prophet', 'Prophet'),
        ('lstm', 'LSTM'),
        ('exponential_smoothing', '지수평활'),
        ('theta', 'Theta'),
        ('ensemble', '앙상블'),
    ]

    STATUS_CHOICES = [
        ('training', '학습 중'),
        ('ready', '준비 완료'),
        ('active', '활성'),
        ('deprecated', '사용 안함'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 모델 식별
    name = models.CharField('모델명', max_length=200)
    code = models.CharField('모델 코드', max_length=100, unique=True)

    # 예측 대상
    target_metric = models.CharField('타겟 지표', max_length=100)
    time_granularity = models.CharField('시간 단위', max_length=20, default='daily')  # hourly, daily, weekly, monthly

    # 모델 유형
    forecast_type = models.CharField('예측 유형', max_length=50, choices=FORECAST_TYPE_CHOICES)
    forecast_horizon = models.IntegerField('예측 기간', default=30)  # days

    # 파라미터
    parameters = models.JSONField('파라미터', default=dict)

    # 성능 지표
    mae = models.FloatField('MAE', null=True, blank=True)
    mape = models.FloatField('MAPE', null=True, blank=True)
    rmse = models.FloatField('RMSE', null=True, blank=True)

    # 상태
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='training')
    last_trained = models.DateTimeField('마지막 학습일', null=True, blank=True)

    # 메타데이터
    description = models.TextField('설명', blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'forecast_model'
        verbose_name = '예측 모델'
        verbose_name_plural = '예측 모델'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['target_metric', 'status']),
        ]

    def __str__(self):
        return f"[{self.forecast_type}] {self.name}"


class ForecastResult(models.Model):
    """
    예측 결과 모델
    시계열 예측 결과 저장
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 연결
    forecast_model = models.ForeignKey(
        ForecastModel,
        on_delete=models.CASCADE,
        related_name='forecasts',
        verbose_name='예측 모델'
    )

    # 예측 정보
    forecast_date = models.DateTimeField('예측 생성일')
    target_start = models.DateField('예측 시작일')
    target_end = models.DateField('예측 종료일')

    # 예측값
    forecast_values = models.JSONField('예측값')  # [{date, value, lower_bound, upper_bound}]

    # 신뢰구간
    confidence_level = models.FloatField('신뢰 수준', default=0.95)

    # 메타데이터
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'forecast_result'
        verbose_name = '예측 결과'
        verbose_name_plural = '예측 결과'
        indexes = [
            models.Index(fields=['forecast_model', '-forecast_date']),
            models.Index(fields=['target_start', 'target_end']),
        ]

    def __str__(self):
        return f"Forecast {self.forecast_model.name} - {self.forecast_date.strftime('%Y-%m-%d')}"


class ForecastAccuracyLog(models.Model):
    """
    예측 정확도 로그 모델
    예측 정확도 추적
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # 연결
    forecast_model = models.ForeignKey(
        ForecastModel,
        on_delete=models.CASCADE,
        related_name='accuracy_logs',
        verbose_name='예측 모델'
    )

    # 평가 기간
    evaluation_start = models.DateField('평가 시작일')
    evaluation_end = models.DateField('평가 종료일')

    # 정확도 지표
    mae = models.FloatField('MAE')
    mape = models.FloatField('MAPE')
    rmse = models.FloatField('RMSE')
    mase = models.FloatField('MASE', null=True, blank=True)

    # 추가 정보
    sample_size = models.IntegerField('표본 크기')
    notes = models.TextField('비고', blank=True)

    # 시각
    created_at = models.DateTimeField('생성일', auto_now_add=True)

    class Meta:
        db_table = 'forecast_accuracy_log'
        verbose_name = '예측 정확도 로그'
        verbose_name_plural = '예측 정확도 로그'
        indexes = [
            models.Index(fields=['forecast_model', '-created_at']),
        ]

    def __str__(self):
        return f"Accuracy {self.forecast_model.name} - {self.evaluation_end}"
