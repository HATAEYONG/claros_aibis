from django.contrib import admin
from .models import (
    RDProject, InnovationMetric, Patent,
    RDPersonnel, TechnologyRoadmap, RDBudget
)


@admin.register(RDProject)
class RDProjectAdmin(admin.ModelAdmin):
    list_display = ['project_id', 'title', 'status', 'priority', 'progress', 'budget', 'team_lead']
    list_filter = ['status', 'priority']
    search_fields = ['project_id', 'title', 'team_lead']
    date_hierarchy = 'start_date'


@admin.register(InnovationMetric)
class InnovationMetricAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'category', 'fiscal_year', 'fiscal_month', 'target_value', 'actual_value', 'achievement_rate']
    list_filter = ['fiscal_year', 'fiscal_month', 'category']
    search_fields = ['metric_name']


@admin.register(Patent)
class PatentAdmin(admin.ModelAdmin):
    list_display = ['application_number', 'title', 'ip_type', 'status', 'inventor', 'application_date']
    list_filter = ['status', 'ip_type']
    search_fields = ['application_number', 'registration_number', 'title', 'inventor']
    date_hierarchy = 'application_date'


@admin.register(RDPersonnel)
class RDPersonnelAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'name', 'department', 'position', 'level', 'years_of_experience', 'publications', 'patents']
    list_filter = ['department', 'level']
    search_fields = ['employee_id', 'name', 'specialty']


@admin.register(TechnologyRoadmap)
class TechnologyRoadmapAdmin(admin.ModelAdmin):
    list_display = ['technology_name', 'phase', 'status', 'target_year', 'progress', 'required_investment']
    list_filter = ['phase', 'status', 'target_year']
    search_fields = ['technology_name', 'description']


@admin.register(RDBudget)
class RDBudgetAdmin(admin.ModelAdmin):
    list_display = ['category', 'fiscal_year', 'allocated_budget', 'spent_budget', 'remaining_budget', 'execution_rate']
    list_filter = ['fiscal_year']
    search_fields = ['category']
