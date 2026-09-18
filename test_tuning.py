import lightgbm as lgb
import numpy as np
from src.data_preprocessing import FraudDataPreprocessor
from src.evaluate import compute_metrics, calculate_pr_auc, calculate_roc_auc

prep = FraudDataPreprocessor()
X_train, X_test, y_train, y_test, _ = prep.prepare_data()

# Test LightGBM GBDT with moderate scale_pos_weight or standard unweighted with threshold
for spw in [1.0, 5.0, 20.0, 100.0]:
    ds = lgb.Dataset(X_train, label=y_train, free_raw_data=False)
    params = {
        'objective': 'binary',
        'boosting': 'gbdt',
        'scale_pos_weight': spw,
        'learning_rate': 0.05,
        'num_leaves': 31,
        'seed': 42,
        'verbose': -1,
        'num_threads': -1
    }
    bst = lgb.train(params, ds, num_boost_round=120)
    probs = bst.predict(X_test)
    roc_auc, _, _ = calculate_roc_auc(y_test, probs)
    pr_auc, _, _ = calculate_pr_auc(y_test, probs)
    
    # Best threshold by F1
    best_f1 = 0
    best_thresh = 0.5
    best_prec = 0
    best_rec = 0
    for thresh in np.linspace(0.1, 0.9, 17):
        preds = (probs >= thresh).astype(int)
        tp = np.sum((y_test == 1) & (preds == 1))
        fp = np.sum((y_test == 0) & (preds == 1))
        fn = np.sum((y_test == 1) & (preds == 0))
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh
            best_prec = prec
            best_rec = rec
            
    print(f"spw={spw:5.1f} | ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f} | Best Thresh: {best_thresh:.2f} -> Prec: {best_prec:.4f}, Rec: {best_rec:.4f}, F1: {best_f1:.4f}")
