"""
Prediction Engine for FraudShield Backend.
Code Cortex 3.0 Hackathon - Finance Track

Loads the genuinely trained ML model bundle and provides
real-time inference with calibrated fraud risk scoring.
"""

import os
import sys
import joblib
import numpy as np

# Ensure project root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import definitions required by joblib to deserialize
from ml.preprocess import RobustScalerNP
from ml.train import BalancedLogisticRegression, LightGBMRandomForest

# Expose under __main__ so joblib unpickles correctly regardless of calling context
sys.modules['__main__'].BalancedLogisticRegression = BalancedLogisticRegression
sys.modules['__main__'].RobustScalerNP = RobustScalerNP

# Global model cache
_MODEL_BUNDLE = None


def get_model_bundle(bundle_path="models/fraud_model.joblib"):
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is None:
        if not os.path.exists(bundle_path):
            raise FileNotFoundError(f"Model bundle not found at {bundle_path}. Run ml/train.py first.")
        _MODEL_BUNDLE = joblib.load(bundle_path)
    return _MODEL_BUNDLE


def predict_transaction_risk(transaction_data: dict, threshold: float = 0.70) -> dict:
    """
    Evaluates a transaction using the trained ML model.

    Threshold System:
    - LOW Risk:    fraud_probability < 0.30 -> LEGITIMATE
    - MEDIUM Risk: 0.30 <= fraud_probability < 0.70 -> Review / LEGITIMATE (or Step-up 2FA)
    - HIGH Risk:   fraud_probability >= 0.70 -> FRAUD
    """
    bundle = get_model_bundle()
    model = bundle["model"]
    scaler = bundle["scaler_amount"]
    feature_cols = bundle["feature_columns"]

    # 1. Feature Extraction & Engineering
    amount_val = float(transaction_data.get("Amount", 0.0))
    time_val = float(transaction_data.get("Time", 0.0))

    seconds_in_day = 86400
    time_sin = np.sin(2 * np.pi * (time_val % seconds_in_day) / seconds_in_day)
    time_cos = np.cos(2 * np.pi * (time_val % seconds_in_day) / seconds_in_day)
    scaled_amount = float(scaler.transform([[amount_val]])[0, 0])

    feature_vector = []
    for col in feature_cols:
        if col == "scaled_amount":
            feature_vector.append(scaled_amount)
        elif col == "time_sin":
            feature_vector.append(time_sin)
        elif col == "time_cos":
            feature_vector.append(time_cos)
        else:
            feature_vector.append(float(transaction_data.get(col, 0.0)))

    X = np.array(feature_vector, dtype=np.float64).reshape(1, -1)

    # 2. Probability Output from Trained ML Model
    probs = model.predict_proba(X)
    fraud_prob = float(probs[0, 1])

    # 3. Categorize Risk Level based on User-Controlled Threshold
    # Active threshold T defines the Fraud cutoff
    T = float(np.clip(threshold, 0.05, 0.95))
    low_cutoff = round(min(0.30, T * 0.5), 3)

    if fraud_prob < low_cutoff:
        risk_level = "LOW"
        prediction = "LEGITIMATE"
        recommended_action = "Approve Automatically"
    elif fraud_prob < T:
        risk_level = "MEDIUM"
        prediction = "REVIEW"
        recommended_action = "Step-up 2FA Challenge"
    else:
        risk_level = "HIGH"
        prediction = "FRAUD"
        recommended_action = "Decline & Flag Transaction"

    # 4. Feature Attribution / Explainability
    top_factors = []
    if hasattr(model, "weights") and model.weights is not None:
        contributions = X[0] * model.weights
        top_indices = np.argsort(-np.abs(contributions))[:4]
        for idx in top_indices:
            feat_name = feature_cols[idx]
            impact_val = float(contributions[idx])
            top_factors.append({
                "feature": feat_name,
                "impact": round(impact_val, 3),
                "direction": "Elevates Risk" if impact_val > 0 else "Protects Transaction"
            })

    return {
        "prediction": prediction,
        "fraud_probability": round(fraud_prob, 4),
        "risk_level": risk_level,
        "recommended_action": recommended_action,
        "threshold_used": round(T, 2),
        "model_used": bundle.get("model_name", "Trained ML Model"),
        "top_factors": top_factors,
        "transaction_details": {
            "amount": amount_val,
            "scaled_amount": round(scaled_amount, 3),
            "hour_of_day": round((time_val % seconds_in_day) / 3600.0, 1)
        }
    }
