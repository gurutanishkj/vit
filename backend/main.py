"""
FastAPI Backend Application for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track

Core Endpoints:
- GET /health: System health and operational readiness
- POST /predict: Predicts transaction fraud using the genuinely trained ML model
- GET /model-info: Returns real model performance metrics and dataset dimensions
"""

import os
import sys
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Ensure project root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.prediction import predict_transaction_risk, get_model_bundle
from backend.auth import auth_router, get_current_user, get_optional_user
from backend.models import User

app = FastAPI(
    title="FraudShield API",
    description="Real-time financial fraud detection API powered by a genuine ML model",
    version="1.0.0"
)

# Enable CORS for React Vite frontend (http://localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Authentication Router (/auth/register, /auth/login, /auth/me)
app.include_router(auth_router)

# Mount /outputs for ML charts (ROC, PR Curve, Confusion Matrix)
if os.path.exists("outputs"):
    app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Mount built React Vite frontend from frontend/dist if available
from fastapi.responses import FileResponse

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_frontend():
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"service": "FraudShield Backend", "status": "running"}


# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class TransactionInput(BaseModel):
    Amount: float = Field(..., description="Transaction amount in currency units", ge=0.0)
    Time: Optional[float] = Field(0.0, description="Time in seconds from day start (0 to 86400)")
    threshold: Optional[float] = Field(0.70, description="Custom detection sensitivity threshold (0.05 - 0.95)")
    V1: Optional[float] = 0.0
    V2: Optional[float] = 0.0
    V3: Optional[float] = 0.0
    V4: Optional[float] = 0.0
    V5: Optional[float] = 0.0
    V6: Optional[float] = 0.0
    V7: Optional[float] = 0.0
    V8: Optional[float] = 0.0
    V9: Optional[float] = 0.0
    V10: Optional[float] = 0.0
    V11: Optional[float] = 0.0
    V12: Optional[float] = 0.0
    V13: Optional[float] = 0.0
    V14: Optional[float] = 0.0
    V15: Optional[float] = 0.0
    V16: Optional[float] = 0.0
    V17: Optional[float] = 0.0
    V18: Optional[float] = 0.0
    V19: Optional[float] = 0.0
    V20: Optional[float] = 0.0
    V21: Optional[float] = 0.0
    V22: Optional[float] = 0.0
    V23: Optional[float] = 0.0
    V24: Optional[float] = 0.0
    V25: Optional[float] = 0.0
    V26: Optional[float] = 0.0
    V27: Optional[float] = 0.0
    V28: Optional[float] = 0.0


class BatchTransactionInput(BaseModel):
    transactions: list[TransactionInput]
    threshold: Optional[float] = 0.70


# -------------------------------------------------------------
# Routes
# -------------------------------------------------------------
@app.get("/health")
def health_check():
    """
    Health check returning system and model status.
    """
    try:
        bundle = get_model_bundle()
        return {
            "status": "healthy",
            "service": "FraudShield Backend",
            "model_loaded": True,
            "model_name": bundle.get("model_name", "Logistic Regression"),
            "features_count": len(bundle.get("feature_columns", []))
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "FraudShield Backend",
            "model_loaded": False,
            "error": str(e)
        }


@app.get("/system-stats")
def get_system_stats():
    """Returns runtime system stats and control metrics."""
    try:
        bundle = get_model_bundle()
        return {
            "status": "operational",
            "model_name": bundle.get("model_name", "Balanced Logistic Regression"),
            "features_count": len(bundle.get("feature_columns", [])),
            "dataset_rows": 283726,
            "test_holdout_size": 56744,
            "default_threshold": 0.70,
            "latency_ms": "< 10ms",
            "engine": "Cost-Sensitive Pure NumPy ML",
            "hackathon": "Code Cortex 3.0 • VIT Vellore"
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/predict")
def predict(transaction: TransactionInput, current_user: User = Depends(get_current_user)):
    """
    Predicts whether a financial transaction is LEGITIMATE, REVIEW, or FRAUD.
    Accepts user-controlled threshold to adjust sensitivity dynamically.
    Protected by JWT Bearer Authentication (Guest or Registered Analyst).
    """
    try:
        data_dict = transaction.model_dump()
        thresh = transaction.threshold if transaction.threshold is not None else 0.70
        result = predict_transaction_risk(data_dict, threshold=thresh)
        return {
            "prediction": result["prediction"],
            "fraud_probability": result["fraud_probability"],
            "risk_level": result["risk_level"],
            "recommended_action": result.get("recommended_action", "Approve"),
            "threshold_used": result.get("threshold_used", thresh),
            "model_used": result["model_used"],
            "top_factors": result["top_factors"],
            "transaction_details": result["transaction_details"],
            "authenticated": True,
            "analyst": current_user.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/batch-predict")
def batch_predict(batch: BatchTransactionInput, current_user: User = Depends(get_current_user)):
    """
    Evaluates multiple transactions in a single batch pass.
    """
    try:
        results = []
        high_count = 0
        medium_count = 0
        low_count = 0
        total_amount = 0.0

        for idx, t in enumerate(batch.transactions):
            data_dict = t.model_dump()
            thresh = t.threshold if t.threshold is not None else (batch.threshold or 0.70)
            res = predict_transaction_risk(data_dict, threshold=thresh)
            total_amount += float(t.Amount)
            if res["risk_level"] == "HIGH":
                high_count += 1
            elif res["risk_level"] == "MEDIUM":
                medium_count += 1
            else:
                low_count += 1
            results.append({
                "id": idx + 1,
                "amount": t.Amount,
                "prediction": res["prediction"],
                "fraud_probability": res["fraud_probability"],
                "risk_level": res["risk_level"],
                "recommended_action": res.get("recommended_action", "Approve"),
                "top_factor": res["top_factors"][0]["feature"] if res["top_factors"] else "Amount"
            })

        return {
            "total_scanned": len(results),
            "fraud_count": high_count,
            "review_count": medium_count,
            "legitimate_count": low_count,
            "total_volume": round(total_amount, 2),
            "threshold_applied": batch.threshold or 0.70,
            "results": results,
            "analyst": current_user.name if current_user else "Guest Analyst"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")


@app.get("/model-info")
def get_model_info():
    """
    Returns actual trained model metrics and dataset metadata.
    """
    metrics_file = "models/metrics.json"
    if not os.path.exists(metrics_file):
        raise HTTPException(status_code=404, detail="Model metrics file not found. Run ml/train.py first.")

    with open(metrics_file, "r") as f:
        data = json.load(f)

    selected = data.get("selected_model", {})
    return {
        "model_name": selected.get("model_name", "Logistic Regression"),
        "number_of_features": len(data.get("feature_columns", [])),
        "test_dataset_size": data.get("test_dataset_size", 56744),
        "precision": selected.get("precision"),
        "recall": selected.get("recall"),
        "f1_score": selected.get("f1_score"),
        "roc_auc": selected.get("roc_auc"),
        "pr_auc": selected.get("pr_auc"),
        "confusion_matrix": selected.get("confusion_matrix")
    }


@app.get("/metrics")
def get_metrics():
    """Returns full metrics and comparisons from models/metrics.json"""
    metrics_file = "models/metrics.json"
    if not os.path.exists(metrics_file):
        raise HTTPException(status_code=404, detail="Metrics file not found.")
    with open(metrics_file, "r") as f:
        return json.load(f)


@app.get("/samples")
def get_samples():
    """Returns demo presets for 1-click transaction testing."""
    return [
        {
            "id": "coffee",
            "name": "Morning Coffee (Legitimate)",
            "category": "Routine Daily Spend",
            "description": "$4.50 coffee purchase at 8:30 AM with standard PCA profile.",
            "data": {
                "Amount": 4.50,
                "Time": 30600.0,
                "V1": -0.15, "V2": 0.08, "V3": 0.95, "V4": -0.12, "V5": 0.05,
                "V12": 0.15, "V14": 0.22, "V17": -0.05
            }
        },
        {
            "id": "grocery",
            "name": "Supermarket Grocery (Legitimate)",
            "category": "Retail Merchant",
            "description": "$78.25 supermarket purchase during peak evening hours.",
            "data": {
                "Amount": 78.25,
                "Time": 62100.0,
                "V1": 0.25, "V2": -0.10, "V3": 0.45, "V4": 0.05, "V5": -0.20,
                "V12": 0.35, "V14": 0.18, "V17": 0.12
            }
        },
        {
            "id": "midnight_wire",
            "name": "Midnight High-Value Wire (Fraudulent)",
            "category": "Off-Hours Transfer",
            "description": "$1,850 wire transfer at 3:15 AM with severe anomaly signals on V14/V17.",
            "data": {
                "Amount": 1850.00,
                "Time": 11700.0,
                "V1": -3.85, "V2": 2.91, "V3": -4.20, "V4": 4.85, "V5": -2.60,
                "V12": -6.15, "V14": -7.80, "V17": -8.90
            }
        },
        {
            "id": "carding_test",
            "name": "Micro Carding Attack (Fraudulent)",
            "category": "Automated Bot Testing",
            "description": "$1.20 test charge exhibiting high behavioral divergence across latent vectors.",
            "data": {
                "Amount": 1.20,
                "Time": 7500.0,
                "V1": -2.31, "V2": 1.85, "V3": -3.10, "V4": 3.75, "V5": -1.90,
                "V12": -4.80, "V14": -6.50, "V17": -5.90
            }
        }
    ]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question for FraudShield Assistant")


@app.post("/chat")
def chat_with_assistant(req: ChatRequest):
    """
    FraudShield Assistant chatbot endpoint powered exclusively by local knowledge base.
    Zero external LLM API calls.
    """
    kb_path = os.path.join(os.path.dirname(__file__), "chatbot_knowledge.json")
    if not os.path.exists(kb_path):
        return {
            "reply": "I'm FraudShield Assistant. I can help you understand FraudShield, fraud detection, the machine learning model, transaction analysis, the API, and the dashboard."
        }

    with open(kb_path, "r", encoding="utf-8") as f:
        knowledge_base = json.load(f)

    user_query = req.message.lower().strip()
    user_words = set(user_query.replace("?", "").replace("!", "").replace(".", "").split())

    best_entry = None
    max_score = 0

    # Token overlap matching (ignoring common question stop words)
    stop_words = {"what", "is", "the", "a", "an", "of", "to", "in", "on", "for", "how", "does", "do", "can", "you", "my"}
    meaningful_user_words = user_words - stop_words

    import re
    for entry in knowledge_base:
        # Whole word or phrase matching with regex word boundaries
        for kw in entry.get("keywords", []):
            pattern = r'\b' + re.escape(kw.lower()) + r'\b'
            if re.search(pattern, user_query):
                return {
                    "question": entry["question"],
                    "reply": entry["answer"]
                }

        # Meaningful token overlap matching
        question_words = set(entry["question"].lower().replace("?", "").split()) - stop_words
        overlap = len(meaningful_user_words.intersection(question_words))
        if overlap > max_score and overlap >= 1:
            max_score = overlap
            best_entry = entry

    if best_entry:
        return {
            "question": best_entry["question"],
            "reply": best_entry["answer"]
        }

    return {
        "reply": "I'm FraudShield Assistant. I can help you understand FraudShield, fraud detection, the machine learning model, transaction analysis, the API, and the dashboard."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

