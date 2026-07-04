"""
Business Process Models
O2C (Order to Cash), P2P (Procure to Pay) 프로세스 관리 모델
"""
from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class O2CStage(models.Model):
    """O2C 프로세스 스테이지 모델"""
    STAGE_CHOICES = [
        ('order_entry', '주문 접수'),
        ('production', '생산'),
        ('delivery', '배송'),
        ('billing', '청구'),
        ('payment', '입금'),
    ]

    STATUS_CHOICES = [
        ('pending', '대기'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
    ]

    period_type = models.CharField(max_length=20, default='monthly')
    stage_id = models.CharField(max_length=50, choices=STAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    order = models.IntegerField()
    duration = models.IntegerField(help_text='소요 시간 (시간)')
    estimated_duration = models.IntegerField(help_text='예상 시간 (시간)')
    volume = models.IntegerField(help_text='처리 건수')
    value = models.BigIntegerField(help_text='처리 금액 (원)')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'O2C 스테이지'
        verbose_name_plural = 'O2C 스테이지'
        ordering = ['period_type', 'order']
        unique_together = ['period_type', 'stage_id']

    def __str__(self):
        return f"{self.get_stage_id_display()} - {self.period_type}"


class O2CIssue(models.Model):
    """O2C 이슈 모델"""
    ISSUE_TYPE_CHOICES = [
        ('delay', '지연'),
        ('quality', '품질'),
        ('cost', '비용'),
        ('capacity', '용량'),
    ]

    SEVERITY_CHOICES = [
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
    ]

    stage = models.ForeignKey(O2CStage, on_delete=models.CASCADE, related_name='issues')
    issue_id = models.CharField(max_length=50, unique=True)
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    description = models.TextField()
    affected_orders = models.IntegerField(default=0)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'O2C 이슈'
        verbose_name_plural = 'O2C 이슈'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.issue_id} - {self.description}"


class O2COrder(models.Model):
    """O2C 주문 모델"""
    STAGE_CHOICES = [
        ('order_entry', '주문 접수'),
        ('production', '생산'),
        ('delivery', '배송'),
        ('billing', '청구'),
        ('payment', '입금'),
    ]

    STATUS_CHOICES = [
        ('pending', '대기'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
        ('cancelled', '취소'),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    customer = models.CharField(max_length=200)
    product = models.CharField(max_length=200)
    quantity = models.IntegerField()
    amount = models.BigIntegerField(help_text='주문 금액 (원)')
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    order_date = models.DateField()
    promised_date = models.DateField()
    actual_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'O2C 주문'
        verbose_name_plural = 'O2C 주문'
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.order_id} - {self.customer}"


class P2PStage(models.Model):
    """P2P 프로세스 스테이지 모델"""
    STAGE_CHOICES = [
        ('requisition', '구매 요청'),
        ('quotation', '견적'),
        ('po_creation', '발주'),
        ('receiving', '입고'),
        ('invoice', '송장'),
        ('payment', '지급'),
    ]

    STATUS_CHOICES = [
        ('pending', '대기'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
    ]

    period_type = models.CharField(max_length=20, default='monthly')
    stage_id = models.CharField(max_length=50, choices=STAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    order = models.IntegerField()
    duration = models.IntegerField(help_text='소요 시간 (시간)')
    estimated_duration = models.IntegerField(help_text='예상 시간 (시간)')
    volume = models.IntegerField(help_text='처리 건수')
    value = models.BigIntegerField(help_text='처리 금액 (원)')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'P2P 스테이지'
        verbose_name_plural = 'P2P 스테이지'
        ordering = ['period_type', 'order']
        unique_together = ['period_type', 'stage_id']

    def __str__(self):
        return f"{self.get_stage_id_display()} - {self.period_type}"


class P2PIssue(models.Model):
    """P2P 이슈 모델"""
    ISSUE_TYPE_CHOICES = [
        ('delay', '지연'),
        ('quality', '품질'),
        ('cost', '비용'),
        ('supplier', '공급업체'),
    ]

    SEVERITY_CHOICES = [
        ('low', '낮음'),
        ('medium', '중간'),
        ('high', '높음'),
    ]

    stage = models.ForeignKey(P2PStage, on_delete=models.CASCADE, related_name='issues')
    issue_id = models.CharField(max_length=50, unique=True)
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    description = models.TextField()
    affected_orders = models.IntegerField(default=0)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'P2P 이슈'
        verbose_name_plural = 'P2P 이슈'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.issue_id} - {self.description}"


class P2POrder(models.Model):
    """P2P 발주 모델"""
    STAGE_CHOICES = [
        ('requisition', '구매 요청'),
        ('quotation', '견적'),
        ('po_creation', '발주'),
        ('receiving', '입고'),
        ('invoice', '송장'),
        ('payment', '지급'),
    ]

    STATUS_CHOICES = [
        ('pending', '대기'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('delayed', '지연'),
        ('cancelled', '취소'),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    supplier = models.CharField(max_length=200)
    material = models.CharField(max_length=200)
    quantity = models.IntegerField()
    amount = models.BigIntegerField(help_text='발주 금액 (원)')
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    order_date = models.DateField()
    promised_date = models.DateField()
    actual_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'P2P 발주'
        verbose_name_plural = 'P2P 발주'
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.order_id} - {self.supplier}"


class ProcessKPI(models.Model):
    """프로세스 KPI 모델"""
    PROCESS_TYPE_CHOICES = [
        ('o2c', 'O2C'),
        ('p2p', 'P2P'),
    ]

    process_type = models.CharField(max_length=10, choices=PROCESS_TYPE_CHOICES)
    stage_id = models.CharField(max_length=50)
    kpi_name = models.CharField(max_length=100)
    kpi_code = models.CharField(max_length=50)

    current_value = models.FloatField()
    target_value = models.FloatField()
    unit = models.CharField(max_length=20)
    trend = models.CharField(max_length=10, choices=[('up', '상승'), ('down', '하락'), ('stable', '안정')])

    period_type = models.CharField(max_length=20, default='monthly')
    period_value = models.CharField(max_length=20)  # e.g., '2024-12'

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '프로세스 KPI'
        verbose_name_plural = '프로세스 KPI'
        ordering = ['process_type', 'stage_id', 'kpi_code']
        unique_together = ['process_type', 'stage_id', 'kpi_code', 'period_value']

    def __str__(self):
        return f"{self.process_type.upper()} - {self.kpi_name}"

    @property
    def achievement_rate(self):
        """달성률 계산"""
        if self.target_value == 0:
            return 0
        return (self.current_value / self.target_value) * 100
