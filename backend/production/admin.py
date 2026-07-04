from django.contrib import admin
from .models import ProductionLine, WorkOrder, DailyProduction, Equipment


@admin.register(ProductionLine)
class ProductionLineAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'location', 'capacity', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code', 'location']


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'production_line', 'product_name', 'status', 'target_quantity', 'actual_quantity']
    list_filter = ['status', 'production_line']
    search_fields = ['order_number', 'product_name', 'product_code']
    ordering = ['-created_at']


@admin.register(DailyProduction)
class DailyProductionAdmin(admin.ModelAdmin):
    list_display = ['production_line', 'production_date', 'target_quantity', 'actual_quantity', 'efficiency']
    list_filter = ['production_line', 'production_date']
    ordering = ['-production_date']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'production_line', 'status', 'next_maintenance']
    list_filter = ['status', 'production_line']
    search_fields = ['name', 'code', 'manufacturer', 'model']