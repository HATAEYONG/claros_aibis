from rest_framework import serializers
from .models import (
    HourlyProduction, LineUtilization, WorkerProductivity,
    OEEComponent, ProductionEfficiency, DailyProductionSummary
)


class HourlyProductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HourlyProduction
        fields = '__all__'


class LineUtilizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineUtilization
        fields = '__all__'


class WorkerProductivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProductivity
        fields = '__all__'


class OEEComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OEEComponent
        fields = '__all__'


class ProductionEfficiencySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionEfficiency
        fields = '__all__'


class DailyProductionSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyProductionSummary
        fields = '__all__'
