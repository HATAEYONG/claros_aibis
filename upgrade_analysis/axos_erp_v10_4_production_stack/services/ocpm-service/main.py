from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="ocpm-service")
NODES: List[dict] = []
EDGES: List[dict] = []

class GraphUpdateRequest(BaseModel):
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

@app.get("/health")
def health():
    return {"status": "ok", "service": "ocpm-service"}

@app.get("/graph")
def graph():
    return {"nodes": NODES, "edges": EDGES}

@app.post("/graph/update")
def graph_update(req: GraphUpdateRequest):
    for node in req.nodes:
        if node not in NODES:
            NODES.append(node)
    for edge in req.edges:
        if edge not in EDGES:
            EDGES.append(edge)
    return {"updated": True, "nodes": len(NODES), "edges": len(EDGES)}
