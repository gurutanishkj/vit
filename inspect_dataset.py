import sys
import json
import time
import pandas as pd
import numpy as np

print("Step 1: Loading CSV...", flush=True)
t0 = time.time()
csv_path = "data/creditcard.csv"
df = pd.read_csv(csv_path)
print(f"Loaded in {time.time() - t0:.2f}s", flush=True)

rows, cols = df.shape
columns = list(df.columns)
print(f"Dataset shape: {rows} rows, {cols} columns", flush=True)

print("Step 2: Checking missing values...", flush=True)
missing = df.isnull().sum()
missing_dict = {col: int(val) for col, val in missing.items() if val > 0}
total_missing = int(missing.sum())

print("Step 3: Checking duplicates...", flush=True)
# Sample or fast duplicate check
num_duplicates = int(df.duplicated().sum())
print(f"Found {num_duplicates} duplicates", flush=True)

print("Step 4: Target column inspection...", flush=True)
target_col = "Class" if "Class" in df.columns else None
if not target_col:
    for c in df.columns:
        if c.lower() in ["class", "fraud", "isfraud", "target"]:
            target_col = c
            break

class_counts = df[target_col].value_counts().to_dict()
normal_count = int(class_counts.get(0, 0))
fraud_count = int(class_counts.get(1, 0))
total_count = len(df)
normal_pct = round((normal_count / total_count) * 100, 4)
fraud_pct = round((fraud_count / total_count) * 100, 4)

print(f"Target column: {target_col}", flush=True)
print(f"Normal (0): {normal_count} ({normal_pct}%)", flush=True)
print(f"Fraud (1): {fraud_count} ({fraud_pct}%)", flush=True)

print("Step 5: Inspecting Amount and Time stats...", flush=True)
stats = {
    "rows": rows,
    "cols": cols,
    "columns": columns,
    "dtypes": {str(k): str(v) for k, v in df.dtypes.items()},
    "missing_values": missing_dict,
    "total_missing": total_missing,
    "duplicates": num_duplicates,
    "target_column": target_col,
    "class_distribution": {
        "0 (Normal)": normal_count,
        "1 (Fraud)": fraud_count
    },
    "class_distribution_pct": {
        "0 (Normal)": normal_pct,
        "1 (Fraud)": fraud_pct
    },
    "amount_stats": {
        "min": float(df["Amount"].min()),
        "max": float(df["Amount"].max()),
        "mean": round(float(df["Amount"].mean()), 2),
        "median": round(float(df["Amount"].median()), 2),
        "std": round(float(df["Amount"].std()), 2)
    },
    "fraud_amount_stats": {
        "min": float(df[df[target_col] == 1]["Amount"].min()),
        "max": float(df[df[target_col] == 1]["Amount"].max()),
        "mean": round(float(df[df[target_col] == 1]["Amount"].mean()), 2),
        "median": round(float(df[df[target_col] == 1]["Amount"].median()), 2)
    },
    "normal_amount_stats": {
        "min": float(df[df[target_col] == 0]["Amount"].min()),
        "max": float(df[df[target_col] == 0]["Amount"].max()),
        "mean": round(float(df[df[target_col] == 0]["Amount"].mean()), 2),
        "median": round(float(df[df[target_col] == 0]["Amount"].median()), 2)
    }
}

with open("dataset_inspection.json", "w") as f:
    json.dump(stats, f, indent=2)

print("ALL_DONE_SUCCESSFULLY", flush=True)
