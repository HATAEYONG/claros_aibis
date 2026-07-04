import requests
from django.conf import settings
from .models import GatewayEvent, RiskScore, AlertRecord, WorkflowTaskRecord, ForecastRecord

def publish_event(topic, event_key, event_type, payload_json):
    event = GatewayEvent.objects.create(topic=topic, event_key=event_key, event_type=event_type, payload_json=payload_json, status="CREATED")
    r = requests.post(f"{settings.EVENT_HUB_URL}/publish", json={"topic": topic, "event_key": event_key, "event_type": event_type, "payload_json": payload_json}, timeout=10)
    event.status = "PUBLISHED" if r.ok else "FAILED"
    event.save(update_fields=["status", "updated_at"])
    return event, r.json()

def score_risk(object_type, object_id, features):
    r = requests.post(f"{settings.AI_RISK_URL}/score/delay-risk", json={"object_type": object_type, "object_id": object_id, "features": features}, timeout=10)
    data = r.json()
    obj, _ = RiskScore.objects.update_or_create(object_type=object_type, object_id=object_id, score_type="DELAY_RISK", defaults={"score_value": data["score"], "score_level": data["level"], "explanation_json": data.get("explanation", {})})
    return obj, data

def forecast_margin(object_type, object_id, revenue, cost, delay_penalty=0.0):
    r = requests.post(f"{settings.FORECAST_URL}/forecast/margin", json={"revenue": revenue, "cost": cost, "delay_penalty": delay_penalty, "rework_cost": 0.0}, timeout=10)
    data = r.json()
    key = f"MARGIN:{object_type}:{object_id}"
    obj, _ = ForecastRecord.objects.update_or_create(forecast_key=key, defaults={"forecast_type": "MARGIN", "object_type": object_type, "object_id": object_id, "forecast_json": data})
    return obj, data

def create_alert(alert_type, title, severity, source_object_type, source_object_id):
    key = f"{alert_type}:{source_object_type}:{source_object_id}"
    r = requests.post(f"{settings.ALERT_SERVICE_URL}/alerts", json={"alert_type": alert_type, "title": title, "severity": severity, "source_object_type": source_object_type, "source_object_id": source_object_id, "dedup_key": key, "detail_json": {}}, timeout=10)
    data = r.json()
    alert = data["alert"]
    AlertRecord.objects.update_or_create(alert_key=key, defaults={"alert_type": alert["alert_type"], "title": alert["title"], "severity": alert["severity"], "source_object_type": alert["source_object_type"], "source_object_id": alert["source_object_id"], "status": alert["status"], "detail_json": alert.get("detail_json", {})})
    return data

def create_task(task_type, title, owner_role, source_object_type, source_object_id):
    key = f"{task_type}:{source_object_type}:{source_object_id}"
    r = requests.post(f"{settings.WORKFLOW_SERVICE_URL}/tasks", json={"task_type": task_type, "title": title, "owner_role": owner_role, "source_object_type": source_object_type, "source_object_id": source_object_id, "detail_json": {}}, timeout=10)
    data = r.json()
    task = data["task"]
    WorkflowTaskRecord.objects.update_or_create(task_key=key, defaults={"task_type": task["task_type"], "title": task["title"], "owner_role": task["owner_role"], "source_object_type": task["source_object_type"], "source_object_id": task["source_object_id"], "status": task["status"], "detail_json": task.get("detail_json", {})})
    return data

def update_graph(nodes, edges):
    r = requests.post(f"{settings.OCPM_SERVICE_URL}/graph/update", json={"nodes": nodes, "edges": edges}, timeout=10)
    return r.json()
