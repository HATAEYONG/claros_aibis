from django.contrib import admin
from .models import (
    QualityInspection,
    DefectType,
    DefectRecord,
    CustomerComplaint,
    ProcessCapability,
)


@admin.register(QualityInspection)
class QualityInspectionAdmin(admin.ModelAdmin):
    list_display = ['inspection_number', 'inspection_type', 'product_name', 'inspection_date', 'result']
    list_filter = ['inspection_type', 'result', 'inspection_date']
    search_fields = ['inspection_number', 'product_name', 'product_code', 'lot_number']
    ordering = ['-inspection_date']


@admin.register(DefectType)
class DefectTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'severity']
    list_filter = ['severity']
    search_fields = ['name', 'code']


@admin.register(DefectRecord)
class DefectRecordAdmin(admin.ModelAdmin):
    list_display = ['inspection', 'defect_type', 'quantity', 'location']
    list_filter = ['defect_type']
    ordering = ['-created_at']


@admin.register(CustomerComplaint)
class CustomerComplaintAdmin(admin.ModelAdmin):
    list_display = ['complaint_number', 'customer_name', 'product_name', 'severity', 'status', 'complaint_date']
    list_filter = ['severity', 'status', 'complaint_date']
    search_fields = ['complaint_number', 'customer_name', 'product_name']
    ordering = ['-complaint_date']


@admin.register(ProcessCapability)
class ProcessCapabilityAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'process_name', 'measurement_date', 'cpk', 'ppk']
    list_filter = ['measurement_date']
    search_fields = ['product_name', 'product_code', 'process_name']
    ordering = ['-measurement_date']