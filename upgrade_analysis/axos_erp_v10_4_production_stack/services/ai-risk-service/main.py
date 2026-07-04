from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="ai-risk-service")

class RiskRequest(BaseModel):
    object_type: str
    object_id: str
    features: Dict[str, Any]

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-risk-service"}

@app.post("/score/delay-risk")
def score_delay_risk(req: RiskRequest):
    f = req.features or {}
    score = 25
    reasons = []
    if f.get("downtime"):
        score += 45
        reasons.append("equipment downtime")
    if f.get("duration_min", 0) >= 60:
        score += 10
        reasons.append("long duration")
    if f.get("quality_hold"):
        score += 25
        reasons.append("quality hold")
    score = min(100, score)
    return {"score": score, "level": "HIGH" if score >= 70 else "LOW", "explanation": {"top_reasons": reasons or ["normal flow"]}}
