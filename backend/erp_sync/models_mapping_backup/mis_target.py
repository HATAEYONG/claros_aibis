"""
MIS 타겟 모델 관련 정의
MIS 시스템의 타겟 모델과 필드 정의
"""

from django.db import models


class ERPTargetModel(models.Model):
    """
    MIS 타겟 모델 정의
    Django 모델 정보를 관리하기 위한 메타 모델
    """
    MIS_MODEL_TYPE_CHOICES = [
        ('fact', '팩트 테이블'),
        ('dimension', '차원 테이블'),
        ('snapshot', '스냅샷 테이블'),
        ('aggregate', '집계 테이블'),
    ]

    target_model_id = models.AutoField(primary_key=True)
    model_name = models.CharField(
        'Django 모델명',
        max_length=100,
        unique=True,
        help_text='예: MonthlySales, WorkOrder 등'
    )
    model_label = models.CharField('모델 라벨', max_length=100)
    app_label = models.CharField(
        '앱 라벨',
        max_length=50,
        help_text='sales, production, quality 등'
    )
    model_type = models.CharField(
        '모델 타입',
        max_length=20,
        choices=MIS_MODEL_TYPE_CHOICES,
        default='fact'
    )

    # Table information
    db_table_name = models.CharField('DB 테이블명', max_length=100)

    description = models.TextField('설명', blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'erp_target_model'
        verbose_name = 'MIS 타겟 모델'
        verbose_name_plural = 'MIS 타겟 모델'
        ordering = ['app_label', 'model_name']

    def __str__(self):
        return f'{self.app_label}.{self.model_name}'


class ERPTargetField(models.Model):
    """
    MIS 타겟 필드 정의
    Django 모델의 필드 정보
    """
    DJANGO_FIELD_TYPES = [
        ('CharField', '문자열'),
        ('IntegerField', '정수'),
        ('DecimalField', '소수'),
        ('DateField', '날짜'),
        ('DateTimeField', '날짜시간'),
        ('BooleanField', '불리언'),
        ('TextField', '긴 텍스트'),
        ('JSONField', 'JSON'),
        ('ForeignKey', '외래키'),
        ('FloatField', '실수'),
    ]

    target_field_id = models.AutoField(primary_key=True)
    target_model = models.ForeignKey(
        ERPTargetModel,
        on_delete=models.CASCADE,
        related_name='target_fields',
        verbose_name='타겟 모델'
    )

    field_name = models.CharField('필드명', max_length=100)
    field_type = models.CharField('필드 타입', max_length=50, choices=DJANGO_FIELD_TYPES)
    field_label = models.CharField('필드 라벨', max_length=100, blank=True)

    is_required = models.BooleanField('필수 여부', default=False)
    is_unique = models.BooleanField('유니크 여부', default=False)
    max_length = models.IntegerField('최대 길이', null=True, blank=True)
    decimal_places = models.IntegerField('소수점 자리', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)

    class Meta:
        db_table = 'erp_target_field'
        verbose_name = 'MIS 타겟 필드'
        verbose_name_plural = 'MIS 타겟 필드'
        unique_together = ['target_model', 'field_name']
        ordering = ['target_model', 'field_name']

    def __str__(self):
        return f'{self.target_model.model_name}.{self.field_name}'
