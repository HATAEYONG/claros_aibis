from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="forecasting-service")

class ForecastRequest(BaseModel):
    revenue: float
    cost: float
    delay_penalty: float = 0.0
    rework_cost: float = 0.0

@app.get("/health")
def health():
    return {"status": "ok", "service": "forecasting-service"}

@app.post("/forecast/margin")
def forecast_margin(req: ForecastRequest):
    margin = req.revenue - req.cost - req.delay_penalty - req.rework_cost
    return {
        "forecast_margin": margin,
        "risk_level": "HIGH" if margin < 0 else "NORMAL",
        "recommendation": "Adjust production / procurement" if margin < 0 else "Within target",
    }
