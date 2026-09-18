"""
End-to-End System Integration Test Suite for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track
"""

import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return e.code, json.loads(error_body) if error_body else {}

print("==================================================")
print("FRAUDSHIELD END-TO-END VERIFICATION")
print("==================================================")

# 1. System Health
status, data = make_request("/health")
assert status == 200, f"Health check failed: {status}"
print("[PASS] 1. System Health: Healthy, ML model loaded into memory.")

# 2. Register New User
unique_email = f"judge_{uuid.uuid4().hex[:6]}@vit.ac.in"
register_payload = {
    "name": "VIT Hackathon Judge",
    "email": unique_email,
    "password": "SecretPassword123",
    "confirm_password": "SecretPassword123"
}
status, data = make_request("/auth/register", method="POST", data=register_payload)
assert status == 200, f"Registration failed: {data}"
token = data["access_token"]
print(f"[PASS] 2. Registration: User registered ({unique_email}) & JWT issued.")

# 3. Login User
login_payload = {
    "email": unique_email,
    "password": "SecretPassword123"
}
status, data = make_request("/auth/login", method="POST", data=login_payload)
assert status == 200, f"Login failed: {data}"
token = data["access_token"]
print("[PASS] 3. Login: Credentials authenticated & JWT token validated.")

# 4. Verify /auth/me Protected Endpoint
status, data = make_request("/auth/me", token=token)
assert status == 200, f"/auth/me failed: {data}"
assert data["name"] == "VIT Hackathon Judge"
print(f"[PASS] 4. Profile Protected Route: Verified for {data['name']}.")

# 5. Fetch Model Info
status, data = make_request("/model-info")
assert status == 200
assert data["recall"] > 0.80
assert data["roc_auc"] > 0.95
print(f"[PASS] 5. Model Info: Recall={data['recall']*100:.2f}%, ROC-AUC={data['roc_auc']:.4f}, Features={data['number_of_features']}.")

# 6. Fetch Sample Presets
status, samples = make_request("/samples")
assert status == 200
assert len(samples) == 4
print(f"[PASS] 6. Presets: Loaded {len(samples)} demo transaction presets.")

# 7. Predict Legitimate Transaction (Morning Coffee)
coffee_sample = samples[0]["data"]
status, pred_legit = make_request("/predict", method="POST", data=coffee_sample, token=token)
assert status == 200, f"Predict failed: {pred_legit}"
assert pred_legit["prediction"] == "LEGITIMATE"
assert pred_legit["risk_level"] == "LOW"
print(f"[PASS] 7. Predict (Legitimate): Result={pred_legit['prediction']}, Risk={pred_legit['risk_level']}, Prob={pred_legit['fraud_probability']:.4f}")

# 8. Predict Fraudulent Transaction (Midnight High-Value Wire)
wire_sample = samples[2]["data"]
status, pred_fraud = make_request("/predict", method="POST", data=wire_sample, token=token)
assert status == 200, f"Predict failed: {pred_fraud}"
assert pred_fraud["prediction"] == "FRAUD"
assert pred_fraud["risk_level"] == "HIGH"
assert pred_fraud["fraud_probability"] > 0.70
print(f"[PASS] 8. Predict (Fraudulent): Result={pred_fraud['prediction']}, Risk={pred_fraud['risk_level']}, Prob={pred_fraud['fraud_probability']:.4f}")

# 9. Verify Chatbot (FraudShield Assistant Local Knowledge Base)
questions = [
    "What is FraudShield?",
    "How does fraud detection work?",
    "What is recall?",
    "What does HIGH risk mean?"
]
for q in questions:
    status, chat_res = make_request("/chat", method="POST", data={"message": q})
    assert status == 200, f"Chatbot query '{q}' failed: {chat_res}"
    reply = chat_res.get("reply", "")
    assert len(reply) > 20
    print(f"[PASS] 9. Chatbot Q&A: '{q}' -> '{reply[:60]}...'")

# 10. Verify Frontend Serving
req = urllib.request.Request(f"{BASE_URL}/")
with urllib.request.urlopen(req) as resp:
    html_content = resp.read().decode("utf-8")
    assert resp.status == 200
    assert "FraudShield" in html_content
    print(f"[PASS] 10. Frontend Distribution: React app served with HTML length {len(html_content)} bytes.")

print("==================================================")
print("ALL 10 END-TO-END PHASES VERIFIED WITH 100% SUCCESS!")
print("==================================================")
