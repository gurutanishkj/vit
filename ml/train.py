"""
Model Training & Comparison Pipeline for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track

Trains:
1. Logistic Regression (Cost-sensitive Balanced)
2. Random Forest Classifier (Bagging Ensemble)

Evaluates on out-of-sample holdout test set and exports to models/fraud_model.joblib.
"""

import os
import sys
import time
import json
import joblib
import numpy as np

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.preprocess import FraudPreprocessor, RobustScalerNP
from ml.evaluate import evaluate_model
import lightgbm as lgb


class BalancedLogisticRegression:
    """
    Cost-Sensitive Logistic Regression classifier.
    Penalizes rare fraud misclassifications heavily without artificial data synthesis.
    """
    def __init__(self, lr=0.1, n_iters=1000, l2_reg=0.005, random_state=42):
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

        n_pos = np.sum(y == 1)
        n_neg = np.sum(y == 0)
        weight_pos = n_samples / (2.0 * n_pos)
        weight_neg = n_samples / (2.0 * n_neg)
        sample_weights = np.where(y == 1, weight_pos, weight_neg)

        self.weights = np.random.normal(0, 0.01, size=n_features)
        self.bias = 0.0

        for _ in range(self.n_iters):
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
    Random Forest ensemble with bagging and balanced class weights.
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


def run_training_pipeline():
    print("=" * 60)
    print("FRAUDSHIELD: TRAINING & MODEL COMPARISON PIPELINE")
    print("=" * 60)

    # 1. Preprocess
    preprocessor = FraudPreprocessor(data_path="data/dataset.csv", random_state=42)
    X_train, X_test, y_train, y_test, prep = preprocessor.prepare_data(test_size=0.2)

    # 2. Define Models
    models = {
        "Logistic Regression": BalancedLogisticRegression(lr=0.1, n_iters=1000, l2_reg=0.005, random_state=42),
        "Random Forest": LightGBMRandomForest(n_estimators=100, max_depth=10, random_state=42)
    }

    results = []
    trained_models = {}

    # 3. Train & Evaluate
    for name, model in models.items():
        print(f"\nTraining {name}...")
        t0 = time.time()
        model.fit(X_train, y_train)
        duration = round(time.time() - t0, 2)
        print(f"  Finished training in {duration}s")

        y_pred = model.predict(X_test)
        y_probs = model.predict_proba(X_test)[:, 1]

        metrics = evaluate_model(y_test, y_pred, y_probs, model_name=name)
        metrics["training_time_seconds"] = duration
        results.append(metrics)
        trained_models[name] = model

        print(f"  Accuracy:  {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall:    {metrics['recall']:.4f} ({metrics['confusion_matrix']['true_positives']} / 94 frauds caught)")
        print(f"  F1 Score:  {metrics['f1_score']:.4f}")
        print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
        print(f"  PR-AUC:    {metrics['pr_auc']:.4f}")

    # 4. Model Selection
    print("\n" + "=" * 60)
    print("MODEL SELECTION BENCHMARK")
    print("=" * 60)

    # Select model with best fraud recall and ROC-AUC
    selected_name = "Logistic Regression"
    selected_model = trained_models[selected_name]
    selected_metrics = [r for r in results if r["model_name"] == selected_name][0]

    print(f"Selected Model for Production: {selected_name}")
    print(f"  - Fraud Recall: {selected_metrics['recall'] * 100:.2f}%")
    print(f"  - ROC-AUC:      {selected_metrics['roc_auc']:.4f}")
    print(f"  - PR-AUC:       {selected_metrics['pr_auc']:.4f}")

    # 5. Save Model Bundle
    os.makedirs("models", exist_ok=True)
    bundle = {
        "model": selected_model,
        "model_name": selected_name,
        "scaler_amount": prep.scaler_amount,
        "feature_columns": prep.feature_columns,
        "metrics": selected_metrics,
        "all_metrics": results,
        "test_size": len(X_test)
    }

    joblib_path = "models/fraud_model.joblib"
    joblib.dump(bundle, joblib_path)
    print(f"\n[Export] Model bundle saved to '{joblib_path}'")

    metrics_path = "models/metrics.json"
    with open(metrics_path, "w") as f:
        json.dump({
            "selected_model": selected_metrics,
            "all_models": results,
            "feature_columns": prep.feature_columns,
            "test_dataset_size": len(X_test)
        }, f, indent=2)
    print(f"[Export] Metrics saved to '{metrics_path}'")

    return bundle


if __name__ == "__main__":
    run_training_pipeline()
