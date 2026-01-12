from django.contrib import admin
from .models import (
    ExecutiveSummary, DepartmentComparison, KeyMetricSummary,
    RiskOpportunity, Recommendation, MonthlyReport
)


@admin.register(ExecutiveSummary)
class ExecutiveSummaryAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'revenue', 'operating_profit', 'operating_margin', 'net_profit']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(DepartmentComparison)
class DepartmentComparisonAdmin(admin.ModelAdmin):
    list_display = ['department', 'fiscal_year', 'fiscal_month', 'revenue', 'profit', 'target_achievement']
    list_filter = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['department']


@admin.register(KeyMetricSummary)
class KeyMetricSummaryAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'category', 'fiscal_year', 'fiscal_month', 'current_value', 'target_value', 'trend', 'status']
    list_filter = ['fiscal_year', 'fiscal_month', 'category', 'status', 'trend']
    search_fields = ['metric_name', 'category']


@admin.register(RiskOpportunity)
class RiskOpportunityAdmin(admin.ModelAdmin):
    list_display = ['title', 'item_type', 'category', 'priority', 'status', 'impact', 'owner']
    list_filter = ['item_type', 'priority', 'status', 'category']
    search_fields = ['title', 'description', 'owner']


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'priority', 'status', 'expected_benefit', 'roi_estimate', 'proposed_by']
    list_filter = ['category', 'priority', 'status']
    search_fields = ['title', 'description', 'proposed_by']


@admin.register(MonthlyReport)
class MonthlyReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'fiscal_year', 'fiscal_month', 'status', 'author', 'created_at']
    list_filter = ['fiscal_year', 'fiscal_month', 'status']
    search_fields = ['title', 'summary', 'author']
