from django.contrib import admin
from .models import (
    HourlyProduction, LineUtilization, WorkerProductivity,
    OEEComponent, ProductionEfficiency, DailyProductionSummary
)


@admin.register(HourlyProduction)
class HourlyProductionAdmin(admin.ModelAdmin):
    list_display = ['line_name', 'production_date', 'hour', 'target_output', 'actual_output', 'achievement_rate']
    list_filter = ['production_date', 'line_id']
    search_fields = ['line_id', 'line_name']


@admin.register(LineUtilization)
class LineUtilizationAdmin(admin.ModelAdmin):
    list_display = ['line_name', 'fiscal_year', 'fiscal_month', 'planned_time', 'actual_time', 'utilization_rate']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['line_id', 'line_name']


@admin.register(WorkerProductivity)
class WorkerProductivityAdmin(admin.ModelAdmin):
    list_display = ['worker_name', 'department', 'fiscal_year', 'fiscal_month', 'productivity', 'achievement_rate']
    list_filter = ['fiscal_year', 'fiscal_month', 'department']
    search_fields = ['worker_id', 'worker_name', 'department']


@admin.register(OEEComponent)
class OEEComponentAdmin(admin.ModelAdmin):
    list_display = ['line_name', 'fiscal_year', 'fiscal_month', 'availability', 'performance', 'quality_rate', 'oee']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['line_id', 'line_name']


@admin.register(ProductionEfficiency)
class ProductionEfficiencyAdmin(admin.ModelAdmin):
    list_display = ['category', 'fiscal_year', 'fiscal_month', 'target_value', 'actual_value', 'efficiency']
    list_filter = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['category']


@admin.register(DailyProductionSummary)
class DailyProductionSummaryAdmin(admin.ModelAdmin):
    list_display = ['production_date', 'total_target', 'total_actual', 'overall_efficiency', 'defect_rate']
    list_filter = ['production_date']
