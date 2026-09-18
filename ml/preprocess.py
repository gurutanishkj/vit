"""
Data Preprocessing Pipeline for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track

1. Clean Data: Drop duplicate transactions to prevent data leakage.
2. Feature Scaling: Outlier-resistant RobustScaler on transaction Amount.
3. Feature Engineering: 24-hour cyclical sine/cosine representation on Time.
4. Stratified Split: Guarantee train and test sets preserve the exact fraud ratio (0.17%).
"""

import os
import numpy as np
import pandas as pd


class RobustScalerNP:
    """
    Robust Scaler using Median and Interquartile Range (IQR = Q75 - Q25).
    Immune to extreme monetary outliers ($0 to $25,000+).
    """
    def __init__(self):
        self.median = None
        self.iqr = None

    def fit(self, X):
        X = np.asarray(X).reshape(-1, 1)
        self.median = float(np.median(X, axis=0)[0])
        q25 = float(np.percentile(X, 25, axis=0)[0])
        q75 = float(np.percentile(X, 75, axis=0)[0])
        self.iqr = q75 - q25
        if self.iqr == 0:
            self.iqr = 1.0
        return self

    def transform(self, X):
        X = np.asarray(X).reshape(-1, 1)
        return (X - self.median) / self.iqr

    def fit_transform(self, X):
        return self.fit(X).transform(X)


class FraudPreprocessor:
    """
    Handles complete data lifecycle for FraudShield.
    """
    def __init__(self, data_path="data/dataset.csv", random_state=42):
        self.data_path = data_path
        self.random_state = random_state
        self.scaler_amount = RobustScalerNP()
        self.feature_columns = None

    def load_and_clean(self):
        if not os.path.exists(self.data_path):
            # Fallback to creditcard.csv if needed
            alt_path = "data/creditcard.csv"
            if os.path.exists(alt_path):
                self.data_path = alt_path
            else:
                raise FileNotFoundError(f"Dataset not found at {self.data_path}")

        print(f"[ML-Preprocess] Loading dataset from '{self.data_path}'...")
        df = pd.read_csv(self.data_path)
        initial_len = len(df)
        df = df.drop_duplicates().reset_index(drop=True)
        dedup_len = len(df)
        print(f"[ML-Preprocess] Removed {initial_len - dedup_len} duplicate transactions. Remaining: {dedup_len:,}")
        return df

    def engineer_features(self, df, is_training=False):
        df = df.copy()

        # 24-hour cycle periodicity (86,400s in a day)
        seconds_in_day = 86400
        time_vals = df['Time'].values
        df['time_sin'] = np.sin(2 * np.pi * (time_vals % seconds_in_day) / seconds_in_day)
        df['time_cos'] = np.cos(2 * np.pi * (time_vals % seconds_in_day) / seconds_in_day)

        # Scale Amount
        amounts = df['Amount'].values.reshape(-1, 1)
        if is_training:
            df['scaled_amount'] = self.scaler_amount.fit_transform(amounts)
        else:
            df['scaled_amount'] = self.scaler_amount.transform(amounts)

        feature_cols = [f"V{i}" for i in range(1, 29)] + ['scaled_amount', 'time_sin', 'time_cos']
        self.feature_columns = feature_cols
        return df, feature_cols

    def stratified_split(self, df, test_size=0.2):
        np.random.seed(self.random_state)
        fraud_idx = np.array(df[df['Class'] == 1].index, copy=True)
        normal_idx = np.array(df[df['Class'] == 0].index, copy=True)

        np.random.shuffle(fraud_idx)
        np.random.shuffle(normal_idx)

        n_fraud_test = int(len(fraud_idx) * test_size)
        n_normal_test = int(len(normal_idx) * test_size)

        test_idx = np.concatenate([fraud_idx[:n_fraud_test], normal_idx[:n_normal_test]])
        train_idx = np.concatenate([fraud_idx[n_fraud_test:], normal_idx[n_normal_test:]])

        np.random.shuffle(test_idx)
        np.random.shuffle(train_idx)

        train_df = df.iloc[train_idx].reset_index(drop=True)
        test_df = df.iloc[test_idx].reset_index(drop=True)
        return train_df, test_df

    def prepare_data(self, test_size=0.2):
        df = self.load_and_clean()
        train_df, test_df = self.stratified_split(df, test_size=test_size)

        # Fit feature pipeline on Training fold only
        train_eng, feature_cols = self.engineer_features(train_df, is_training=True)
        # Transform Test fold
        test_eng, _ = self.engineer_features(test_df, is_training=False)

        X_train = train_eng[feature_cols].values
        y_train = train_eng['Class'].values
        X_test = test_eng[feature_cols].values
        y_test = test_eng['Class'].values

        print(f"[ML-Preprocess] Training samples: {len(X_train):,} (Frauds: {int(y_train.sum())} / {y_train.mean()*100:.3f}%)")
        print(f"[ML-Preprocess] Testing samples:  {len(X_test):,} (Frauds: {int(y_test.sum())} / {y_test.mean()*100:.3f}%)")

        return X_train, X_test, y_train, y_test, self
