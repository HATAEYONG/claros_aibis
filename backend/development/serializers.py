from rest_framework import serializers
from .models import (
    RDProject, InnovationMetric, Patent,
    RDPersonnel, TechnologyRoadmap, RDBudget
)


class RDProjectSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    budget_usage_rate = serializers.SerializerMethodField()

    class Meta:
        model = RDProject
        fields = '__all__'

    def get_budget_usage_rate(self, obj):
        if obj.budget and obj.budget > 0:
            return round(float(obj.spent / obj.budget * 100), 2)
        return 0


class InnovationMetricSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = InnovationMetric
        fields = '__all__'


class PatentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    ip_type_display = serializers.CharField(source='get_ip_type_display', read_only=True)

    class Meta:
        model = Patent
        fields = '__all__'


class RDPersonnelSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = RDPersonnel
        fields = '__all__'


class TechnologyRoadmapSerializer(serializers.ModelSerializer):
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TechnologyRoadmap
        fields = '__all__'


class RDBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = RDBudget
        fields = '__all__'
