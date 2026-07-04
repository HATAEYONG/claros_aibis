from django.contrib import admin
from .models import (
    MonthlySales, ProductSales, CustomerTier,
    SalesPipeline, SalesTeamPerformance, TopCustomer
)


@admin.register(MonthlySales)
class MonthlySalesAdmin(admin.ModelAdmin):
    list_display = ['fiscal_year', 'fiscal_month', 'target_amount', 'actual_amount', 'achievement_rate']
    list_filter = ['fiscal_year', 'fiscal_month']


@admin.register(ProductSales)
class ProductSalesAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'fiscal_year', 'fiscal_month', 'sales_amount', 'share_rate']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['product_name', 'product_code']


@admin.register(CustomerTier)
class CustomerTierAdmin(admin.ModelAdmin):
    list_display = ['tier', 'fiscal_year', 'fiscal_month', 'customer_count', 'sales_amount']
    list_filter = ['tier', 'fiscal_year', 'fiscal_month']


@admin.register(SalesPipeline)
class SalesPipelineAdmin(admin.ModelAdmin):
    list_display = ['stage', 'fiscal_year', 'fiscal_month', 'opportunity_count', 'total_value']
    list_filter = ['stage', 'fiscal_year', 'fiscal_month']


@admin.register(SalesTeamPerformance)
class SalesTeamPerformanceAdmin(admin.ModelAdmin):
    list_display = ['salesperson_name', 'fiscal_year', 'fiscal_month', 'target_amount', 'actual_amount']
    list_filter = ['fiscal_year', 'fiscal_month']
    search_fields = ['salesperson_name']


@admin.register(TopCustomer)
class TopCustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'fiscal_year', 'fiscal_month', 'revenue', 'status']
    list_filter = ['status', 'fiscal_year', 'fiscal_month']
    search_fields = ['customer_name', 'customer_code']
