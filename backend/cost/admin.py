from django.contrib import admin
from .models import (
    MonthlyCost, ProductCost, CostReductionProject,
    CostDriver, BreakEvenAnalysis, CostStructure
)


@admin.register(MonthlyCost)
class MonthlyCostAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'total_cost', 'unit_cost']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(ProductCost)
class ProductCostAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'fiscal_year', 'fiscal_month', 'total_cost',
                    'selling_price', 'margin_rate']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['product_code', 'product_name']


@admin.register(CostReductionProject)
class CostReductionProjectAdmin(admin.ModelAdmin):
    list_display = ['project_id', 'title', 'category', 'target_saving', 'actual_saving',
                    'progress', 'status']
    list_filter = ['category', 'status']
    search_fields = ['project_id', 'title', 'responsible_person']


@admin.register(CostDriver)
class CostDriverAdmin(admin.ModelAdmin):
    list_display = ['driver_name', 'fiscal_year', 'fiscal_month', 'impact_rate',
                    'change_rate', 'trend']
    list_filter = ['trend', 'fiscal_year', 'fiscal_month']
    search_fields = ['driver_name']


@admin.register(BreakEvenAnalysis)
class BreakEvenAnalysisAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'fixed_cost', 'break_even_point',
                    'actual_sales', 'margin_of_safety']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(CostStructure)
class CostStructureAdmin(admin.ModelAdmin):
    list_display = ['cost_type', 'fiscal_year', 'fiscal_month', 'amount', 'ratio']
    list_filter = ['cost_type', 'fiscal_year', 'fiscal_month']
