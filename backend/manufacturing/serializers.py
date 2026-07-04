from rest_framework import serializers
from .models import (
    WorkshopStatus, CycleTime, OEEMetric,
    ManpowerAllocation, WorkStandard, EquipmentDowntime
)


class WorkshopStatusSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WorkshopStatus
        fields = '__all__'


class CycleTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CycleTime
        fields = '__all__'


class OEEMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = OEEMetric
        fields = '__all__'


class ManpowerAllocationSerializer(serializers.ModelSerializer):
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)

    class Meta:
        model = ManpowerAllocation
        fields = '__all__'


class WorkStandardSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WorkStandard
        fields = '__all__'


class EquipmentDowntimeSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = EquipmentDowntime
        fields = '__all__'
