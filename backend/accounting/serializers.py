from rest_framework import serializers
from .models import (
    BudgetActual, DepartmentProfitability, KPIPerformance,
    FinancialRatioAnalysis, BudgetAllocation, InvestmentROI
)


class BudgetActualSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetActual
        fields = '__all__'


class DepartmentProfitabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentProfitability
        fields = '__all__'


class KPIPerformanceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = KPIPerformance
        fields = '__all__'


class FinancialRatioAnalysisSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = FinancialRatioAnalysis
        fields = '__all__'


class BudgetAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetAllocation
        fields = '__all__'


class InvestmentROISerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = InvestmentROI
        fields = '__all__'
