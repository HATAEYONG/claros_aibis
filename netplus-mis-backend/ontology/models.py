from django.db import models
from django.utils import timezone


class OntologyCategory(models.Model):
    """온톨로지 카테고리 (6M, 4M2E, 원가, 재무, ESG)"""
    CATEGORY_CHOICES = [
        ('6M', '6M 변경관리'),
        ('4M2E', '4M2E 제조관리'),
        ('COST', '원가관리'),
        ('FINANCE', '재무관리'),
        ('ESG', 'ESG 경영'),
    ]

    code = models.CharField('카테고리 코드', max_length=10, primary_key=True)
    name = models.CharField('카테고리명', max_length=50)
    name_en = models.CharField('영문명', max_length=50, blank=True)
    description = models.TextField('설명', blank=True)
    level = models.IntegerField('계층 레벨', default=1)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
        verbose_name='상위 카테고리'
    )
    sort_order = models.IntegerField('정렬순서', default=0)
    is_active = models.BooleanField('활성여부', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'ontology_category'
        verbose_name = '온톨로지 카테고리'
        verbose_name_plural = '온톨로지 카테고리'
        ordering = ['level', 'sort_order']

    def __str__(self):
        return f"{self.code} - {self.name}"


class OntologyElement(models.Model):
    """온톨로지 요소 (Man, Machine, Material 등)"""
    category = models.ForeignKey(
        OntologyCategory,
        on_delete=models.CASCADE,
        related_name='elements',
        verbose_name='카테고리'
    )
    code = models.CharField('요소 코드', max_length=20)
    name_ko = models.CharField('한글명', max_length=100)
    name_en = models.CharField('영문명', max_length=100)
    description = models.TextField('설명', blank=True)
    icon = models.CharField('아이콘', max_length=50, blank=True)
    color = models.CharField('색상코드', max_length=20, default='#3B82F6')
    sort_order = models.IntegerField('정렬순서', default=0)
    is_active = models.BooleanField('활성여부', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'ontology_element'
        unique_together = ['category', 'code']
        verbose_name = '온톨로지 요소'
        verbose_name_plural = '온톨로지 요소'
        ordering = ['category', 'sort_order']

    def __str__(self):
        return f"{self.category.code}/{self.code} - {self.name_ko}"


class ERPTableMapping(models.Model):
    """ERP 테이블 맵핑"""
    element = models.ForeignKey(
        OntologyElement,
        on_delete=models.CASCADE,
        related_name='erp_tables',
        verbose_name='온톨로지 요소'
    )
    table_name = models.CharField('ERP 테이블명', max_length=50)
    table_description = models.CharField('테이블 설명', max_length=200)
    module = models.CharField('모듈구분', max_length=50, blank=True)
    key_columns = models.JSONField('주요 컬럼', default=list)
    link_columns = models.JSONField('연계 컬럼', default=list)
    data_flow_direction = models.CharField(
        '데이터 흐름',
        max_length=10,
        choices=[('IN', '입력'), ('OUT', '출력'), ('BOTH', '양방향')],
        default='IN'
    )
    is_active = models.BooleanField('활성여부', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'ontology_erp_mapping'
        verbose_name = 'ERP 테이블 맵핑'
        verbose_name_plural = 'ERP 테이블 맵핑'
        ordering = ['element', 'table_name']

    def __str__(self):
        return f"{self.element.code} - {self.table_name}"


class OntologyRelation(models.Model):
    """온톨로지 요소 간 관계"""
    RELATION_TYPES = [
        ('TRANSFORM', '변환'),
        ('AGGREGATE', '집계'),
        ('ALLOCATE', '배부'),
        ('REFERENCE', '참조'),
        ('CALCULATE', '계산'),
        ('FLOW', '흐름'),
    ]

    source_element = models.ForeignKey(
        OntologyElement,
        related_name='source_relations',
        on_delete=models.CASCADE,
        verbose_name='소스 요소'
    )
    target_element = models.ForeignKey(
        OntologyElement,
        related_name='target_relations',
        on_delete=models.CASCADE,
        verbose_name='타겟 요소'
    )
    relation_type = models.CharField('관계 유형', max_length=20, choices=RELATION_TYPES)
    link_key = models.CharField('연계 키', max_length=100, blank=True)
    description = models.TextField('설명', blank=True)
    weight = models.DecimalField('가중치', max_digits=5, decimal_places=2, default=1.0)
    is_active = models.BooleanField('활성여부', default=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)

    class Meta:
        db_table = 'ontology_relation'
        verbose_name = '온톨로지 관계'
        verbose_name_plural = '온톨로지 관계'
        unique_together = ['source_element', 'target_element', 'relation_type']

    def __str__(self):
        return f"{self.source_element.code} → {self.target_element.code} ({self.get_relation_type_display()})"


class DataFlowMetrics(models.Model):
    """데이터 흐름 지표"""
    category = models.ForeignKey(
        OntologyCategory,
        on_delete=models.CASCADE,
        related_name='metrics',
        verbose_name='카테고리'
    )
    metric_date = models.DateField('기준일자')
    metric_name = models.CharField('지표명', max_length=100)
    metric_value = models.DecimalField('지표값', max_digits=18, decimal_places=2, default=0)
    metric_unit = models.CharField('단위', max_length=20, blank=True)
    previous_value = models.DecimalField('이전값', max_digits=18, decimal_places=2, null=True, blank=True)
    change_rate = models.DecimalField('변화율(%)', max_digits=8, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        '상태',
        max_length=10,
        choices=[('UP', '상승'), ('DOWN', '하락'), ('STABLE', '유지')],
        default='STABLE'
    )
    created_at = models.DateTimeField('생성일시', auto_now_add=True)

    class Meta:
        db_table = 'ontology_data_flow_metrics'
        verbose_name = '데이터 흐름 지표'
        verbose_name_plural = '데이터 흐름 지표'
        ordering = ['-metric_date', 'category']

    def __str__(self):
        return f"{self.category.code} - {self.metric_name}: {self.metric_value}"


class OntologyAnalysisLog(models.Model):
    """온톨로지 분석 로그"""
    analysis_type = models.CharField('분석 유형', max_length=50)
    start_category = models.CharField('시작 카테고리', max_length=10)
    end_category = models.CharField('종료 카테고리', max_length=10)
    analysis_date = models.DateField('분석 기준일')
    parameters = models.JSONField('분석 파라미터', default=dict)
    result_summary = models.JSONField('분석 결과 요약', default=dict)
    record_count = models.IntegerField('처리 건수', default=0)
    execution_time_ms = models.IntegerField('실행시간(ms)', default=0)
    status = models.CharField(
        '상태',
        max_length=20,
        choices=[
            ('PENDING', '대기'),
            ('RUNNING', '실행중'),
            ('COMPLETED', '완료'),
            ('FAILED', '실패')
        ],
        default='PENDING'
    )
    error_message = models.TextField('에러 메시지', blank=True)
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    completed_at = models.DateTimeField('완료일시', null=True, blank=True)

    class Meta:
        db_table = 'ontology_analysis_log'
        verbose_name = '온톨로지 분석 로그'
        verbose_name_plural = '온톨로지 분석 로그'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.analysis_type} ({self.start_category}→{self.end_category})"
