from rest_framework import serializers
from .models import (
    MonthlyCost, ProductCost, CostReductionProject,
    CostDriver, BreakEvenAnalysis, CostStructure
)


class MonthlyCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyCost
        fields = '__all__'


class MonthlyCostListSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyCost
        fields = ['id', 'fiscal_year', 'fiscal_month', 'total_cost', 'unit_cost']


class ProductCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCost
        fields = '__all__'


class ProductCostListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCost
        fields = ['id', 'product_code', 'product_name', 'total_cost',
                  'selling_price', 'margin', 'margin_rate']


class CostReductionProjectSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    achievement_rate = serializers.SerializerMethodField()

    class Meta:
        model = CostReductionProject
        fields = '__all__'

    def get_achievement_rate(self, obj):
        if obj.target_saving and obj.target_saving > 0:
            return round(float(obj.actual_saving / obj.target_saving * 100), 1)
        return 0


class CostReductionProjectListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CostReductionProject
        fields = ['id', 'project_id', 'title', 'category', 'target_saving',
                  'actual_saving', 'progress', 'status', 'status_display']


class CostDriverSerializer(serializers.ModelSerializer):
    trend_display = serializers.CharField(source='get_trend_display', read_only=True)

    class Meta:
        model = CostDriver
        fields = '__all__'


class BreakEvenAnalysisSerializer(serializers.ModelSerializer):
    excess_rate = serializers.SerializerMethodField()

    class Meta:
        model = BreakEvenAnalysis
        fields = '__all__'

    def get_excess_rate(self, obj):
        if obj.break_even_point and obj.break_even_point > 0:
            return round((float(obj.actual_sales / obj.break_even_point) - 1) * 100, 1)
        return 0


class CostStructureSerializer(serializers.ModelSerializer):
    cost_type_display = serializers.CharField(source='get_cost_type_display', read_only=True)

    class Meta:
        model = CostStructure
        fields = '__all__'
