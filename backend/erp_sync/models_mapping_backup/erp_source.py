"""
ERP 소스 관련 모델
ERP 시스템 소스, 테이블 정의, 필드 정의 모델 포함
"""

from django.db import models


class ERPSource(models.Model):
    """
    ERP 시스템 소스 정의
    다양한 ERP 시스템(YH, FOM, SAP 등)을 연결하기 위한 소스 정보
    """
    SOURCE_TYPE_CHOICES = [
        ('postgresql', 'PostgreSQL'),
        ('mssql', 'SQL Server'),
        ('mysql', 'MySQL'),
        ('oracle', 'Oracle'),
        ('api', 'REST API'),
        ('sqlite', 'SQLite'),
    ]

    erp_source_id = models.AutoField(primary_key=True)
    source_code = models.CharField('소스 코드', max_length=20, unique=True,
                                   help_text='YH, FOM, SAP 등 시스템 식별 코드')
    source_name = models.CharField('소스명', max_length=100)
    source_type = models.CharField('소스 타입', max_length=20,
                                   choices=SOURCE_TYPE_CHOICES)
    description = models.TextField('설명', blank=True)

    # Database connection settings
    host = models.CharField('호스트', max_length=255, blank=True)
    port = models.IntegerField('포트', null=True, blank=True)
    database_name = models.CharField('데이터베이스', max_length=100, blank=True)
    schema_name = models.CharField('스키마', max_length=100, blank=True)
    username = models.CharField('사용자명', max_length=100, blank=True)
    password = models.CharField('비밀번호', max_length=255, blank=True)

    # API settings for REST sources
    api_base_url = models.URLField('API Base URL', blank=True)
    api_key = models.CharField('API Key', max_length=255, blank=True)

    is_default = models.BooleanField('기본 소스', default=False)
    is_active = models.BooleanField('활성화', default=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'erp_source'
        verbose_name = 'ERP 소스'
        verbose_name_plural = 'ERP 소스'
        ordering = ['-is_default', 'source_code']

    def __str__(self):
        return f'{self.source_code} - {self.source_name}'

    def save(self, *args, **kwargs):
        # 기본 소스는 하나만 존재
        if self.is_default:
            ERPSource.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class ERPTableDefinition(models.Model):
    """
    ERP 테이블 정의
    소스별 테이블 메타데이터 정보
    """
    table_id = models.AutoField(primary_key=True)
    erp_source = models.ForeignKey(
        ERPSource,
        on_delete=models.CASCADE,
        related_name='table_definitions',
        verbose_name='ERP 소스'
    )

    # Source table information
    source_table_name = models.CharField('소스 테이블명', max_length=100)
    source_table_comment = models.CharField('테이블 설명', max_length=255, blank=True)

    # Module classification
    module_code = models.CharField('모듈 코드', max_length=50, db_index=True)
    module_name = models.CharField('모듈명', max_length=100, blank=True)

    # Metadata
    record_count = models.IntegerField('레코드 수', default=0, null=True, blank=True)
    last_synced_at = models.DateTimeField('마지막 동기화', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'erp_table_definition'
        verbose_name = 'ERP 테이블 정의'
        verbose_name_plural = 'ERP 테이블 정의'
        unique_together = ['erp_source', 'source_table_name']
        ordering = ['module_code', 'source_table_name']

    def __str__(self):
        return f'{self.erp_source.source_code}.{self.source_table_name}'


class ERPFieldDefinition(models.Model):
    """
    ERP 필드 정의
    테이블별 컬럼 메타데이터 정보
    """
    field_id = models.AutoField(primary_key=True)
    table_definition = models.ForeignKey(
        ERPTableDefinition,
        on_delete=models.CASCADE,
        related_name='field_definitions',
        verbose_name='테이블 정의'
    )

    # Source field information
    source_field_name = models.CharField('소스 필드명', max_length=100)
    source_field_type = models.CharField('소스 필드 타입', max_length=50)
    source_field_comment = models.CharField('필드 설명', max_length=255, blank=True)

    is_primary_key = models.BooleanField('기본키 여부', default=False)
    is_nullable = models.BooleanField('NULL 허용', default=True)
    is_foreign_key = models.BooleanField('외래키 여부', default=False)
    referenced_table = models.CharField('참조 테이블', max_length=100, blank=True)
    referenced_field = models.CharField('참조 필드', max_length=100, blank=True)

    field_position = models.IntegerField('필드 순서', default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)

    class Meta:
        db_table = 'erp_field_definition'
        verbose_name = 'ERP 필드 정의'
        verbose_name_plural = 'ERP 필드 정의'
        unique_together = ['table_definition', 'source_field_name']
        ordering = ['table_definition', 'field_position']

    def __str__(self):
        return f'{self.table_definition.source_table_name}.{self.source_field_name}'
