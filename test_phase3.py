import json
from backend.prediction import predict_transaction_risk, get_model_bundle

print("Testing model loading...", flush=True)
bundle = get_model_bundle()
print("Model loaded successfully:", bundle["model_name"], flush=True)

print("\nTesting Normal Transaction prediction...", flush=True)
normal_tx = {
    "Amount": 24.50,
    "Time": 36000,
    "V1": -0.1, "V2": 0.2, "V3": 0.5, "V4": -0.2
}
res_norm = predict_transaction_risk(normal_tx)
print("Normal Result:", json.dumps(res_norm, indent=2), flush=True)

print("\nTesting Fraud Transaction prediction...", flush=True)
fraud_tx = {
    "Amount": 1400.00,
    "Time": 10800,
    "V1": -3.85, "V2": 2.91, "V3": -4.20, "V4": 4.85, "V5": -2.60,
    "V12": -6.15, "V14": -7.80, "V17": -8.90
}
res_fraud = predict_transaction_risk(fraud_tx)
print("Fraud Result:", json.dumps(res_fraud, indent=2), flush=True)

assert res_norm["prediction"] == "LEGITIMATE"
assert res_norm["risk_level"] == "LOW"
assert res_fraud["prediction"] == "FRAUD"
assert res_fraud["risk_level"] == "HIGH"
print("\nPHASE 3 PREDICTION LOGIC FULLY VALIDATED!", flush=True)
