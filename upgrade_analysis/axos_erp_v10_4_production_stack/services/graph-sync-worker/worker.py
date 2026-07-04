import time
import os
import requests

OCPM_SERVICE_URL = os.getenv("OCPM_SERVICE_URL", "http://localhost:8500")

print("graph-sync-worker started")
while True:
    try:
        data = requests.get(f"{OCPM_SERVICE_URL}/graph", timeout=10).json()
        print(f"graph snapshot nodes={len(data.get('nodes', []))} edges={len(data.get('edges', []))}")
    except Exception as e:
        print("worker error:", e)
    time.sleep(30)
