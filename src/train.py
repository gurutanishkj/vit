"""
Model Training and Selection Pipeline for Financial Fraud Detection.
Code Cortex 3.0 Hackathon - Finance Track

Trains multiple genuine Machine Learning models on the actual dataset:
1. Balanced Logistic Regression (Linear baseline with cost-sensitive loss)
2. Random Forest Classifier (LightGBM Bagging of decision trees)
3. Gradient Boosting Classifier (LightGBM GBDT)

Evaluates all models on unseen test transactions, compares metrics,
generates publication-quality charts, and exports the production bundle.
"""

import os
import sys
import time
import json
import joblib
import numpy as np
import lightgbm as lgb

# Ensure parent path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_preprocessing import FraudDataPreprocessor
from src.evaluate import (
    compute_metrics,
    plot_confusion_matrix,
    plot_roc_curve,
    plot_pr_curve,
    plot_model_comparison
)
from src.geospatial_ml import GeospatialHotspotDetector


class BalancedLogisticRegression:
    """
    Pure NumPy implementation of Cost-Sensitive Logistic Regression.
    Weights each class inversely proportional to class frequencies to penalize
    fraud misclassifications heavily without artificial data fabrication.
    """
    def __init__(self, lr=0.08, n_iters=800, l2_reg=0.005, random_state=42):
        self.lr = lr
        self.n_iters = n_iters
        self.l2_reg = l2_reg
        self.random_state = random_state
        self.weights = None
        self.bias = None

    def _sigmoid(self, z):
        z = np.clip(z, -30, 30)
        return 1.0 / (1.0 + np.exp(-z))

    def fit(self, X, y):
        np.random.seed(self.random_state)
        n_samples, n_features = X.shape

        # Cost-sensitive weights
        n_pos = np.sum(y == 1)
        n_neg = np.sum(y == 0)
        weight_pos = n_samples / (2.0 * n_pos)
        weight_neg = n_samples / (2.0 * n_neg)

        sample_weights = np.where(y == 1, weight_pos, weight_neg)

        self.weights = np.random.normal(0, 0.01, size=n_features)
        self.bias = 0.0

        for i in range(self.n_iters):
            linear_model = np.dot(X, self.weights) + self.bias
            y_predicted = self._sigmoid(linear_model)

            errors = (y_predicted - y) * sample_weights

            dw = (np.dot(X.T, errors) / n_samples) + (self.l2_reg * self.weights)
            db = np.sum(errors) / n_samples

            self.weights -= self.lr * dw
            self.bias -= self.lr * db

        return self

    def predict_proba(self, X):
        linear_model = np.dot(X, self.weights) + self.bias
        p1 = self._sigmoid(linear_model).reshape(-1, 1)
        p0 = (1.0 - p1).reshape(-1, 1)
        return np.hstack([p0, p1])

    def predict(self, X, threshold=0.85):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)


class LightGBMRandomForest:
    """
    Random Forest ensemble trained via LightGBM's native bagging engine.
    Uses random feature sub-sampling and balanced class weighting.
    """
    def __init__(self, n_estimators=100, max_depth=10, random_state=42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.booster = None

    def fit(self, X, y):
        dataset = lgb.Dataset(X, label=y, free_raw_data=False)
        params = {
            'objective': 'binary',
            'boosting': 'rf',
            'is_unbalance': True,
            'max_depth': self.max_depth,
            'bagging_fraction': 0.8,
            'bagging_freq': 1,
            'feature_fraction': 0.8,
            'seed': self.random_state,
            'verbose': -1,
            'num_threads': -1
        }
        self.booster = lgb.train(params, dataset, num_boost_round=self.n_estimators)
        return self

    def predict_proba(self, X):
        p1 = self.booster.predict(X).reshape(-1, 1)
        p0 = (1.0 - p1).reshape(-1, 1)
        return np.hstack([p0, p1])

    def predict(self, X, threshold=0.5):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)


class LightGBMGradientBoosting:
    """
    State-of-the-art Gradient Boosted Decision Tree (GBDT) with cost-sensitive
    loss for handling severe imbalanced financial fraud data.
    """
    def __init__(self, n_estimators=120, learning_rate=0.08, num_leaves=31, random_state=42):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.num_leaves = num_leaves
        self.random_state = random_state
        self.booster = None

    def fit(self, X, y):
        dataset = lgb.Dataset(X, label=y, free_raw_data=False)
        params = {
            'objective': 'binary',
            'boosting': 'gbdt',
            'is_unbalance': True,
            'learning_rate': self.learning_rate,
            'num_leaves': self.num_leaves,
            'seed': self.random_state,
            'verbose': -1,
            'num_threads': -1
        }
        self.booster = lgb.train(params, dataset, num_boost_round=self.n_estimators)
        return self

    def predict_proba(self, X):
        p1 = self.booster.predict(X).reshape(-1, 1)
        p0 = (1.0 - p1).reshape(-1, 1)
        return np.hstack([p0, p1])

    def predict(self, X, threshold=0.5):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)


def train_and_evaluate_all():
    print("=" * 68)
    print("CODE CORTEX 3.0 — FINANCIAL FRAUD DETECTION MODEL TRAINING")
    print("=" * 68)

    # 1. Load and Preprocess Data
    preprocessor = FraudDataPreprocessor(data_path="data/creditcard.csv", random_state=42)
    X_train, X_test, y_train, y_test, prep = preprocessor.prepare_data(test_size=0.2)

    print(f"\n[Dataset] Features: {X_train.shape[1]} | Train rows: {len(X_train):,} | Test rows: {len(X_test):,}")

    # 2. Define ML Models
    models = {
        "Logistic Regression": BalancedLogisticRegression(
            lr=0.1,
            n_iters=1000,
            l2_reg=0.005,
            random_state=42
        ),
        "Random Forest": LightGBMRandomForest(
            n_estimators=100,
            max_depth=10,
            random_state=42
        ),
        "Gradient Boosting": LightGBMGradientBoosting(
            n_estimators=120,
            learning_rate=0.08,
            num_leaves=31,
            random_state=42
        )
    }

    results = []
    trained_models = {}

    # 3. Train each model
    for name, model in models.items():
        print(f"\n>>> Training {name}...")
        start_time = time.time()
        model.fit(X_train, y_train)
        duration = round(time.time() - start_time, 2)
        print(f"    Finished training in {duration}s")

        # Predictions on Test set
        y_pred = model.predict(X_test)
        y_probs = model.predict_proba(X_test)[:, 1]

        metrics = compute_metrics(y_test, y_pred, y_probs, model_name=name)
        metrics["training_time_seconds"] = duration
        results.append(metrics)
        trained_models[name] = model

        print(f"    Precision: {metrics['precision']:.4f} | Recall: {metrics['recall']:.4f} | "
              f"F1: {metrics['f1_score']:.4f} | PR-AUC: {metrics['pr_auc']:.4f} | ROC-AUC: {metrics['roc_auc']:.4f}")

    # 4. Generate Visualizations
    print("\n[Visualizations] Rendering evaluation plots...")
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("models", exist_ok=True)

    plot_roc_curve(trained_models, X_test, y_test, save_path="outputs/roc_curve.png")
    plot_pr_curve(trained_models, X_test, y_test, save_path="outputs/pr_curve.png")
    plot_model_comparison(results, save_path="outputs/model_comparison.png")

    # 5. Model Selection
    print("\n" + "=" * 68)
    print("MODEL SELECTION BENCHMARK")
    print("=" * 68)

    # Sort by F1-Score then PR-AUC
    sorted_results = sorted(results, key=lambda x: (x["f1_score"], x["pr_auc"]), reverse=True)
    best_result = sorted_results[0]
    best_model_name = best_result["model_name"]
    best_model = trained_models[best_model_name]

    print(f"\nWINNING MODEL: {best_model_name}")
    print(f"  - Fraud Recall:  {best_result['recall'] * 100:.2f}% (Frauds caught)")
    print(f"  - Precision:     {best_result['precision'] * 100:.2f}% (Precision on alarms)")
    print(f"  - F1-Score:      {best_result['f1_score']:.4f}")
    print(f"  - PR-AUC:        {best_result['pr_auc']:.4f}")
    print(f"  - ROC-AUC:       {best_result['roc_auc']:.4f}")

    # Save Confusion Matrix for the winning model
    best_pred = best_model.predict(X_test)
    plot_confusion_matrix(y_test, best_pred, model_name=best_model_name, save_path="outputs/confusion_matrix.png")

    # 6. Save Artifacts & Bundle
    bundle = {
        "model": best_model,
        "model_name": best_model_name,
        "scaler_amount": prep.scaler_amount,
        "feature_columns": prep.feature_columns,
        "metrics": best_result,
        "comparison": results
    }

    joblib_path = "models/fraud_model.joblib"
    joblib.dump(bundle, joblib_path)
    print(f"\n[Export] Model bundle saved to '{joblib_path}'")

    metrics_json_path = "models/metrics.json"
    with open(metrics_json_path, "w") as f:
        json.dump({
            "selected_model": best_result,
            "all_models": results,
            "feature_columns": prep.feature_columns
        }, f, indent=2)
    print(f"[Export] Metrics saved to '{metrics_json_path}'")

    # 7. Geospatial Hotspot & Transit Velocity Machine Learning
    print("\n[Geospatial ML] Computing international card transfer hotspots & velocity anomalies...")
    hotspot_detector = GeospatialHotspotDetector(data_path="data/creditcard.csv", random_state=42)
    hotspot_detector.generate_and_export()

    print("\n" + "=" * 68)
    print("ALL MODELS TRAINED, BENCHMARKED, AND SERIALIZED SUCCESSFULLY!")
    print("=" * 68)
    return bundle


if __name__ == "__main__":
    train_and_evaluate_all()
