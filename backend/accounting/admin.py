from django.contrib import admin
from .models import (
    BudgetActual, DepartmentProfitability, KPIPerformance,
    FinancialRatioAnalysis, BudgetAllocation, InvestmentROI
)


@admin.register(BudgetActual)
class BudgetActualAdmin(admin.ModelAdmin):
    list_display = ['category', 'fiscal_year', 'fiscal_month', 'budget', 'actual', 'variance', 'variance_rate']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['category']


@admin.register(DepartmentProfitability)
class DepartmentProfitabilityAdmin(admin.ModelAdmin):
    list_display = ['department', 'fiscal_year', 'fiscal_month', 'revenue', 'cost', 'profit', 'margin']
    list_filter = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['department']


@admin.register(KPIPerformance)
class KPIPerformanceAdmin(admin.ModelAdmin):
    list_display = ['kpi_name', 'fiscal_year', 'fiscal_month', 'target', 'actual', 'achievement_rate', 'status']
    list_filter = ['fiscal_year', 'fiscal_month', 'status']
    search_fields = ['kpi_name']


@admin.register(FinancialRatioAnalysis)
class FinancialRatioAnalysisAdmin(admin.ModelAdmin):
    list_display = ['ratio_name', 'category', 'fiscal_year', 'fiscal_month', 'value', 'industry_avg', 'target']
    list_filter = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['ratio_name']


@admin.register(BudgetAllocation)
class BudgetAllocationAdmin(admin.ModelAdmin):
    list_display = ['department', 'fiscal_year', 'allocated_budget', 'used_budget', 'remaining_budget', 'usage_rate']
    list_filter = ['fiscal_year']
    search_fields = ['department']


@admin.register(InvestmentROI)
class InvestmentROIAdmin(admin.ModelAdmin):
    list_display = ['project_name', 'investment_amount', 'expected_return', 'actual_return', 'roi', 'status']
    list_filter = ['status']
    search_fields = ['project_name']
