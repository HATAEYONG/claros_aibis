from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class FinancialStatement(models.Model):
    """재무제표"""
    STATEMENT_TYPE_CHOICES = [
        ('income', '손익계산서'),
        ('balance', '재무상태표'),
        ('cashflow', '현금흐름표'),
    ]
    
    statement_type = models.CharField('재무제표 유형', max_length=20, choices=STATEMENT_TYPE_CHOICES)
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])
    
    # 손익계산서 항목
    revenue = models.DecimalField('매출액', max_digits=15, decimal_places=2, default=0)
    cost_of_sales = models.DecimalField('매출원가', max_digits=15, decimal_places=2, default=0)
    gross_profit = models.DecimalField('매출총이익', max_digits=15, decimal_places=2, default=0)
    operating_expenses = models.DecimalField('판매관리비', max_digits=15, decimal_places=2, default=0)
    operating_income = models.DecimalField('영업이익', max_digits=15, decimal_places=2, default=0)
    net_income = models.DecimalField('당기순이익', max_digits=15, decimal_places=2, default=0)
    
    # 재무상태표 항목
    total_assets = models.DecimalField('총자산', max_digits=15, decimal_places=2, default=0)
    current_assets = models.DecimalField('유동자산', max_digits=15, decimal_places=2, default=0)
    non_current_assets = models.DecimalField('비유동자산', max_digits=15, decimal_places=2, default=0)
    total_liabilities = models.DecimalField('총부채', max_digits=15, decimal_places=2, default=0)
    total_equity = models.DecimalField('총자본', max_digits=15, decimal_places=2, default=0)
    
    # 현금흐름표 항목
    operating_cashflow = models.DecimalField('영업활동 현금흐름', max_digits=15, decimal_places=2, default=0)
    investing_cashflow = models.DecimalField('투자활동 현금흐름', max_digits=15, decimal_places=2, default=0)
    financing_cashflow = models.DecimalField('재무활동 현금흐름', max_digits=15, decimal_places=2, default=0)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'financial_statements'
        verbose_name = '재무제표'
        verbose_name_plural = '재무제표'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['statement_type', 'fiscal_year', 'fiscal_month']
    
    def __str__(self):
        return f"{self.get_statement_type_display()} - {self.fiscal_year}년 {self.fiscal_month}월"


class FinancialRatio(models.Model):
    """재무비율"""
    fiscal_year = models.IntegerField('회계연도')
    fiscal_month = models.IntegerField('회계월', validators=[MinValueValidator(1), MaxValueValidator(12)])
    
    # 수익성 지표
    roe = models.DecimalField('ROE (%)', max_digits=5, decimal_places=2, default=0, help_text='자기자본이익률')
    roa = models.DecimalField('ROA (%)', max_digits=5, decimal_places=2, default=0, help_text='총자산이익률')
    operating_margin = models.DecimalField('영업이익률 (%)', max_digits=5, decimal_places=2, default=0)
    net_margin = models.DecimalField('순이익률 (%)', max_digits=5, decimal_places=2, default=0)
    
    # 안정성 지표
    debt_ratio = models.DecimalField('부채비율 (%)', max_digits=5, decimal_places=2, default=0)
    current_ratio = models.DecimalField('유동비율 (%)', max_digits=5, decimal_places=2, default=0)
    quick_ratio = models.DecimalField('당좌비율 (%)', max_digits=5, decimal_places=2, default=0)
    
    # 활동성 지표
    asset_turnover = models.DecimalField('총자산회전율', max_digits=5, decimal_places=2, default=0)
    inventory_turnover = models.DecimalField('재고자산회전율', max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField('생성일시', auto_now_add=True)
    updated_at = models.DateTimeField('수정일시', auto_now=True)
    
    class Meta:
        db_table = 'financial_ratios'
        verbose_name = '재무비율'
        verbose_name_plural = '재무비율'
        ordering = ['-fiscal_year', '-fiscal_month']
        unique_together = ['fiscal_year', 'fiscal_month']
    
    def __str__(self):
        return f"재무비율 - {self.fiscal_year}년 {self.fiscal_month}월"