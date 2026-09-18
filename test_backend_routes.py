from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# 1. Health check
resp = client.get("/health")
assert resp.status_code == 200
data = resp.json()
print("GET /health:", data)
assert data["status"] == "healthy"
assert data["model_loaded"] is True

# 2. Model info
resp = client.get("/model-info")
assert resp.status_code == 200
data = resp.json()
print("\nGET /model-info:", data)
assert data["model_name"] == "Logistic Regression"
assert data["recall"] > 0.80

# 3. Predict Normal
resp = client.post("/predict", json={"Amount": 15.0, "Time": 36000})
assert resp.status_code == 200
data = resp.json()
print("\nPOST /predict (Normal):", data)
assert data["prediction"] == "LEGITIMATE"
assert data["risk_level"] == "LOW"

# 4. Predict Fraud
resp = client.post("/predict", json={
    "Amount": 1500.0,
    "Time": 10800,
    "V14": -7.8,
    "V4": 4.8,
    "V12": -6.1,
    "V17": -8.9
})
assert resp.status_code == 200
data = resp.json()
print("\nPOST /predict (Fraud):", data)
assert data["prediction"] == "FRAUD"
assert data["risk_level"] == "HIGH"

print("\nALL PHASE 3 FASTAPI ENDPOINTS VERIFIED SUCCESSFULLY!")
