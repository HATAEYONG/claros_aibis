"""
Business Process Admin Configuration
O2C, P2P 프로세스 관리자 설정
"""
from django.contrib import admin
from .models import (
    O2CStage, O2CIssue, O2COrder,
    P2PStage, P2PIssue, P2POrder,
    ProcessKPI
)


@admin.register(O2CStage)
class O2CStageAdmin(admin.ModelAdmin):
    list_display = ['stage_id', 'status', 'period_type', 'duration', 'volume', 'value']
    list_filter = ['status', 'period_type']
    search_fields = ['stage_id']
    ordering = ['period_type', 'order']


@admin.register(O2CIssue)
class O2CIssueAdmin(admin.ModelAdmin):
    list_display = ['issue_id', 'stage', 'issue_type', 'severity', 'resolved', 'created_at']
    list_filter = ['issue_type', 'severity', 'resolved', 'stage']
    search_fields = ['issue_id', 'description']
    ordering = ['-created_at']


@admin.register(O2COrder)
class O2COrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'customer', 'product', 'stage', 'status', 'amount', 'order_date']
    list_filter = ['stage', 'status', 'order_date']
    search_fields = ['order_id', 'customer', 'product']
    ordering = ['-order_date']
    date_hierarchy = 'order_date'


@admin.register(P2PStage)
class P2PStageAdmin(admin.ModelAdmin):
    list_display = ['stage_id', 'status', 'period_type', 'duration', 'volume', 'value']
    list_filter = ['status', 'period_type']
    search_fields = ['stage_id']
    ordering = ['period_type', 'order']


@admin.register(P2PIssue)
class P2PIssueAdmin(admin.ModelAdmin):
    list_display = ['issue_id', 'stage', 'issue_type', 'severity', 'resolved', 'created_at']
    list_filter = ['issue_type', 'severity', 'resolved', 'stage']
    search_fields = ['issue_id', 'description']
    ordering = ['-created_at']


@admin.register(P2POrder)
class P2POrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'supplier', 'material', 'stage', 'status', 'amount', 'order_date']
    list_filter = ['stage', 'status', 'order_date']
    search_fields = ['order_id', 'supplier', 'material']
    ordering = ['-order_date']
    date_hierarchy = 'order_date'


@admin.register(ProcessKPI)
class ProcessKPIAdmin(admin.ModelAdmin):
    list_display = ['process_type', 'stage_id', 'kpi_name', 'current_value', 'target_value', 'achievement_rate', 'trend']
    list_filter = ['process_type', 'trend', 'period_type']
    search_fields = ['kpi_name', 'kpi_code']
    ordering = ['process_type', 'stage_id', 'kpi_code']
    readonly_fields = ['achievement_rate']
