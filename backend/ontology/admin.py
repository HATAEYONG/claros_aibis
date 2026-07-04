from django.contrib import admin
from .models import (
    OntologyCategory,
    OntologyElement,
    ERPTableMapping,
    OntologyRelation,
    DataFlowMetrics,
    OntologyAnalysisLog
)


@admin.register(OntologyCategory)
class OntologyCategoryAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'level', 'sort_order', 'is_active', 'created_at']
    list_filter = ['level', 'is_active']
    search_fields = ['code', 'name', 'name_en']
    ordering = ['level', 'sort_order']


class ERPTableMappingInline(admin.TabularInline):
    model = ERPTableMapping
    extra = 1
    fields = ['table_name', 'table_description', 'module', 'data_flow_direction', 'is_active']


@admin.register(OntologyElement)
class OntologyElementAdmin(admin.ModelAdmin):
    list_display = ['code', 'name_ko', 'category', 'sort_order', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['code', 'name_ko', 'name_en']
    ordering = ['category', 'sort_order']
    inlines = [ERPTableMappingInline]


@admin.register(ERPTableMapping)
class ERPTableMappingAdmin(admin.ModelAdmin):
    list_display = ['table_name', 'element', 'module', 'data_flow_direction', 'is_active']
    list_filter = ['element__category', 'module', 'data_flow_direction', 'is_active']
    search_fields = ['table_name', 'table_description']
    ordering = ['element', 'table_name']


@admin.register(OntologyRelation)
class OntologyRelationAdmin(admin.ModelAdmin):
    list_display = ['source_element', 'target_element', 'relation_type', 'weight', 'is_active']
    list_filter = ['relation_type', 'is_active']
    search_fields = ['source_element__name_ko', 'target_element__name_ko']
    ordering = ['source_element', 'target_element']


@admin.register(DataFlowMetrics)
class DataFlowMetricsAdmin(admin.ModelAdmin):
    list_display = ['category', 'metric_name', 'metric_value', 'metric_unit', 'change_rate', 'status', 'metric_date']
    list_filter = ['category', 'status', 'metric_date']
    search_fields = ['metric_name']
    ordering = ['-metric_date', 'category']
    date_hierarchy = 'metric_date'


@admin.register(OntologyAnalysisLog)
class OntologyAnalysisLogAdmin(admin.ModelAdmin):
    list_display = ['analysis_type', 'start_category', 'end_category', 'analysis_date', 'status', 'execution_time_ms', 'created_at']
    list_filter = ['analysis_type', 'status', 'start_category', 'end_category']
    search_fields = ['analysis_type']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'completed_at']
