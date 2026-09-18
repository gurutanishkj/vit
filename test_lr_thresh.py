import numpy as np
from src.data_preprocessing import FraudDataPreprocessor
from src.train import BalancedLogisticRegression
from src.evaluate import calculate_pr_auc, calculate_roc_auc

prep = FraudDataPreprocessor()
X_train, X_test, y_train, y_test, _ = prep.prepare_data()

model = BalancedLogisticRegression(lr=0.1, n_iters=1000, l2_reg=0.005, random_state=42)
model.fit(X_train, y_train)

probs = model.predict_proba(X_test)[:, 1]
roc_auc, _, _ = calculate_roc_auc(y_test, probs)
pr_auc, _, _ = calculate_pr_auc(y_test, probs)

print(f"ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f}")

for t in [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.92, 0.95, 0.97, 0.98, 0.99]:
    preds = (probs >= t).astype(int)
    tp = np.sum((y_test == 1) & (preds == 1))
    fp = np.sum((y_test == 0) & (preds == 1))
    fn = np.sum((y_test == 1) & (preds == 0))
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0
    print(f"Thresh {t:.2f} -> Prec: {prec:.4f}, Rec: {rec:.4f} ({tp}/{tp+fn}), F1: {f1:.4f}, FP: {fp}")
