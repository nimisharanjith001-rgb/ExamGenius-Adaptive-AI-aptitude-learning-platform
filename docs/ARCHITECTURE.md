# PowerPulse AI – System Architecture & Technical Diagrams

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Presentation Tier (Client / Browser)"]
        UI["React 18 + Vite + TypeScript"]
        Tailwind["Tailwind CSS Modern Palette"]
        Recharts["Recharts Visualization Engine"]
        Axios["Axios REST Client with JWT Interceptors"]
    end

    subgraph Gateway["API & Routing Tier (FastAPI)"]
        Router["FastAPI Application (Port 8000)"]
        AuthRoute["/api/auth (Login / Register / Me)"]
        DatasetRoute["/api/datasets (Upload / Validate / Preview)"]
        DashRoute["/api/dashboard (Summary / Trends / Peaks)"]
        MLRoute["/api/ml (Anomaly / Forecast / Clustering)"]
        BillRoute["/api/bill (Tariff & Calculations)"]
        RecRoute["/api/recommendations (Rule Engine)"]
    end

    subgraph MLEngine["Machine Learning Engine"]
        Prep["Data Preprocessing & Physics Integration"]
        IsoForest["Isolation Forest Anomaly Detector"]
        RFRegressor["Random Forest Forecaster (120 Trees)"]
        KMeansEngine["K-Means Clustering & Silhouette Optimizer"]
        ModelStore["Joblib Serialization & Metadata Persistence"]
    end

    subgraph Storage["Database & File System Tier"]
        DB[(SQLite / PostgreSQL via SQLAlchemy ORM)]
        RawFiles["Raw Dataset Storage (/uploaded_datasets)"]
        ModelDir["Saved Models (/trained_models)"]
    end

    UI --> Axios
    Axios --> Router
    Router --> AuthRoute
    Router --> DatasetRoute
    Router --> DashRoute
    Router --> MLRoute
    Router --> BillRoute
    Router --> RecRoute

    DatasetRoute --> Prep
    Prep --> DB
    Prep --> RawFiles

    MLRoute --> IsoForest
    MLRoute --> RFRegressor
    MLRoute --> KMeansEngine
    IsoForest --> ModelStore
    RFRegressor --> ModelStore
    ModelStore --> ModelDir

    DashRoute --> DB
    BillRoute --> DB
    RecRoute --> DB
```

---

## 2. Data Flow Diagram (DFD Level 1)

```mermaid
flowchart LR
    User([User / Homeowner])
    CSV[(Raw CSV File)]
    
    subgraph Process1["1.0 Dataset Ingestion & Physics Integration"]
        Validator["Validate Timestamps & Missing '?'"]
        Integrator["Energy = Power(kW) x dt(hr)"]
        Resampler["1-Hour Resampling"]
    end

    subgraph Process2["2.0 Machine Learning Pipelines"]
        AnomDet["Isolation Forest Scoring"]
        Forecaster["Lagged & Cyclical Random Forest"]
        Cluster["K-Means Profiling"]
    end

    subgraph Process3["3.0 Analytics & Recommendations"]
        KPIEngine["KPI & Peak Hours Calculator"]
        BillCalc["Tariff Billing Engine"]
        RuleEng["Energy-Saving Recommendation Engine"]
    end

    DB[(Database: Hourly Readings, Tariffs, Anomalies)]

    User -->|Uploads CSV| CSV
    CSV --> Validator
    Validator --> Integrator
    Integrator --> Resampler
    Resampler -->|Bulk Insert| DB

    DB --> AnomDet
    DB --> Forecaster
    DB --> Cluster
    AnomDet -->|Store Anomalies| DB
    Forecaster -->|Store Forecasts| DB

    DB --> KPIEngine
    DB --> BillCalc
    DB --> RuleEng

    KPIEngine -->|KPIs, Trends, Heatmaps| User
    AnomDet -->|Severity Badges & Alerts| User
    Forecaster -->|Forecast Projections| User
    BillCalc -->|Itemized Bill Estimate| User
    RuleEng -->|Actionable Savings Tips| User
```

---

## 3. Use Case Diagram

```mermaid
flowchart TD
    subgraph Actors
        Student["User / Student Examiner"]
    end

    subgraph UseCases["PowerPulse AI Functional Capabilities"]
        UC1(["Register & Authenticate (JWT)"])
        UC2(["Upload & Validate Smart Meter CSV"])
        UC3(["Load 1-Click Benchmark UCI Dataset"])
        UC4(["Explore Real-Time KPI Dashboard"])
        UC5(["Filter by Date: Today, 7D, 30D, All"])
        UC6(["Detect Consumption Anomalies"])
        UC7(["Forecast 24h & 7D Consumption"])
        UC8(["Profile K-Means Diurnal Clusters"])
        UC9(["Calculate Estimated Bill with Custom Tariffs"])
        UC10(["Review Prioritized Saving Recommendations"])
        UC11(["Download Clean CSV Template"])
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7
    Student --> UC8
    Student --> UC9
    Student --> UC10
    Student --> UC11
```

---

## 4. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ DATASETS : owns
    USERS ||--o{ ELECTRICITY_TARIFFS : configures
    USERS ||--o| USER_SETTINGS : maintains
    DATASETS ||--o{ CONSUMPTION_HOURLY : contains
    DATASETS ||--o{ ANOMALY_RESULTS : flags
    DATASETS ||--o{ FORECAST_RESULTS : projects
    DATASETS ||--o{ USAGE_CLUSTERS : groups
    DATASETS ||--o{ RECOMMENDATIONS : receives

    USERS {
        int id PK
        string email UK
        string full_name
        string hashed_password
        datetime created_at
    }

    DATASETS {
        int id PK
        int user_id FK
        string name
        string filename
        string file_path
        string dataset_type
        int total_records
        datetime start_date
        datetime end_date
        float total_energy_kwh
        float max_power_kw
        string data_quality_status
        boolean is_active
    }

    CONSUMPTION_HOURLY {
        int id PK
        int dataset_id FK
        int user_id FK
        datetime timestamp
        float energy_kwh
        float avg_power_kw
        float max_power_kw
        float avg_voltage
        float sub_metering_1
        float sub_metering_2
        float sub_metering_3
        int hour
        int day_of_week
        boolean is_weekend
    }

    ANOMALY_RESULTS {
        int id PK
        int dataset_id FK
        int user_id FK
        datetime timestamp
        float actual_kwh
        float baseline_kwh
        float deviation_pct
        float anomaly_score
        string severity
        string anomaly_type
        string explanation
    }

    ELECTRICITY_TARIFFS {
        int id PK
        int user_id FK
        string currency
        float tariff_per_kwh
        float fixed_monthly_charge
        float tax_rate_pct
        float additional_charges
    }
```

