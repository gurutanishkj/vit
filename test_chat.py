from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# 1. Test standard question
resp = client.post("/chat", json={"message": "What is FraudShield?"})
assert resp.status_code == 200
data = resp.json()
print("Q: What is FraudShield?\nA:", data["reply"])
assert "machine-learning-based" in data["reply"]

# 2. Test recall question
resp = client.post("/chat", json={"message": "Can you explain recall?"})
assert resp.status_code == 200
data = resp.json()
print("\nQ: Can you explain recall?\nA:", data["reply"])
assert "Recall measures" in data["reply"]

# 3. Test unknown question (fallback)
resp = client.post("/chat", json={"message": "What is the capital of France?"})
assert resp.status_code == 200
data = resp.json()
print("\nQ: Unknown question\nA:", data["reply"])
assert "I'm FraudShield Assistant" in data["reply"]

print("\nCHATBOT ENDPOINT TESTED AND VERIFIED SUCCESSFULLY!")
