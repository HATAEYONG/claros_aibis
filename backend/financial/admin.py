from django.contrib import admin
from .models import FinancialStatement, FinancialRatio


@admin.register(FinancialStatement)
class FinancialStatementAdmin(admin.ModelAdmin):
    list_display = ['statement_type', 'fiscal_year', 'fiscal_month', 'revenue', 'net_income', 'total_assets']
    list_filter = ['statement_type', 'fiscal_year']
    search_fields = ['fiscal_year', 'fiscal_month']
    ordering = ['-fiscal_year', '-fiscal_month']


@admin.register(FinancialRatio)
class FinancialRatioAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'roe', 'roa', 'debt_ratio', 'current_ratio']
    list_filter = ['fiscal_year']
    ordering = ['-fiscal_year', '-fiscal_month']