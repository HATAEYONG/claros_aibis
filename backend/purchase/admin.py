from django.contrib import admin
from .models import (
    MonthlyPurchase, Inventory, PurchaseOrder,
    Supplier, MaterialPrice, InventoryTurnover
)


@admin.register(MonthlyPurchase)
class MonthlyPurchaseAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'purchase_amount', 'order_count']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['item_code', 'item_name', 'category', 'current_stock', 'safety_stock', 'status']
    list_filter = ['category', 'status']
    search_fields = ['item_code', 'item_name']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier_name', 'item_name', 'total_amount', 'status', 'is_urgent']
    list_filter = ['status', 'is_urgent']
    search_fields = ['po_number', 'supplier_name', 'item_name']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['supplier_code', 'supplier_name', 'total_score', 'grade', 'trend']
    list_filter = ['grade', 'trend']
    search_fields = ['supplier_code', 'supplier_name']


@admin.register(MaterialPrice)
class MaterialPriceAdmin(admin.ModelAdmin):
    list_display = ['material_name', 'fiscal_year', 'fiscal_month', 'unit_price', 'change_rate']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['material_code', 'material_name']


@admin.register(InventoryTurnover)
class InventoryTurnoverAdmin(admin.ModelAdmin):
    list_display = ['category', 'fiscal_year', 'fiscal_month', 'turnover_rate', 'days_in_inventory']
    list_filter = ['category', 'fiscal_year', 'fiscal_month']
