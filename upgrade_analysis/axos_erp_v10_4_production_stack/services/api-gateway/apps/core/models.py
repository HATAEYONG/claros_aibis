from django.db import models
from apps.common.models import TimeStampedModel

class GatewayEvent(TimeStampedModel):
    topic = models.CharField(max_length=120)
    event_key = models.CharField(max_length=120, unique=True)
    event_type = models.CharField(max_length=120)
    payload_json = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=30, default="PUBLISHED")

class RiskScore(TimeStampedModel):
    object_type = models.CharField(max_length=50)
    object_id = models.CharField(max_length=100)
    score_type = models.CharField(max_length=50)
    score_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    score_level = models.CharField(max_length=20, default="LOW")
    explanation_json = models.JSONField(default=dict, blank=True)

class AlertRecord(TimeStampedModel):
    alert_key = models.CharField(max_length=120, unique=True)
    alert_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, default="MEDIUM")
    source_object_type = models.CharField(max_length=50, blank=True, default="")
    source_object_id = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(max_length=20, default="OPEN")
    detail_json = models.JSONField(default=dict, blank=True)

class WorkflowTaskRecord(TimeStampedModel):
    task_key = models.CharField(max_length=120, unique=True)
    task_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    owner_role = models.CharField(max_length=50, blank=True, default="")
    source_object_type = models.CharField(max_length=50, blank=True, default="")
    source_object_id = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(max_length=20, default="OPEN")
    detail_json = models.JSONField(default=dict, blank=True)

class ForecastRecord(TimeStampedModel):
    forecast_key = models.CharField(max_length=120, unique=True)
    forecast_type = models.CharField(max_length=50)
    object_type = models.CharField(max_length=50)
    object_id = models.CharField(max_length=100)
    forecast_json = models.JSONField(default=dict, blank=True)
