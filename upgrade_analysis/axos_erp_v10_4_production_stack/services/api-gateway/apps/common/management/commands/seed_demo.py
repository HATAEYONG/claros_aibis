from django.core.management.base import BaseCommand
from apps.core.models import GatewayEvent, RiskScore, AlertRecord, WorkflowTaskRecord, ForecastRecord
class Command(BaseCommand):
    help = "seed demo"
    def handle(self, *args, **kwargs):
        GatewayEvent.objects.get_or_create(event_key="seed-evt", defaults={"topic": "erp.production.order.released", "event_type": "erp.production_order.released", "payload_json": {"production_order_no": "PO-2002"}, "status": "SEEDED"})
        RiskScore.objects.get_or_create(object_type="ORDER", object_id="SO-1002", score_type="DELAY_RISK", defaults={"score_value": 72.5, "score_level": "HIGH", "explanation_json": {"top_reasons": ["seed"]}})
        AlertRecord.objects.get_or_create(alert_key="seed-alert", defaults={"alert_type": "DELAY", "title": "Seed alert", "severity": "HIGH", "status": "OPEN"})
        WorkflowTaskRecord.objects.get_or_create(task_key="seed-task", defaults={"task_type": "REVIEW_DELAY_RISK", "title": "Seed task", "owner_role": "PRODUCTION_MANAGER", "status": "OPEN"})
        ForecastRecord.objects.get_or_create(forecast_key="seed-forecast", defaults={"forecast_type": "MARGIN", "object_type": "ORDER", "object_id": "SO-1002", "forecast_json": {"forecast_margin": -1200000, "risk_level": "HIGH"}})
        self.stdout.write("seed complete")
