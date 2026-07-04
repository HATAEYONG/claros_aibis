from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class ESGScore(models.Model):
    """ESG 종합 점수"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    environment_score = models.DecimalField('환경(E) 점수', max_digits=5, decimal_places=2, default=0)
    social_score = models.DecimalField('사회(S) 점수', max_digits=5, decimal_places=2, default=0)
    governance_score = models.DecimalField('지배구조(G) 점수', max_digits=5, decimal_places=2, default=0)
    total_score = models.DecimalField('종합 점수', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_score'
        verbose_name = 'ESG 점수'
        verbose_name_plural = 'ESG 점수'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"ESG 점수 - {self.fiscal_year}년 {self.fiscal_month}월"


class CarbonEmission(models.Model):
    """탄소 배출량"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    target_emission = models.DecimalField('목표 배출량 (톤)', max_digits=10, decimal_places=2, default=0)
    actual_emission = models.DecimalField('실제 배출량 (톤)', max_digits=10, decimal_places=2, default=0)
    reduction_rate = models.DecimalField('감축률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_carbon_emission'
        verbose_name = '탄소 배출량'
        verbose_name_plural = '탄소 배출량'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']

    def __str__(self):
        return f"탄소 배출량 - {self.fiscal_year}년 {self.fiscal_month}월"


class EnergyConsumption(models.Model):
    """에너지 소비"""
    SOURCE_CHOICES = [
        ('electricity', '전기'),
        ('gas', '가스'),
        ('oil', '유류'),
        ('steam', '증기'),
        ('solar', '태양광'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    energy_source = models.CharField('에너지원', max_length=20, choices=SOURCE_CHOICES)
    consumption = models.DecimalField('소비량 (MWh)', max_digits=10, decimal_places=2, default=0)
    cost = models.DecimalField('비용 (백만원)', max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_energy_consumption'
        verbose_name = '에너지 소비'
        verbose_name_plural = '에너지 소비'
        ordering = ['-fiscal_year', '-fiscal_month']

    def __str__(self):
        return f"{self.get_energy_source_display()} - {self.fiscal_year}년 {self.fiscal_month}월"


class FourM2EMetric(models.Model):
    """4M2E 지표"""
    CATEGORY_CHOICES = [
        ('man', 'Man (인력)'),
        ('machine', 'Machine (설비)'),
        ('material', 'Material (자재)'),
        ('method', 'Method (방법)'),
        ('environment', 'Environment (환경)'),
        ('energy', 'Energy (에너지)'),
    ]

    STATUS_CHOICES = [
        ('excellent', '우수'),
        ('good', '양호'),
        ('warning', '주의'),
        ('critical', '미흡'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)
    metric_name = models.CharField('지표명', max_length=100)
    target_value = models.DecimalField('목표값', max_digits=10, decimal_places=2, default=0)
    actual_value = models.DecimalField('실제값', max_digits=10, decimal_places=2, default=0)
    unit = models.CharField('단위', max_length=20, default='%')
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='good')

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_4m2e_metric'
        verbose_name = '4M2E 지표'
        verbose_name_plural = '4M2E 지표'
        ordering = ['-fiscal_year', '-fiscal_month', 'category']

    def __str__(self):
        return f"{self.get_category_display()} - {self.metric_name}"


class EnvironmentalProject(models.Model):
    """환경 개선 프로젝트"""
    CATEGORY_CHOICES = [
        ('energy', 'Energy'),
        ('environment', 'Environment'),
        ('material', 'Material'),
        ('waste', 'Waste'),
    ]

    STATUS_CHOICES = [
        ('planned', '계획'),
        ('in-progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
    ]

    project_id = models.CharField('프로젝트 ID', max_length=50, unique=True)
    title = models.CharField('프로젝트명', max_length=200)
    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)
    impact = models.CharField('예상 효과', max_length=200)

    investment = models.DecimalField('투자액 (억원)', max_digits=10, decimal_places=2, default=0)
    saving = models.DecimalField('절감액 (억원)', max_digits=10, decimal_places=2, default=0)
    progress = models.DecimalField('진척도 (%)', max_digits=5, decimal_places=2, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='planned')

    start_date = models.DateField('시작일', null=True, blank=True)
    end_date = models.DateField('종료일', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_environmental_project'
        verbose_name = '환경 개선 프로젝트'
        verbose_name_plural = '환경 개선 프로젝트'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_id} - {self.title}"


class SocialResponsibility(models.Model):
    """사회적 책임 활동"""
    fiscal_year = models.IntegerField('회계연도')

    activity_name = models.CharField('활동명', max_length=200)
    participants = models.IntegerField('참여 인원', default=0)
    hours = models.IntegerField('활동 시간', default=0)
    budget = models.DecimalField('예산 (백만원)', max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_social_responsibility'
        verbose_name = '사회적 책임 활동'
        verbose_name_plural = '사회적 책임 활동'
        ordering = ['-fiscal_year', '-budget']

    def __str__(self):
        return f"{self.activity_name} - {self.fiscal_year}년"


class GovernanceMetric(models.Model):
    """지배구조 지표"""
    STATUS_CHOICES = [
        ('excellent', '우수'),
        ('good', '양호'),
        ('warning', '주의'),
        ('critical', '미흡'),
    ]

    fiscal_year = models.IntegerField('회계연도')

    metric_name = models.CharField('지표명', max_length=100)
    actual_value = models.DecimalField('실제값 (%)', max_digits=5, decimal_places=2, default=0)
    benchmark = models.DecimalField('벤치마크 (%)', max_digits=5, decimal_places=2, default=0)
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='good')

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'esg_governance_metric'
        verbose_name = '지배구조 지표'
        verbose_name_plural = '지배구조 지표'
        ordering = ['-fiscal_year']

    def __str__(self):
        return f"{self.metric_name} - {self.fiscal_year}년"
