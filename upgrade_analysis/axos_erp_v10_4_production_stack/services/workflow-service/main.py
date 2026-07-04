from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="workflow-service")
TASKS: List[dict] = []

class TaskRequest(BaseModel):
    task_type: str
    title: str
    owner_role: str = ""
    source_object_type: str = ""
    source_object_id: str = ""
    detail_json: Dict[str, Any] = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "workflow-service"}

@app.get("/tasks")
def list_tasks():
    return TASKS

@app.post("/tasks")
def create_task(req: TaskRequest):
    for item in TASKS:
        if item["task_type"] == req.task_type and item["source_object_type"] == req.source_object_type and item["source_object_id"] == req.source_object_id and item["status"] == "OPEN":
            return {"created": False, "deduped": True, "task": item}
    task = {
        "id": len(TASKS) + 1,
        "task_type": req.task_type,
        "title": req.title,
        "owner_role": req.owner_role,
        "source_object_type": req.source_object_type,
        "source_object_id": req.source_object_id,
        "status": "OPEN",
        "detail_json": req.detail_json,
    }
    TASKS.append(task)
    return {"created": True, "deduped": False, "task": task}
