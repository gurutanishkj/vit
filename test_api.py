import urllib.request
import json

base_url = "http://127.0.0.1:8000"

# 1. Test /health
req = urllib.request.urlopen(f"{base_url}/health")
health_data = json.loads(req.read().decode())
print("GET /health SUCCESS:", health_data)

# 2. Test /metrics
req = urllib.request.urlopen(f"{base_url}/metrics")
metrics_data = json.loads(req.read().decode())
print("GET /metrics SUCCESS: Loaded", len(metrics_data.get("all_models", [])), "model evaluations.")

# 3. Test /samples
req = urllib.request.urlopen(f"{base_url}/samples")
samples_data = json.loads(req.read().decode())
print("GET /samples SUCCESS: Loaded", len(samples_data), "demo presets.")

# 4. Test /predict with Legitimate Transaction
normal_tx = {
    "Amount": 22.50,
    "Time": 36000,
    "V1": -0.2, "V2": 0.1, "V3": 0.8, "V4": -0.1,
    "V12": 0.1, "V14": 0.2, "V17": -0.05
}
data_bytes = json.dumps(normal_tx).encode("utf-8")
post_req = urllib.request.Request(
    f"{base_url}/predict",
    data=data_bytes,
    headers={"Content-Type": "application/json"}
)
resp = urllib.request.urlopen(post_req)
pred_data = json.loads(resp.read().decode())
print("\nPOST /predict (Legit) SUCCESS:")
print(json.dumps(pred_data, indent=2))

# 5. Test /predict with Fraudulent Transaction
fraud_tx = {
    "Amount": 1250.00,
    "Time": 10800,
    "V1": -3.85, "V2": 2.91, "V3": -4.20, "V4": 4.85, "V5": -2.60,
    "V12": -6.15, "V14": -7.80, "V17": -8.90
}
data_bytes = json.dumps(fraud_tx).encode("utf-8")
post_req = urllib.request.Request(
    f"{base_url}/predict",
    data=data_bytes,
    headers={"Content-Type": "application/json"}
)
resp = urllib.request.urlopen(post_req)
pred_fraud = json.loads(resp.read().decode())
print("\nPOST /predict (Fraud) SUCCESS:")
print(json.dumps(pred_fraud, indent=2))

print("\nALL API ENDPOINTS TESTED AND VALIDATED SUCCESSFULLY!")
