import json
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("--- Testing Registration ---", flush=True)
# 1. Password mismatch
resp = client.post("/auth/register", json={
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "confirm_password": "wrongpassword"
})
assert resp.status_code == 400
print("Password mismatch caught successfully (400)", flush=True)

# 2. Successful Registration
resp = client.post("/auth/register", json={
    "name": "Jane Doe",
    "email": "jane.doe@vit.ac.in",
    "password": "securepassword123",
    "confirm_password": "securepassword123"
})
# If already exists from prior test, accept 200 or login
if resp.status_code == 400 and "already exists" in resp.text:
    print("User already registered, proceeding to login test.")
else:
    assert resp.status_code == 200
    reg_data = resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "jane.doe@vit.ac.in"
    print("Registration successful:", reg_data["user"], flush=True)

print("\n--- Testing Login ---", flush=True)
# 3. Invalid password
resp = client.post("/auth/login", json={
    "email": "jane.doe@vit.ac.in",
    "password": "incorrectpassword"
})
assert resp.status_code == 401
print("Invalid password rejected (401)", flush=True)

# 4. Valid login
resp = client.post("/auth/login", json={
    "email": "jane.doe@vit.ac.in",
    "password": "securepassword123"
})
assert resp.status_code == 200
login_data = resp.json()
token = login_data["access_token"]
print("Login successful! Token acquired:", token[:25] + "...", flush=True)

print("\n--- Testing GET /auth/me ---", flush=True)
# 5. Unauthenticated
resp = client.get("/auth/me")
assert resp.status_code == 401
print("Unauthenticated /auth/me rejected (401)", flush=True)

# 6. Authenticated
headers = {"Authorization": f"Bearer {token}"}
resp = client.get("/auth/me", headers=headers)
assert resp.status_code == 200
profile = resp.json()
print("Authenticated profile verified:", profile, flush=True)
assert profile["email"] == "jane.doe@vit.ac.in"

print("\n--- Testing Protected /predict with JWT ---", flush=True)
# 7. /predict without token -> 401
resp = client.post("/predict", json={"Amount": 50.0, "Time": 36000})
assert resp.status_code == 401
print("Unauthenticated /predict rejected (401)", flush=True)

# 8. /predict with valid Bearer token -> 200
resp = client.post("/predict", json={"Amount": 50.0, "Time": 36000}, headers=headers)
assert resp.status_code == 200
pred_res = resp.json()
print("Authenticated /predict succeeded:", pred_res, flush=True)
assert pred_res["prediction"] in ["LEGITIMATE", "FRAUD"]

print("\nALL PHASE 4 AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!", flush=True)
