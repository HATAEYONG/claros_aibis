from rest_framework import serializers
from .models import (
    ESGScore, CarbonEmission, EnergyConsumption,
    FourM2EMetric, EnvironmentalProject, SocialResponsibility, GovernanceMetric
)


class ESGScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGScore
        fields = '__all__'


class CarbonEmissionSerializer(serializers.ModelSerializer):
    achievement_rate = serializers.SerializerMethodField()

    class Meta:
        model = CarbonEmission
        fields = '__all__'

    def get_achievement_rate(self, obj):
        if obj.target_emission and obj.target_emission > 0:
            return round((1 - float(obj.actual_emission / obj.target_emission)) * 100, 1)
        return 0


class EnergyConsumptionSerializer(serializers.ModelSerializer):
    source_display = serializers.CharField(source='get_energy_source_display', read_only=True)

    class Meta:
        model = EnergyConsumption
        fields = '__all__'


class FourM2EMetricSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    achievement = serializers.SerializerMethodField()

    class Meta:
        model = FourM2EMetric
        fields = '__all__'

    def get_achievement(self, obj):
        if obj.target_value and obj.target_value > 0:
            return round(float(obj.actual_value / obj.target_value * 100), 1)
        return 0


class EnvironmentalProjectSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    roi = serializers.SerializerMethodField()

    class Meta:
        model = EnvironmentalProject
        fields = '__all__'

    def get_roi(self, obj):
        if obj.investment and obj.investment > 0:
            return round(float(obj.saving / obj.investment * 100), 1)
        return 0


class EnvironmentalProjectListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EnvironmentalProject
        fields = ['id', 'project_id', 'title', 'category', 'progress', 'status', 'status_display']


class SocialResponsibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialResponsibility
        fields = '__all__'


class GovernanceMetricSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    difference = serializers.SerializerMethodField()

    class Meta:
        model = GovernanceMetric
        fields = '__all__'

    def get_difference(self, obj):
        return round(float(obj.actual_value - obj.benchmark), 1)
