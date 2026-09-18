"""
Data Preprocessing Module for Financial Transaction Fraud Detection.
Code Cortex 3.0 Hackathon - Finance Track

Pure, high-performance vectorized implementation using NumPy and Pandas.
Zero external blocked DLL dependencies, 100% resilient to enterprise security policies.

Key Concepts:
1. Preventing Data Leakage: Scalers are fitted exclusively on the training split,
   then used to transform the unseen test split.
2. Stratification: Ensures both training (80%) and testing (20%) splits maintain
   the exact same 0.1727% fraud ratio.
3. Robust Scaling: Scales transaction amounts by subtracting the median and dividing
   by the Interquartile Range (IQR = Q75 - Q25), providing stability against extreme outliers.
4. Cyclical Time Feature Engineering: Converts linear seconds into daily periodic
   sine and cosine components (24h period = 86,400s).
"""

import os
import numpy as np
import pandas as pd


class RobustScalerNP:
    """
    Robust Scaler implementation using Median and Interquartile Range (IQR).
    Resilient to large financial outliers (e.g. $25,000 transactions).
    """
    def __init__(self):
        self.median = None
        self.iqr = None

    def fit(self, X):
        X = np.asarray(X).reshape(-1, 1)
        self.median = np.median(X, axis=0)
        q25 = np.percentile(X, 25, axis=0)
        q75 = np.percentile(X, 75, axis=0)
        self.iqr = q75 - q25
        # Prevent division by zero if IQR is 0
        self.iqr[self.iqr == 0] = 1.0
        return self

    def transform(self, X):
        X = np.asarray(X).reshape(-1, 1)
        return (X - self.median) / self.iqr

    def fit_transform(self, X):
        return self.fit(X).transform(X)


class FraudDataPreprocessor:
    """
    End-to-end data loading, deduplication, feature engineering,
    and stratified train/test splitting for credit card fraud detection.
    """
    def __init__(self, data_path="data/creditcard.csv", random_state=42):
        self.data_path = data_path
        self.random_state = random_state
        self.scaler_amount = RobustScalerNP()
        self.feature_columns = None

    def load_and_clean(self):
        """Loads dataset and eliminates duplicate transactions."""
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")

        print(f"[Preprocessing] Loading dataset from '{self.data_path}'...")
        df = pd.read_csv(self.data_path)
        initial_count = len(df)

        df = df.drop_duplicates().reset_index(drop=True)
        dedup_count = len(df)
        print(f"[Preprocessing] Removed {initial_count - dedup_count} duplicates. Valid transactions: {dedup_count:,}")
        return df

    def engineer_features(self, df, is_training=False):
        """
        Creates cyclical time indicators and scales the transaction amount.
        """
        df = df.copy()

        # 24-hour cycle periodicity (86,400 seconds in a day)
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
        """
        Performs stratified train/test split ensuring proportional representation
        of fraud (Class 1) and legitimate (Class 0) transactions in both folds.
        """
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
        """
        Orchestrates loading, stratified splitting, and feature transformation.
        """
        df = self.load_and_clean()

        train_df, test_df = self.stratified_split(df, test_size=test_size)

        # Fit feature pipeline on Training set ONLY
        train_eng, feature_cols = self.engineer_features(train_df, is_training=True)
        # Transform Test set with trained parameters
        test_eng, _ = self.engineer_features(test_df, is_training=False)

        X_train = train_eng[feature_cols].values
        y_train = train_eng['Class'].values
        X_test = test_eng[feature_cols].values
        y_test = test_eng['Class'].values

        print(f"[Preprocessing] Train size: {len(X_train):,} samples (Frauds: {int(y_train.sum())} / {y_train.mean()*100:.3f}%)")
        print(f"[Preprocessing] Test size:  {len(X_test):,} samples (Frauds: {int(y_test.sum())} / {y_test.mean()*100:.3f}%)")

        return X_train, X_test, y_train, y_test, self


if __name__ == "__main__":
    prep = FraudDataPreprocessor()
    X_train, X_test, y_train, y_test, p = prep.prepare_data()
    print("[Preprocessing] Data preprocessor successfully tested!")
