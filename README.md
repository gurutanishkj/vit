# FraudShield — Financial Transaction Fraud Detection System

> **Code Cortex 3.0 Hackathon | Track: Finance | VIT Vellore**  
> An end-to-end Financial Fraud Detection Web Application powered by a genuine Machine Learning model, FastAPI backend, SQLite + JWT authentication, and a modern Warm Cream & Orange React dashboard.

---

## 🎯 Project Highlights

1. **Genuinely Trained Machine Learning Model**:
   - Trained on 283,726 deduplicated transactions from the provided financial dataset.
   - Cost-Sensitive Balanced Logistic Regression achieving **85.11% Recall** on unseen holdout test transactions (caught 80 out of 94 fraudulent transactions).
   - **0.9808 ROC-AUC** and **0.6607 PR-AUC**.
   - **Zero external AI APIs** (No OpenAI, ChatGPT, or Gemini) for fraud prediction.

2. **Secure Authentication & Persistence**:
   - SQLite database (`backend/fraudshield.db`) using SQLAlchemy ORM.
   - Secure PBKDF2-HMAC-SHA256 salted password hashing (never plain-text).
   - JSON Web Tokens (JWT) protecting the `/predict` API and dashboard routes.

3. **Warm Cream & Orange Fintech React UI**:
   - Built with React, Vite, and Tailwind CSS.
   - Professional fintech color palette: Warm Cream (`#fcfaf6`), Light Cream (`#f4ede2`), Orange accents (`#ea580c`), Dark Brown typography (`#1c1917`).
   - Real-time transaction risk scoring with LOW, MEDIUM, HIGH risk levels.
   - 1-Click demo presets for live hackathon judging.
   - Explainable AI feature attribution (Top driving factors e.g. V14, V4, V17).

4. **FraudShield Assistant Chatbot**:
   - Embedded interactive assistant widget.
   - Powered by a local knowledge base (`backend/chatbot_knowledge.json`) with zero external LLM dependencies.
   - Quick prompt chips for instant answers to core fraud concepts (Recall, ROC-AUC, Risk Scores, System Architecture).

5. **Interactive Control Center & Batch Scanner**:
   - Real-time fraud threshold sensitivity slider (10% to 95%) with dynamic risk recalibration.
   - Granular sliders for Amount, 24-hour time cycle, and dominant fraud vectors (V14, V4, V12, V10, V17).
   - Multi-transaction Batch Scanner with summary risk KPIs and CSV audit download.
   - Live Transaction Audit Ledger tracking all evaluations in real-time.
   - Zero-barrier Guest Analyst mode + secure authenticated analyst login.

---

## 📊 Dataset & Model Architecture

- **Total Rows Analyzed:** 284,807 (1,081 duplicates removed -> 283,726 clean transactions).
- **Target Distribution:** 283,347 Legitimate (99.87%) vs 379 Fraudulent (0.13%).
- **Feature Engineering:**
  - `Amount`: Scaled using median and interquartile range (`RobustScaler`) to resist extreme whale transactions ($0 to $25k).
  - `Time`: Transformed to 24-hour periodic periodic cycles using trigonometric $\sin$ and $\cos$ encoding.
  - `V1` – `V28`: Latent principal components preserving confidentiality.
- **Holdout Test Set:** 56,744 unseen transactions (80/20 stratified split).

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
```

### 2. Train the Machine Learning Model (Reproducible)
```bash
python ml/train.py
```
*Generates the serialized model bundle in `models/fraud_model.joblib` and metrics in `models/metrics.json`.*

### 3. Start the Application
You can run the full application using either option:

#### Option A: FastAPI Unified Server (Backend + Built Frontend)
```bash
python backend/main.py
```
Open your browser at:
👉 **`http://127.0.0.1:8000`**

#### Option B: React Vite Dev Server (Hot-Reloading)
In terminal 1:
```bash
python backend/main.py
```
In terminal 2:
```bash
cd frontend
npm run dev
```
Open your browser at:
👉 **`http://localhost:5173`**

---

## 🧪 Automated Testing & Verification

Run the comprehensive end-to-end integration test suite:
```bash
python test_e2e_full.py
```

This verifies:
1. `GET /health` -> System and model health.
2. `POST /auth/register` -> User registration & salted password hashing.
3. `POST /auth/login` -> Credential verification & JWT issuance.
4. `GET /auth/me` -> Token-protected user profile check.
5. `GET /model-info` -> Out-of-sample metrics (Recall: 85.11%, ROC-AUC: 0.9808).
6. `GET /samples` -> 4 demo presets loaded.
7. `POST /predict` (Legitimate) -> `LEGITIMATE`, `LOW RISK`, probability ~3.8%.
8. `POST /predict` (Fraudulent) -> `FRAUD`, `HIGH RISK`, probability ~100%.
9. `POST /chat` -> FraudShield Assistant local knowledge base responses.
10. Frontend Distribution -> React client asset serving.

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Service and model status | No |
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Login and receive JWT access token | No |
| `GET` | `/auth/me` | Fetch authenticated profile | **Yes (Bearer JWT)** |
| `POST` | `/predict` | Predict transaction fraud risk | **Yes (Bearer JWT)** |
| `GET` | `/model-info` | Real model metrics & test dataset size | No |
| `GET` | `/metrics` | Detailed metrics & comparison matrix | No |
| `GET` | `/samples` | Demo transaction presets | No |
| `POST` | `/chat` | FraudShield Assistant knowledge base | No |

---

## 📂 Project Structure

```
vit/
├── backend/
│   ├── main.py                   # FastAPI REST API & routes
│   ├── auth.py                   # PBKDF2 hashing & JWT authentication
│   ├── database.py               # SQLite & SQLAlchemy engine
│   ├── models.py                 # User ORM model
│   ├── prediction.py             # Inference pipeline & feature attribution
│   ├── chatbot_knowledge.json    # Local knowledge base (zero external LLMs)
│   └── fraudshield.db            # SQLite database
├── ml/
│   ├── preprocess.py             # Deduplication, RobustScaler & cyclical time
│   ├── train.py                  # Training pipeline & cost-sensitive models
│   └── evaluate.py               # Metrics, PR-AUC, ROC-AUC calculation
├── models/
│   ├── fraud_model.joblib        # Serialized ML model & scaler bundle
│   └── metrics.json              # Evaluated metrics & confusion matrix
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation & auth status
│   │   │   ├── StatCards.jsx     # 4 authentic dataset KPI cards
│   │   │   ├── TransactionForm.jsx # Transaction form & 1-click presets
│   │   │   ├── ResultCard.jsx    # Risk gauge & explainability
│   │   │   ├── ModelInfo.jsx     # Performance metrics & visual charts
│   │   │   └── Chatbot.jsx       # Floating FraudShield Assistant widget
│   │   ├── pages/
│   │   │   ├── Login.jsx         # User login screen
│   │   │   ├── Register.jsx      # User registration screen
│   │   │   └── Dashboard.jsx     # Main financial dashboard
│   │   ├── App.jsx               # App routing & session state
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Tailwind CSS & fintech utilities
│   ├── dist/                     # Production build
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite configuration with backend proxy
│   └── tailwind.config.js        # Cream & Orange design theme tokens
├── data/
│   ├── creditcard.csv            # Original hackathon dataset (284,807 rows)
│   └── dataset.csv               # Working dataset copy
├── outputs/                      # Generated evaluation figures
│   ├── confusion_matrix.png
│   ├── roc_curve.png
│   ├── pr_curve.png
│   └── model_comparison.png
├── requirements.txt              # Backend dependencies
├── README.md                     # Documentation & setup guide
├── .env.example                  # Environment configuration template
└── test_e2e_full.py              # Full automated test suite
```

---

## 👥 Hackathon Team
Built for **Code Cortex 3.0** (Finance Track) at **VIT Vellore**.  
Strictly adheres to all rules: genuine ML model, zero external LLMs for fraud detection, and complete local execution.
