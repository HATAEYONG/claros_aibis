from rest_framework import serializers
from .models import (
    MonthlySales, ProductSales, CustomerTier,
    SalesPipeline, SalesTeamPerformance, TopCustomer
)


class MonthlySalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlySales
        fields = '__all__'


class MonthlySalesListSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlySales
        fields = ['id', 'fiscal_year', 'fiscal_month', 'target_amount',
                  'actual_amount', 'achievement_rate']


class ProductSalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSales
        fields = '__all__'


class ProductSalesListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSales
        fields = ['id', 'product_code', 'product_name', 'sales_amount', 'share_rate']


class CustomerTierSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)

    class Meta:
        model = CustomerTier
        fields = '__all__'


class SalesPipelineSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = SalesPipeline
        fields = '__all__'


class SalesTeamPerformanceSerializer(serializers.ModelSerializer):
    achievement_rate = serializers.SerializerMethodField()

    class Meta:
        model = SalesTeamPerformance
        fields = '__all__'

    def get_achievement_rate(self, obj):
        if obj.target_amount and obj.target_amount > 0:
            return round(float(obj.actual_amount / obj.target_amount * 100), 1)
        return 0


class TopCustomerSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TopCustomer
        fields = '__all__'
