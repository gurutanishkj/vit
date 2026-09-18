"""
Model Evaluation Metrics for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track

Computes:
- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC
- PR-AUC
- Confusion Matrix
"""

import numpy as np


def compute_roc_auc(y_true, y_probs):
    y_true = np.asarray(y_true)
    y_probs = np.asarray(y_probs)

    desc_order = np.argsort(-y_probs)
    y_true_sorted = y_true[desc_order]

    tps = np.cumsum(y_true_sorted == 1)
    fps = np.cumsum(y_true_sorted == 0)

    total_pos = tps[-1]
    total_neg = fps[-1]

    if total_pos == 0 or total_neg == 0:
        return 0.5

    tpr = np.concatenate([[0], tps / total_pos])
    fpr = np.concatenate([[0], fps / total_neg])

    return float(np.trapezoid(tpr, fpr))


def compute_pr_auc(y_true, y_probs):
    y_true = np.asarray(y_true)
    y_probs = np.asarray(y_probs)

    desc_order = np.argsort(-y_probs)
    y_true_sorted = y_true[desc_order]

    tps = np.cumsum(y_true_sorted == 1)
    fps = np.cumsum(y_true_sorted == 0)
    total_pos = tps[-1]

    if total_pos == 0:
        return 0.0

    precisions = tps / (tps + fps)
    recalls = tps / total_pos

    recalls = np.concatenate([[0.0], recalls])
    precisions = np.concatenate([[1.0], precisions])

    return float(np.trapezoid(precisions, recalls))


def evaluate_model(y_true, y_pred, y_probs=None, model_name="Model"):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))

    total = len(y_true)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1_score = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    roc_auc = compute_roc_auc(y_true, y_probs) if y_probs is not None else None
    pr_auc = compute_pr_auc(y_true, y_probs) if y_probs is not None else None

    return {
        "model_name": model_name,
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1_score), 4),
        "roc_auc": round(float(roc_auc), 4) if roc_auc is not None else None,
        "pr_auc": round(float(pr_auc), 4) if pr_auc is not None else None,
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp
        }
    }
