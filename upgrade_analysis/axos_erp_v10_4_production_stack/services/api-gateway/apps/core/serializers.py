from rest_framework import serializers
from .models import GatewayEvent, RiskScore, AlertRecord, WorkflowTaskRecord, ForecastRecord
class GatewayEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = GatewayEvent
        fields = "__all__"
class RiskScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskScore
        fields = "__all__"
class AlertRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRecord
        fields = "__all__"
class WorkflowTaskRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowTaskRecord
        fields = "__all__"
class ForecastRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForecastRecord
        fields = "__all__"
