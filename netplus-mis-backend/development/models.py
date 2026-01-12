from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class RDProject(models.Model):
    """R&D 프로젝트"""
    STATUS_CHOICES = [
        ('planning', '기획'),
        ('research', '연구'),
        ('development', '개발'),
        ('testing', '시험'),
        ('completed', '완료'),
        ('cancelled', '취소'),
    ]

    PRIORITY_CHOICES = [
        ('high', '높음'),
        ('medium', '보통'),
        ('low', '낮음'),
    ]

    project_id = models.CharField('프로젝트 ID', max_length=50, unique=True)
    title = models.CharField('프로젝트명', max_length=200)
    description = models.TextField('설명', blank=True)

    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='planning')
    priority = models.CharField('우선순위', max_length=10, choices=PRIORITY_CHOICES, default='medium')
    progress = models.DecimalField('진행률 (%)', max_digits=5, decimal_places=2, default=0)

    budget = models.DecimalField('예산 (억원)', max_digits=15, decimal_places=2, default=0)
    spent = models.DecimalField('사용액 (억원)', max_digits=15, decimal_places=2, default=0)

    team_lead = models.CharField('팀장', max_length=100)
    team_size = models.IntegerField('팀 인원', default=0)

    start_date = models.DateField('시작일')
    target_date = models.DateField('목표 완료일')
    actual_end_date = models.DateField('실제 완료일', null=True, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'development_rd_project'
        verbose_name = 'R&D 프로젝트'
        verbose_name_plural = 'R&D 프로젝트'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_id} - {self.title}"


class InnovationMetric(models.Model):
    """혁신 지표"""
    CATEGORY_CHOICES = [
        ('product', '제품혁신'),
        ('process', '공정혁신'),
        ('service', '서비스혁신'),
        ('business', '비즈니스혁신'),
    ]

    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])

    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES)
    metric_name = models.CharField('지표명', max_length=100)
    target_value = models.DecimalField('목표값', max_digits=15, decimal_places=2, default=0)
    actual_value = models.DecimalField('실적값', max_digits=15, decimal_places=2, default=0)
    achievement_rate = models.DecimalField('달성률 (%)', max_digits=5, decimal_places=2, default=0)
    unit = models.CharField('단위', max_length=50, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'development_innovation_metric'
        verbose_name = '혁신 지표'
        verbose_name_plural = '혁신 지표'
        ordering = ['-fiscal_year', '-fiscal_month', 'category']

    def __str__(self):
        return f"{self.metric_name} - {self.fiscal_year}년 {self.fiscal_month}월"


class Patent(models.Model):
    """특허/지식재산권"""
    STATUS_CHOICES = [
        ('filed', '출원'),
        ('pending', '심사중'),
        ('granted', '등록'),
        ('rejected', '거절'),
        ('expired', '만료'),
    ]

    TYPE_CHOICES = [
        ('patent', '특허'),
        ('utility', '실용신안'),
        ('design', '디자인'),
        ('trademark', '상표'),
    ]

    registration_number = models.CharField('등록번호', max_length=100, blank=True)
    application_number = models.CharField('출원번호', max_length=100, unique=True)
    title = models.CharField('명칭', max_length=300)
    ip_type = models.CharField('유형', max_length=20, choices=TYPE_CHOICES, default='patent')
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='filed')

    inventor = models.CharField('발명자', max_length=200)
    applicant = models.CharField('출원인', max_length=200)

    application_date = models.DateField('출원일')
    registration_date = models.DateField('등록일', null=True, blank=True)
    expiry_date = models.DateField('만료일', null=True, blank=True)

    related_project = models.CharField('관련 프로젝트', max_length=200, blank=True)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'development_patent'
        verbose_name = '특허/지식재산권'
        verbose_name_plural = '특허/지식재산권'
        ordering = ['-application_date']

    def __str__(self):
        return f"{self.application_number} - {self.title}"


class RDPersonnel(models.Model):
    """R&D 인력"""
    LEVEL_CHOICES = [
        ('junior', '주니어'),
        ('senior', '시니어'),
        ('lead', '리드'),
        ('manager', '매니저'),
        ('director', '디렉터'),
    ]

    employee_id = models.CharField('사번', max_length=50, unique=True)
    name = models.CharField('이름', max_length=100)
    department = models.CharField('부서', max_length=100)
    position = models.CharField('직위', max_length=100)
    level = models.CharField('등급', max_length=20, choices=LEVEL_CHOICES, default='junior')

    specialty = models.CharField('전문분야', max_length=200)
    years_of_experience = models.IntegerField('경력 연수', default=0)
    current_project = models.CharField('현재 프로젝트', max_length=200, blank=True)
    publications = models.IntegerField('논문 수', default=0)
    patents = models.IntegerField('특허 수', default=0)

    join_date = models.DateField('입사일')
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'development_rd_personnel'
        verbose_name = 'R&D 인력'
        verbose_name_plural = 'R&D 인력'
        ordering = ['department', 'name']

    def __str__(self):
        return f"{self.employee_id} - {self.name}"


class TechnologyRoadmap(models.Model):
    """기술 로드맵"""
    PHASE_CHOICES = [
        ('short-term', '단기 (1년 이내)'),
        ('mid-term', '중기 (1-3년)'),
        ('long-term', '장기 (3년 이상)'),
    ]

    STATUS_CHOICES = [
        ('planned', '계획'),
        ('in-progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
    ]

    technology_name = models.CharField('기술명', max_length=200)
    description = models.TextField('설명', blank=True)
    phase = models.CharField('단계', max_length=20, choices=PHASE_CHOICES, default='short-term')
    status = models.CharField('상태', max_length=20, choices=STATUS_CHOICES, default='planned')
    progress = models.DecimalField('진행률 (%)', max_digits=5, decimal_places=2, default=0)

    target_year = models.IntegerField('목표 연도')
    expected_impact = models.TextField('기대 효과', blank=True)
    required_investment = models.DecimalField('필요 투자액 (억원)', max_digits=15, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'development_technology_roadmap'
        verbose_name = '기술 로드맵'
        verbose_name_plural = '기술 로드맵'
        ordering = ['target_year', 'phase']

    def __str__(self):
        return f"{self.technology_name} ({self.target_year})"


class RDBudget(models.Model):
    """R&D 예산"""
    fiscal_year = models.IntegerField('회계연도')

    category = models.CharField('분류', max_length=100)
    allocated_budget = models.DecimalField('배정 예산 (억원)', max_digits=15, decimal_places=2, default=0)
    spent_budget = models.DecimalField('집행 예산 (억원)', max_digits=15, decimal_places=2, default=0)
    remaining_budget = models.DecimalField('잔여 예산 (억원)', max_digits=15, decimal_places=2, default=0)
    execution_rate = models.DecimalField('집행률 (%)', max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)

    class Meta:
        db_table = 'development_rd_budget'
        verbose_name = 'R&D 예산'
        verbose_name_plural = 'R&D 예산'
        ordering = ['-fiscal_year', 'category']
        unique_together = ['fiscal_year', 'category']

    def __str__(self):
        return f"{self.category} - {self.fiscal_year}년"
