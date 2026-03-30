"""
ERP 매핑 관련 모델
테이블/필드 매핑 및 검증 모델 포함
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class ERPTableMapping(models.Model):
    """
    ERP 테이블 매핑
    소스 테이블 → 타겟 모델 매핑 정보
    """
    SYNC_PRIORITY_CHOICES = [
        (1, '필수 (실시간)'),
        (2, '중요 (시간별)'),
        (3, '일반 (일별)'),
        (4, '확장 (주별/월별)'),
    ]

    SYNC_TYPE_CHOICES = [
        ('full', '전체 동기화'),
        ('incremental', '증분 동기화'),
        ('cdc', '변경 데이터 캡처'),
    ]

    mapping_id = models.AutoField(primary_key=True)
    mapping_code = models.CharField(
        '매핑 코드',
        max_length=50,
        unique=True,
        help_text='예: SDY100_YH_TO_MONTHLY_SALES'
    )

    # Source and Target
    source_table = models.ForeignKey(
        'erp_sync.ERPTableDefinition',
        on_delete=models.CASCADE,
        related_name='table_mappings',
        verbose_name='소스 테이블'
    )
    target_model = models.ForeignKey(
        'erp_sync.ERPTargetModel',
        on_delete=models.CASCADE,
        related_name='table_mappings',
        verbose_name='타겟 모델'
    )

    # Mapping metadata
    mapping_name = models.CharField('매핑명', max_length=200)
    description = models.TextField('설명', blank=True)

    # Sync settings
    sync_priority = models.IntegerField(
        '동기화 우선순위',
        choices=SYNC_PRIORITY_CHOICES,
        default=2,
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )
    sync_type = models.CharField(
        '동기화 타입',
        max_length=20,
        choices=SYNC_TYPE_CHOICES,
        default='incremental'
    )
    is_active = models.BooleanField('활성화', default=True)

    # Incremental sync settings
    date_column = models.CharField(
        '날짜 컬럼',
        max_length=100,
        blank=True,
        help_text='증분 동기화 기준 컬럼'
    )

    # Custom query (optional)
    custom_query = models.TextField(
        '사용자 정의 쿼리',
        blank=True,
        help_text='복잡한 조인이 필요한 경우 사용'
    )

    # Tracking
    last_sync_at = models.DateTimeField('마지막 동기화', null=True, blank=True)
    last_sync_status = models.CharField('마지막 상태', max_length=20, blank=True)
    total_sync_count = models.IntegerField('총 동기화 수', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    created_by = models.CharField('생성자', max_length=100, blank=True)

    class Meta:
        db_table = 'erp_table_mapping'
        verbose_name = 'ERP 테이블 매핑'
        verbose_name_plural = 'ERP 테이블 매핑'
        ordering = ['sync_priority', 'mapping_code']

    def __str__(self):
        return f'{self.mapping_code}: {self.source_table.source_table_name} → {self.target_model.model_name}'


class ERPFieldMapping(models.Model):
    """
    ERP 필드 매핑
    소스 필드 → 타겟 필드 매핑 정보
    """
    TRANSFORM_RULES = [
        ('none', '변환 없음'),
        ('upper', '대문자 변환'),
        ('lower', '소문자 변환'),
        ('trim', '공백 제거'),
        ('date_format', '날짜 형식 변환'),
        ('decimal_cast', '소수형 변환'),
        ('concat', '문자열 결합'),
        ('lookup', '룩업 테이블 참조'),
        ('custom', '사용자 정의 함수'),
    ]

    ERROR_HANDLING_CHOICES = [
        ('skip', '건너뛰기'),
        ('log', '로그만 남김'),
        ('abort', '중단'),
    ]

    field_mapping_id = models.AutoField(primary_key=True)
    table_mapping = models.ForeignKey(
        ERPTableMapping,
        on_delete=models.CASCADE,
        related_name='field_mappings',
        verbose_name='테이블 매핑'
    )

    # Source and Target
    source_field = models.ForeignKey(
        'erp_sync.ERPFieldDefinition',
        on_delete=models.CASCADE,
        related_name='field_mappings',
        verbose_name='소스 필드'
    )
    target_field = models.ForeignKey(
        'erp_sync.ERPTargetField',
        on_delete=models.CASCADE,
        related_name='field_mappings',
        verbose_name='타겟 필드'
    )

    # Mapping options
    is_key_field = models.BooleanField('키 필드 여부', default=False)
    is_required = models.BooleanField('필수 매핑 여부', default=False)

    # Transformation
    transform_rule = models.CharField(
        '변환 규칙',
        max_length=20,
        choices=TRANSFORM_RULES,
        default='none'
    )
    transform_expression = models.TextField(
        '변환 표현식',
        blank=True,
        help_text='JSON format for complex rules'
    )
    default_value = models.CharField('기본값', max_length=255, blank=True)

    # Validation
    validation_rule = models.TextField('검증 규칙', blank=True)
    error_handling = models.CharField(
        '오류 처리',
        max_length=50,
        choices=ERROR_HANDLING_CHOICES,
        default='skip'
    )

    field_order = models.IntegerField('필드 순서', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)

    class Meta:
        db_table = 'erp_field_mapping'
        verbose_name = 'ERP 필드 매핑'
        verbose_name_plural = 'ERP 필드 매핑'
        unique_together = ['table_mapping', 'source_field']
        ordering = ['table_mapping', 'field_order']

    def __str__(self):
        return f'{self.source_field.source_field_name} → {self.target_field.field_name}'


class ERPMappingValidation(models.Model):
    """
    매핑 검증 기록
    매핑 구성의 유효성 검사 결과
    """
    VALIDATION_TYPES = [
        ('structure', '구조 검증'),
        ('data', '데이터 검증'),
        ('connection', '연결 검증'),
    ]

    STATUS_CHOICES = [
        ('passed', '통과'),
        ('failed', '실패'),
        ('warning', '경고'),
    ]

    validation_id = models.AutoField(primary_key=True)
    table_mapping = models.ForeignKey(
        ERPTableMapping,
        on_delete=models.CASCADE,
        related_name='validations',
        verbose_name='테이블 매핑'
    )

    validation_type = models.CharField(
        '검증 타입',
        max_length=50,
        choices=VALIDATION_TYPES
    )
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES)

    validation_details = models.JSONField('검증 상세', default=dict)
    error_message = models.TextField('오류 메시지', blank=True)

    validated_at = models.DateTimeField('검증일시', auto_now_add=True)

    class Meta:
        db_table = 'erp_mapping_validation'
        verbose_name = '매핑 검증'
        verbose_name_plural = '매핑 검증'
        ordering = ['-validated_at']

    def __str__(self):
        return f'{self.table_mapping.mapping_code} - {self.validation_type}: {self.status}'
