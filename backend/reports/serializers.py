from rest_framework import serializers
from .models import (
    ExecutiveSummary, DepartmentComparison, KeyMetricSummary,
    RiskOpportunity, Recommendation, MonthlyReport
)


class ExecutiveSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutiveSummary
        fields = '__all__'


class DepartmentComparisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentComparison
        fields = '__all__'


class KeyMetricSummarySerializer(serializers.ModelSerializer):
    trend_display = serializers.CharField(source='get_trend_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = KeyMetricSummary
        fields = '__all__'


class RiskOpportunitySerializer(serializers.ModelSerializer):
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RiskOpportunity
        fields = '__all__'


class RecommendationSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Recommendation
        fields = '__all__'


class MonthlyReportSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MonthlyReport
        fields = '__all__'
