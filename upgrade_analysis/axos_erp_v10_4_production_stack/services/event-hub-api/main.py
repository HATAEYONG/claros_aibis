from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="event-hub-api")
EVENTS: List[dict] = []

class PublishRequest(BaseModel):
    topic: str
    event_key: str
    event_type: str
    payload_json: Dict[str, Any]

@app.get("/health")
def health():
    return {"status": "ok", "service": "event-hub-api"}

@app.get("/events")
def list_events():
    return EVENTS[-100:]

@app.post("/publish")
def publish(req: PublishRequest):
    item = req.model_dump()
    EVENTS.append(item)
    return {"published": True, "event_key": req.event_key, "count": len(EVENTS)}
