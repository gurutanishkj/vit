"""
Model Evaluation and Metric Visualizations for Fraud Detection.
Code Cortex 3.0 Hackathon - Finance Track

Pure, high-precision metric calculations in NumPy and Matplotlib.
Resilient to enterprise DLL sandboxing, 100% reproducible.
"""

import os
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Headless rendering for backend / server environments
import matplotlib.pyplot as plt


def calculate_roc_auc(y_true, y_probs):
    """
    Computes Receiver Operating Characteristic (ROC) curve and Area Under Curve (AUC)
    using trapezoidal numerical integration.
    """
    y_true = np.asarray(y_true)
    y_probs = np.asarray(y_probs)

    # Sort descending by probability
    desc_order = np.argsort(-y_probs)
    y_true_sorted = y_true[desc_order]

    # Cumulative True Positives and False Positives
    tps = np.cumsum(y_true_sorted == 1)
    fps = np.cumsum(y_true_sorted == 0)

    total_pos = tps[-1]
    total_neg = fps[-1]

    if total_pos == 0 or total_neg == 0:
        return 0.5, np.array([0, 1]), np.array([0, 1])

    tpr = np.concatenate([[0], tps / total_pos])
    fpr = np.concatenate([[0], fps / total_neg])

    # Trapezoidal integration
    auc = np.trapezoid(tpr, fpr)
    return float(auc), fpr, tpr


def calculate_pr_auc(y_true, y_probs):
    """
    Computes Precision-Recall curve and PR-AUC (Average Precision score).
    In imbalanced fraud detection (0.17% positive rate), PR-AUC is the gold standard.
    """
    y_true = np.asarray(y_true)
    y_probs = np.asarray(y_probs)

    desc_order = np.argsort(-y_probs)
    y_true_sorted = y_true[desc_order]

    tps = np.cumsum(y_true_sorted == 1)
    fps = np.cumsum(y_true_sorted == 0)
    total_pos = tps[-1]

    if total_pos == 0:
        return 0.0, np.array([0, 1]), np.array([0, 0])

    precisions = tps / (tps + fps)
    recalls = tps / total_pos

    # Prepend baseline recall=0, precision=1
    recalls = np.concatenate([[0.0], recalls])
    precisions = np.concatenate([[1.0], precisions])

    # Average Precision via trapezoidal integration over recalls
    pr_auc = np.trapezoid(precisions, recalls)
    return float(pr_auc), recalls, precisions


def compute_metrics(y_true, y_pred, y_probs=None, model_name="Model"):
    """
    Computes complete fraud detection evaluation metrics:
    Accuracy, Precision, Recall, F1-Score, ROC-AUC, PR-AUC, and Confusion Matrix.
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))

    total = len(y_true)
    acc = (tp + tn) / total if total > 0 else 0.0
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

    roc_auc_val = None
    pr_auc_val = None

    if y_probs is not None:
        roc_auc_val, _, _ = calculate_roc_auc(y_true, y_probs)
        pr_auc_val, _, _ = calculate_pr_auc(y_true, y_probs)

    metrics = {
        "model_name": model_name,
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc_val), 4) if roc_auc_val is not None else None,
        "pr_auc": round(float(pr_auc_val), 4) if pr_auc_val is not None else None,
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp
        }
    }
    return metrics


def plot_confusion_matrix(y_true, y_pred, model_name="Best Model", save_path="outputs/confusion_matrix.png"):
    """
    Renders an informative, high-resolution confusion matrix heatmap.
    """
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))

    cm = np.array([[tn, fp], [fn, tp]])

    fig, ax = plt.subplots(figsize=(7, 6))
    cax = ax.matshow(cm, cmap=plt.cm.Blues, alpha=0.85)

    for i in range(2):
        for j in range(2):
            count = cm[i, j]
            label_text = ""
            if i == 0 and j == 0:
                label_text = f"TN: {count:,}\n(Legit Correct)"
            elif i == 0 and j == 1:
                label_text = f"FP: {count:,}\n(False Alarm)"
            elif i == 1 and j == 0:
                label_text = f"FN: {count:,}\n(Missed Fraud!)"
            elif i == 1 and j == 1:
                label_text = f"TP: {count:,}\n(Fraud Caught!)"
            
            color = "white" if count > (cm.max() / 2) else "black"
            ax.text(j, i, label_text, va='center', ha='center', fontsize=12, fontweight='bold', color=color)

    fig.colorbar(cax)
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Predicted Legit", "Predicted Fraud"], fontsize=11, fontweight='semibold')
    ax.set_yticklabels(["Actual Legit", "Actual Fraud"], fontsize=11, fontweight='semibold')
    plt.title(f"Confusion Matrix — {model_name}\n(Prioritizing High Recall & Low False Negatives)", fontsize=13, fontweight='bold', pad=20)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"[Evaluation] Saved confusion matrix to {save_path}")


def plot_roc_curve(models_dict, X_test, y_test, save_path="outputs/roc_curve.png"):
    """
    Plots the ROC curves for all models on one canvas.
    """
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.figure(figsize=(8, 6))
    colors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b']

    for idx, (name, model) in enumerate(models_dict.items()):
        probs = model.predict_proba(X_test)[:, 1]
        score, fpr, tpr = calculate_roc_auc(y_test, probs)
        plt.plot(fpr, tpr, label=f"{name} (ROC-AUC = {score:.4f})", color=colors[idx % len(colors)], linewidth=2.5)

    plt.plot([0, 1], [0, 1], 'k--', alpha=0.5, label="Random Guess (AUC = 0.5000)")
    plt.title("ROC Curves Comparison — Fraud Detection", fontsize=13, fontweight='bold')
    plt.xlabel("False Positive Rate (FPR)", fontsize=11)
    plt.ylabel("True Positive Rate / Recall (TPR)", fontsize=11)
    plt.grid(True, linestyle="--", alpha=0.5)
    plt.legend(loc="lower right", fontsize=10, frameon=True)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"[Evaluation] Saved ROC curves to {save_path}")


def plot_pr_curve(models_dict, X_test, y_test, save_path="outputs/pr_curve.png"):
    """
    Plots the Precision-Recall curves.
    """
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.figure(figsize=(8, 6))
    colors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b']
    baseline_rate = float(np.sum(y_test == 1) / len(y_test))

    for idx, (name, model) in enumerate(models_dict.items()):
        probs = model.predict_proba(X_test)[:, 1]
        score, recalls, precisions = calculate_pr_auc(y_test, probs)
        # Subsample points if too dense for smooth plotting
        if len(recalls) > 2000:
            step = len(recalls) // 1000
            recalls = recalls[::step]
            precisions = precisions[::step]
        plt.plot(recalls, precisions, label=f"{name} (PR-AUC = {score:.4f})", color=colors[idx % len(colors)], linewidth=2.5)

    plt.axhline(y=baseline_rate, color='red', linestyle='--', alpha=0.6, label=f"Baseline Rate ({baseline_rate:.4f})")
    plt.title("Precision-Recall Curves — Primary Fraud Metric", fontsize=13, fontweight='bold')
    plt.xlabel("Recall (Fraction of Frauds Caught)", fontsize=11)
    plt.ylabel("Precision (Accuracy of Fraud Flags)", fontsize=11)
    plt.grid(True, linestyle="--", alpha=0.5)
    plt.legend(loc="lower left", fontsize=10, frameon=True)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"[Evaluation] Saved PR curves to {save_path}")


def plot_model_comparison(results_list, save_path="outputs/model_comparison.png"):
    """
    Renders grouped comparison bar chart for all models.
    """
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    models = [r["model_name"] for r in results_list]
    metrics_names = ["Precision", "Recall", "F1 Score", "ROC-AUC", "PR-AUC"]
    
    data = {
        "Precision": [r["precision"] for r in results_list],
        "Recall": [r["recall"] for r in results_list],
        "F1 Score": [r["f1_score"] for r in results_list],
        "ROC-AUC": [r["roc_auc"] for r in results_list],
        "PR-AUC": [r["pr_auc"] for r in results_list]
    }

    x = np.arange(len(models))
    width = 0.15

    plt.figure(figsize=(11, 6))
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

    for i, metric in enumerate(metrics_names):
        offset = (i - 2) * width
        plt.bar(x + offset, data[metric], width, label=metric, color=colors[i], alpha=0.9)

    plt.xlabel("Trained Machine Learning Models", fontsize=12, fontweight='bold')
    plt.ylabel("Score (0.0 to 1.0)", fontsize=12, fontweight='bold')
    plt.title("Code Cortex 3.0 — Model Performance Benchmark", fontsize=14, fontweight='bold', pad=15)
    plt.xticks(x, models, fontsize=11, fontweight='semibold')
    plt.ylim(0, 1.1)
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.legend(loc='upper right', frameon=True, fontsize=10)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"[Evaluation] Saved model comparison chart to {save_path}")
