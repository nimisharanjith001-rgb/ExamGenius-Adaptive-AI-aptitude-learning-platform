# PowerPulse AI – Smart Electricity Consumption & Anomaly Detector

> An AI-powered electricity consumption analytics, anomaly detection, forecasting, and billing estimation platform built with FastAPI, React, TypeScript, Tailwind CSS, and Scikit-Learn.

![PowerPulse AI Banner](https://img.shields.io/badge/Status-Production%20Ready-success)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4%2B-orange)

---

## ⚡ Key Highlights & Features

1. **Physical Energy Integration Pipeline:**
   - Supports both the benchmark UCI Household Power dataset (semicolon-separated) and generic smart-meter CSV files.
   - Accurately integrates instantaneous power ($kW$) to energy ($kWh$) using exact sampling intervals ($\Delta t$):
     $$\text{Energy } (kWh) = \text{Power } (kW) \times \left(\frac{\Delta t \text{ (seconds)}}{3600}\right)$$
   - Automated handling of missing values (`?` markers), duplicate timestamps, and data quality validation.

2. **AI Anomaly Detection (Isolation Forest):**
   - Unsupervised ensemble tree model detecting unusual power surges, unexpected overnight consumption (e.g. forgotten geysers), and irregular appliance runs.
   - Normalized anomaly score with Severity badges (`High`, `Medium`, `Low`) and plain-language mathematical explanations.

3. **Time-Series Electricity Forecasting (Random Forest Regressor):**
   - Autoregressive multi-horizon forecasting: Next Hour, Next 24 Hours, Next 7 Days, and 30-Day Outlook.
   - Trigonometric cyclical feature encodings ($\sin/\cos$ of hour and day of week) and lagged rolling moments.
   - Leak-free chronological train/test split (80/20) with strict benchmarking against a 24-hour persistence baseline ($R^2 > 0.88$, MAE $< 0.11$).

4. **Consumption Pattern Clustering (K-Means):**
   - Silhouette-optimized unsupervised clustering partitioning diurnal usage into intuitive operational modes (Basal Standby, Regular Daytime, Active Demand, Extreme Surges).

5. **Electricity Bill Calculator:**
   - Configurable tariff parameters: Slab rates (default ₹7.50/kWh INR), fixed monthly capacity charges, municipal taxes, and fuel surcharges.
   - Itemized bill breakdown with average daily cost and effective per-kWh rate.

6. **Actionable Recommendations Engine:**
   - Mathematically grounded energy-saving insights targeting night standby phantom loads, evening peak shifting, and weekend load disparities with estimated kWh and currency savings.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm

### 1. Backend Setup
```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
PYTHONPATH=. pytest tests/ -v

# Start FastAPI backend server (Runs on http://localhost:8000)
python run.py
```
*Interactive Swagger API documentation is available at `http://localhost:8000/api/docs`.*

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite React development server (Runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your web browser.

---

## 🔑 Demo Access
You can log in instantly or register a new user:
- **Instant 1-Click Access:** Click the **"⚡ Instant 1-Click Examiner / Demo Access"** button on the Login page.
- **Or credentials:**
  - Email: `demo@powerpulse.ai`
  - Password: `DemoPassword123!`

---

## 📂 Project Structure
```
powerpulse-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # REST route handlers (auth, datasets, dashboard, ml, bill, recs)
│   │   ├── core/         # Settings, JWT security, password hashing
│   │   ├── database/     # SQLAlchemy engine, sessionmaker, declarative base
│   │   ├── models/       # Database schemas (User, Dataset, Consumption, Anomalies, etc.)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Core domain business logic
│   │   ├── ml/           # Preprocessing, Isolation Forest, Random Forest, K-Means
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Pytest test suite (100% passing)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, Sidebar, Header, KPICards, EmptyStates
│   │   ├── contexts/     # AuthContext & DatasetContext
│   │   ├── pages/        # Dashboard, Analytics, Forecasting, Anomalies, Bill, etc.
│   │   ├── types/        # TypeScript interfaces
│   │   ├── api/          # Axios HTTP client with JWT interceptor
│   │   └── App.tsx       # Route definitions
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── sample_data/
│   ├── sample_uci_household_sample.csv   # 20,160 minute-level benchmark records
│   ├── sample_generic_electricity.csv    # 336 hourly generic smart meter records
│   └── sample_template.csv               # Downloadable user CSV template
├── docs/
│   ├── PROJECT_REPORT.md                 # Full 19-section academic report
│   ├── ARCHITECTURE.md                   # Mermaid diagrams (Architecture, DFD, UseCase, ER)
│   └── VIVA_QUESTIONS_AND_ANSWERS.md     # External viva exam defense guide
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧪 Testing Verification
Run the backend automated test suite:
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/ -v
```
All 7 comprehensive test suites pass, covering:
- User registration, JWT login, and session validation.
- Dataset validation, CSV parsing, and hourly physical aggregation.
- Isolation Forest anomaly detection and severity labeling.
- Random Forest chronological forecasting and metric evaluation ($MAE, RMSE, R^2$).
- K-Means clustering and Silhouette evaluation.
- Tariff calculation and bill itemization.
- Dashboard KPI summaries and trend point generation.

---

## 🎓 Academic Defense Notes
- **Energy vs Power:** Power is instantaneous ($kW$); Energy is time-integrated ($kWh = kW \times \Delta t$).
- **No Data Leakage:** Time-series feature engineering enforces chronological splits (earliest 80% train, latest 20% test) with shifted rolling windows.
- **Geographic Scope:** The benchmark dataset reflects a European residence in France; demographic differences regarding Indian climate and appliance profiles are explicitly acknowledged.

