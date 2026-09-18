"""
Transaction Fraud Prediction Pipeline.
Code Cortex 3.0 Hackathon - Finance Track

Provides reusable prediction function:
predict_transaction(transaction_data)

Returns:
- prediction: 'FRAUD' or 'LEGITIMATE'
- fraud_probability: float [0.0, 1.0]
- risk_level: 'LOW', 'MEDIUM', or 'HIGH'
- risk_factors: list of top driving factors explaining the score
"""

import os
import sys
import joblib
import numpy as np

# Ensure parent path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import classes so joblib can unpickle cleanly
from src.data_preprocessing import RobustScalerNP
from src.models import BalancedLogisticRegression, LightGBMRandomForest, LightGBMGradientBoosting

# Provide backward-compatibility alias for joblib if model was trained in __main__
sys.modules['__main__'].BalancedLogisticRegression = BalancedLogisticRegression
sys.modules['__main__'].RobustScalerNP = RobustScalerNP

# Global cache for loaded model bundle
_MODEL_BUNDLE = None


def load_model(bundle_path="models/fraud_model.joblib"):
    """Loads and caches the trained model bundle."""
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is None:
        if not os.path.exists(bundle_path):
            raise FileNotFoundError(f"Model bundle not found at {bundle_path}. Run 'src/train.py' first.")
        _MODEL_BUNDLE = joblib.load(bundle_path)
    return _MODEL_BUNDLE


def predict_transaction(transaction_data, bundle_path="models/fraud_model.joblib", threshold=0.70):
    """
    Evaluates a single financial transaction.

    Parameters:
    - transaction_data (dict): Dictionary with keys:
        - 'Time' (float/int): Seconds elapsed (or 0-86400)
        - 'Amount' (float): Transaction amount in currency
        - 'V1' through 'V28' (float): PCA components
    - threshold (float): Fraud classification decision threshold

    Returns:
    - dict:
        - prediction (str): 'FRAUD' or 'LEGITIMATE'
        - fraud_probability (float): Model's calibrated probability [0.0000 - 1.0000]
        - risk_level (str): 'LOW', 'MEDIUM', or 'HIGH'
        - model_name (str): Selected ML model
        - top_factors (list): Key features influencing this risk score
    """
    bundle = load_model(bundle_path)
    model = bundle["model"]
    scaler = bundle["scaler_amount"]
    feature_cols = bundle["feature_columns"]

    # 1. Feature Engineering
    time_val = float(transaction_data.get("Time", 0.0))
    amount_val = float(transaction_data.get("Amount", 0.0))

    # 24-hour cycle periodicity (86,400s in a day)
    seconds_in_day = 86400
    time_sin = np.sin(2 * np.pi * (time_val % seconds_in_day) / seconds_in_day)
    time_cos = np.cos(2 * np.pi * (time_val % seconds_in_day) / seconds_in_day)

    # Scale amount with training fitted RobustScaler
    scaled_amount = float(scaler.transform([[amount_val]])[0, 0])

    # Assemble vector in identical order as feature_columns
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

    # 2. Inference & Probability Calculation
    probs = model.predict_proba(X)
    fraud_prob = float(probs[0, 1])

    # 3. Determine Risk Level
    if fraud_prob < 0.30:
        risk_level = "LOW"
        prediction = "LEGITIMATE"
    elif fraud_prob < 0.70:
        risk_level = "MEDIUM"
        prediction = "FRAUD" if fraud_prob >= threshold else "LEGITIMATE"
    else:
        risk_level = "HIGH"
        prediction = "FRAUD"

    # 4. Explainability: Top Feature Contributions
    top_factors = []
    if hasattr(model, "weights") and model.weights is not None:
        contributions = X[0] * model.weights
        # Sort indices by absolute contribution
        sorted_indices = np.argsort(-np.abs(contributions))[:3]
        for idx in sorted_indices:
            name = feature_cols[idx]
            val = float(contributions[idx])
            direction = "Elevated Risk" if val > 0 else "Reduced Risk"
            top_factors.append({
                "feature": name,
                "impact": round(val, 3),
                "direction": direction
            })

    return {
        "prediction": prediction,
        "fraud_probability": round(fraud_prob, 4),
        "risk_level": risk_level,
        "model_used": bundle.get("model_name", "Trained ML Model"),
        "top_factors": top_factors,
        "transaction_summary": {
            "amount": amount_val,
            "scaled_amount": round(scaled_amount, 3),
            "time_hour": round((time_val % seconds_in_day) / 3600.0, 1)
        }
    }


if __name__ == "__main__":
    # Test with normal transaction sample
    sample_normal = {f"V{i}": 0.0 for i in range(1, 29)}
    sample_normal["Amount"] = 25.50
    sample_normal["Time"] = 36000
    res_normal = predict_transaction(sample_normal)
    print("Normal Sample:", res_normal)

    # Test with typical fraud signature (V14, V17 strongly negative, V4 positive)
    sample_fraud = {f"V{i}": 0.0 for i in range(1, 29)}
    sample_fraud["V14"] = -7.5
    sample_fraud["V17"] = -8.2
    sample_fraud["V12"] = -6.1
    sample_fraud["V4"] = 5.2
    sample_fraud["Amount"] = 120.0
    sample_fraud["Time"] = 12000
    res_fraud = predict_transaction(sample_fraud)
    print("\nFraud Sample:", res_fraud)
