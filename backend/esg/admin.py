from django.contrib import admin
from .models import (
    ESGScore, CarbonEmission, EnergyConsumption,
    FourM2EMetric, EnvironmentalProject, SocialResponsibility, GovernanceMetric
)


@admin.register(ESGScore)
class ESGScoreAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'environment_score', 'social_score',
                    'governance_score', 'total_score']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(CarbonEmission)
class CarbonEmissionAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'target_emission', 'actual_emission', 'reduction_rate']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(EnergyConsumption)
class EnergyConsumptionAdmin(admin.ModelAdmin):
    list_display = ['energy_source', 'fiscal_year', 'fiscal_month', 'consumption', 'cost']
    list_filter = ['energy_source', 'fiscal_year', 'fiscal_month']


@admin.register(FourM2EMetric)
class FourM2EMetricAdmin(admin.ModelAdmin):
    list_display = ['category', 'metric_name', 'fiscal_year', 'fiscal_month',
                    'target_value', 'actual_value', 'status']
    list_filter = ['category', 'status', 'fiscal_year', 'fiscal_month']
    search_fields = ['metric_name']


@admin.register(EnvironmentalProject)
class EnvironmentalProjectAdmin(admin.ModelAdmin):
    list_display = ['project_id', 'title', 'category', 'investment', 'saving', 'progress', 'status']
    list_filter = ['category', 'status']
    search_fields = ['project_id', 'title']


@admin.register(SocialResponsibility)
class SocialResponsibilityAdmin(admin.ModelAdmin):
    list_display = ['activity_name', 'fiscal_year', 'participants', 'hours', 'budget']
    list_filter = ['fiscal_year']
    search_fields = ['activity_name']


@admin.register(GovernanceMetric)
class GovernanceMetricAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'fiscal_year', 'actual_value', 'benchmark', 'status']
    list_filter = ['fiscal_year', 'status']
    search_fields = ['metric_name']
