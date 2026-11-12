# PowerPulse AI – Final-Year Viva Voce Questions & Answers
## Comprehensive Defense Guide for External Academic Examination

---

### Q1: What is the physical distinction between Active Power (kW) and Energy (kWh), and why does it matter?
**Answer:**
- **Active Power ($P$) in Kilowatts (kW):** Represents the *instantaneous rate* of electrical work being performed at any single moment ($P = V \cdot I \cdot \cos\phi$).
- **Energy ($E$) in Kilowatt-hours (kWh):** Represents the *cumulative time-integral* of active power over an elapsed duration ($E = \int P(t) \, dt$).
- **Relevance to the project:** In the UCI dataset, `Global_active_power` is recorded once every minute in kW. If one directly sums these raw readings without time integration, the calculated energy would be artificially inflated by a factor of 60. For minute-level sampling, 1 minute at 1 kW equals $\frac{1}{60} \text{ kWh} \approx 0.01667 \text{ kWh}$. PowerPulse AI strictly enforces proper time integration.

---

### Q2: Why did you choose Isolation Forest over DBSCAN, One-Class SVM, or a simple Z-score threshold for anomaly detection?
**Answer:**
1. **Linear Scalability:** Isolation Forest operates in $O(n \log n)$ time with small subsampling sizes ($256$ samples per tree), whereas DBSCAN and Kernel SVM require calculating pairwise distance matrices which scale as $O(n^2)$, proving too slow for multi-year minute-level smart meter series.
2. **Isolation Principle:** Anomalies are "few and different"; hence, they isolate near the root of random decision trees with significantly shorter path lengths $h(x)$.
3. **Multivariate Awareness:** A Z-score threshold on raw power fails because a high power reading of 3 kW is completely normal at 7:30 PM (cooking dinner), but highly anomalous at 3:30 AM (sleeping). Isolation Forest evaluates the joint feature vector containing temporal context (hour, weekend indicator), rolling baseline moments, and deviations simultaneously.

---

### Q3: Why use Random Forest Regressor for forecasting instead of traditional ARIMA or LSTM networks?
**Answer:**
1. **Handling Non-Linear Interactions & Step Functions:** Residential electrical load is driven by discrete human behaviors and appliance switching (e.g., a 2 kW water heater turning ON/OFF creates a step function). Random Forest handles non-linear step responses naturally without needing smooth derivative gradients.
2. **Deterministic & CPU-Friendly:** Unlike deep recurrent networks (LSTM/GRU) which demand extensive training epochs, GPU acceleration, and are prone to overfitting on small data splits, Random Forest Regressor trains within seconds on standard CPUs, making it dependable for local deployment without paid APIs.
3. **Overcoming ARIMA Limitations:** Traditional ARIMA assumes linear stationary processes. Residential loads exhibit multiple seasonality (diurnal 24h cycle and weekly 168h cycle). Random Forest captures both simultaneously using cyclical trigonometric encodings ($\sin/\cos$ of hour and day of week) and lagged terms ($\text{lag}_{1h}, \text{lag}_{24h}$).

---

### Q4: How did you ensure there is no Data Leakage in your forecasting model?
**Answer:**
1. **Strict Chronological Train/Test Splitting:** We never use random k-fold cross-validation or `train_test_split(shuffle=True)`. The dataset is partitioned chronologically: the earliest 80% of readings are used for training, and the most recent 20% are held out for testing.
2. **Shifted Rolling Window Statistics:** All rolling moments (e.g. 6-hour moving mean $\mu_{6h}$, standard deviation $\sigma_{6h}$) are calculated on `shift(1)`, guaranteeing that the current hour's actual consumption is strictly excluded from its own rolling feature window.

---

### Q5: What is the significance of the Silhouette Score in your K-Means clustering module?
**Answer:**
- The Silhouette coefficient measures how similar an observation is to its assigned cluster (cohesion $a$) compared to other clusters (separation $b$):
  $$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$
- The score ranges between $-1$ and $+1$. A score $>0.5$ indicates strong, distinct cluster separation.
- In PowerPulse AI, the system evaluates candidate cluster counts ($k \in [3, 4, 5]$) and automatically selects the optimal $k$ that maximizes the Silhouette score (typically achieving $0.61$), ensuring that discovered household usage profiles are mathematically sound rather than arbitrarily chosen.

---

### Q6: What are the primary limitations of the UCI Household Power Consumption dataset?
**Answer:**
1. **Single-Household Representation:** The dataset originates from a single household in Sceaux, France between 2006 and 2010.
2. **Geographic & Climatic Differences:** France has a temperate/cold European climate where space heating and electric water heating dominate winter load profiles. In contrast, Indian households have high summer cooling loads (ceiling fans, desert coolers, inverter ACs), lower space heating, and significant seasonal monsoon shifts.
3. **Sub-Metering Specifics:** The UCI dataset captures only three sub-circuits (Kitchen, Laundry, Climate). Modern smart homes contain diverse electronics and distributed smart plugs.

---

### Q7: How does your Electricity Bill Estimation handle tariffs?
**Answer:**
- PowerPulse AI avoids hardcoding arbitrary universal utility rates.
- It provides a configurable billing model allowing the user to specify:
  1. Energy tariff per kWh (defaulting to Indian standard ₹7.50/kWh).
  2. Fixed monthly capacity charges (sanctioned load / meter rental, default: ₹120.00).
  3. Tax and municipal duty percentage (default: 5.0%).
  4. Additional fuel surcharge / regulatory adjustments.
- The formula applied is:
  $$\text{Energy Charge} = \text{Total kWh} \times \text{Tariff Rate}$$
  $$\text{Total Bill} = (\text{Energy Charge} + \text{Fixed Charge} + \text{Additional Charges}) \times \left(1 + \frac{\text{Tax \%}}{100}\right)$$
- The system explicitly presents this as an estimate to reflect that real-world state utilities (e.g. BESCOM, TANGEDCO, MSEDCL) apply non-linear telescopic slabs.

---

### Q8: What measures did you implement for system performance and scalability?
**Answer:**
1. **Hourly Ingestion Aggregation:** Although the raw CSV contains up to 2 million minute-level rows, the backend aggregates these into compact hourly records upon ingestion. This reduces the database footprint by 60x while preserving active, peak, and minimum power metrics.
2. **Composite Database Indexing:** Relational indexes are applied on `(user_id, dataset_id, timestamp)` in SQLite / PostgreSQL, ensuring query retrieval times for chart endpoints are sub-millisecond ($<10\text{ ms}$).
3. **Joblib Model Serialization:** Trained ML models and evaluation metrics are persisted to disk using Joblib, eliminating the need to retrain models on every page refresh.

