"""
Model definitions for Financial Fraud Detection.
Code Cortex 3.0 Hackathon - Finance Track
"""

import numpy as np
import lightgbm as lgb


class BalancedLogisticRegression:
    """
    Pure NumPy implementation of Cost-Sensitive Logistic Regression.
    Weights each class inversely proportional to class frequencies to penalize
    fraud misclassifications heavily without artificial data fabrication.
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
