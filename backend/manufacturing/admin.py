from django.contrib import admin
from .models import (
    WorkshopStatus, CycleTime, OEEMetric,
    ManpowerAllocation, WorkStandard, EquipmentDowntime
)


@admin.register(WorkshopStatus)
class WorkshopStatusAdmin(admin.ModelAdmin):
    list_display = ['workshop_id', 'workshop_name', 'status', 'current_product', 'operator_count', 'efficiency']
    list_filter = ['status']
    search_fields = ['workshop_id', 'workshop_name', 'current_product']


@admin.register(CycleTime)
class CycleTimeAdmin(admin.ModelAdmin):
    list_display = ['process_name', 'fiscal_year', 'fiscal_month', 'standard_time', 'actual_time', 'variance_rate']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['process_name']


@admin.register(OEEMetric)
class OEEMetricAdmin(admin.ModelAdmin):
    list_display = ['equipment_name', 'fiscal_year', 'fiscal_month', 'availability', 'performance', 'quality', 'oee']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['equipment_id', 'equipment_name']


@admin.register(ManpowerAllocation)
class ManpowerAllocationAdmin(admin.ModelAdmin):
    list_display = ['workshop', 'date', 'shift', 'allocated_workers', 'present_workers', 'attendance_rate']
    list_filter = ['date', 'shift', 'workshop']
    search_fields = ['workshop']


@admin.register(WorkStandard)
class WorkStandardAdmin(admin.ModelAdmin):
    list_display = ['standard_id', 'title', 'process', 'version', 'status', 'standard_time']
    list_filter = ['status', 'process']
    search_fields = ['standard_id', 'title', 'process']


@admin.register(EquipmentDowntime)
class EquipmentDowntimeAdmin(admin.ModelAdmin):
    list_display = ['equipment_name', 'reason', 'downtime_minutes', 'start_time', 'end_time']
    list_filter = ['reason']
    search_fields = ['equipment_id', 'equipment_name', 'description']
