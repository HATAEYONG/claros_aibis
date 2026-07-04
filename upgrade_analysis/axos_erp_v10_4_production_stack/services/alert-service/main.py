from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="alert-service")
ALERTS: List[dict] = []

class AlertRequest(BaseModel):
    alert_type: str
    title: str
    severity: str = "MEDIUM"
    source_object_type: str = ""
    source_object_id: str = ""
    dedup_key: str = ""
    detail_json: Dict[str, Any] = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "alert-service"}

@app.get("/alerts")
def list_alerts():
    return ALERTS

@app.post("/alerts")
def create_alert(req: AlertRequest):
    if req.dedup_key:
        for item in ALERTS:
            if item["dedup_key"] == req.dedup_key and item["status"] == "OPEN":
                return {"created": False, "deduped": True, "alert": item}
    alert = {
        "id": len(ALERTS) + 1,
        "alert_type": req.alert_type,
        "title": req.title,
        "severity": req.severity,
        "source_object_type": req.source_object_type,
        "source_object_id": req.source_object_id,
        "dedup_key": req.dedup_key,
        "status": "OPEN",
        "detail_json": req.detail_json,
    }
    ALERTS.append(alert)
    return {"created": True, "deduped": False, "alert": alert}
