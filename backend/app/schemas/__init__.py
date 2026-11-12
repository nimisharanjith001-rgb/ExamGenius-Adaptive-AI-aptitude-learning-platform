from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: str
    full_name: str
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Dataset Schemas ---
class DatasetValidationReport(BaseModel):
    total_records: int
    valid_records: int
    missing_records: int
    duplicate_records: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_energy_kwh: float
    avg_power_kw: float
    max_power_kw: float
    min_power_kw: float
    sampling_rate: str
    detected_format: str
    columns_detected: List[str]
    data_quality_status: str  # "EXCELLENT", "GOOD", "WARNING", "INVALID"
    preview_rows: List[Dict[str, Any]]
    validation_messages: List[str]

class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    filename: str
    dataset_type: str
    total_records: int
    missing_records: int
    duplicate_records: int
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    total_energy_kwh: float
    avg_power_kw: float
    max_power_kw: float
    min_power_kw: float
    data_quality_status: str
    is_active: bool
    created_at: datetime

# --- Analytics & Dashboard Schemas ---
class KPISummary(BaseModel):
    total_energy_kwh: float
    avg_daily_kwh: float
    estimated_monthly_bill: float
    currency: str
    max_power_kw: float
    anomaly_count: int
    predicted_next_day_kwh: float
    consumption_change_pct: float  # vs previous period
    data_points_count: int

class ConsumptionChartPoint(BaseModel):
    timestamp: str
    energy_kwh: float
    avg_power_kw: float
    max_power_kw: float
    sub_metering_1: Optional[float] = 0.0
    sub_metering_2: Optional[float] = 0.0
    sub_metering_3: Optional[float] = 0.0

class HourlyDistributionPoint(BaseModel):
    hour: int
    avg_kwh: float
    max_kwh: float
    min_kwh: float

class PeakHoursSummary(BaseModel):
    peak_hours: List[int]
    off_peak_hours: List[int]
    peak_avg_kwh: float
    off_peak_avg_kwh: float
    peak_percentage: float

# --- Machine Learning Schemas ---
class AnomalyItem(BaseModel):
    id: Optional[int] = None
    timestamp: str
    actual_kwh: float
    baseline_kwh: float
    deviation_pct: float
    anomaly_score: float
    severity: str  # Low, Medium, High
    explanation: str
    anomaly_type: str

class AnomalyResponse(BaseModel):
    total_anomalies: int
    high_severity_count: int
    medium_severity_count: int
    low_severity_count: int
    anomalies: List[AnomalyItem]
    model_info: Dict[str, Any]

class ForecastMetrics(BaseModel):
    mae: float
    rmse: float
    r2_score: float
    baseline_mae: float
    baseline_rmse: float
    accuracy_improvement_pct: float
    train_size: int
    test_size: int

class ForecastPoint(BaseModel):
    timestamp: str
    predicted_kwh: float
    actual_kwh: Optional[float] = None
    is_forecast: bool = True

class ForecastResponse(BaseModel):
    horizon_type: str
    total_predicted_kwh: float
    metrics: ForecastMetrics
    forecasts: List[ForecastPoint]
    model_version: str
    warning_message: Optional[str] = None

class ClusterItem(BaseModel):
    cluster_id: int
    cluster_name: str
    avg_kwh: float
    percentage: float
    description: str
    typical_hours: List[int]

class ClusterResponse(BaseModel):
    optimal_k: int
    silhouette_score: float
    clusters: List[ClusterItem]
    hourly_cluster_matrix: List[Dict[str, Any]]

# --- Electricity Bill Schemas ---
class BillCalculateRequest(BaseModel):
    tariff_per_kwh: float = 7.50
    fixed_monthly_charge: float = 120.00
    tax_rate_pct: float = 5.0
    additional_charges: float = 0.0
    currency: str = "₹"
    days_in_period: Optional[int] = 30
    custom_kwh: Optional[float] = None

class BillCalculateResponse(BaseModel):
    total_kwh: float
    currency: str
    tariff_per_kwh: float
    energy_charge: float
    fixed_charge: float
    tax_amount: float
    additional_charges: float
    total_estimated_bill: float
    average_cost_per_day: float
    effective_rate_per_kwh: float
    disclaimer: str

# --- Recommendations Schemas ---
class RecommendationItem(BaseModel):
    id: Optional[int] = None
    title: str
    category: str
    explanation: str
    evidence: str
    practical_action: str
    estimated_saving_kwh: float
    estimated_saving_amount: float
    confidence: str
    priority: str

class RecommendationResponse(BaseModel):
    total_recommendations: int
    potential_monthly_savings_kwh: float
    potential_monthly_savings_amount: float
    currency: str
    items: List[RecommendationItem]

# --- Settings Schemas ---
class SettingsUpdate(BaseModel):
    default_currency: Optional[str] = "₹"
    default_tariff: Optional[float] = 7.50
    theme: Optional[str] = "light"
    notifications_enabled: Optional[bool] = True
