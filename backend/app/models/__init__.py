from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    datasets = relationship("Dataset", back_populates="user", cascade="all, delete-orphan")
    tariffs = relationship("ElectricityTariff", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    dataset_type = Column(String(50), default="UCI")  # 'UCI' or 'GENERIC'
    total_records = Column(Integer, default=0)
    missing_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    total_energy_kwh = Column(Float, default=0.0)
    avg_power_kw = Column(Float, default=0.0)
    max_power_kw = Column(Float, default=0.0)
    min_power_kw = Column(Float, default=0.0)
    data_quality_status = Column(String(50), default="VALID")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="datasets")
    consumption_readings = relationship("ConsumptionHourly", back_populates="dataset", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyResult", back_populates="dataset", cascade="all, delete-orphan")
    forecasts = relationship("ForecastResult", back_populates="dataset", cascade="all, delete-orphan")
    clusters = relationship("UsageCluster", back_populates="dataset", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="dataset", cascade="all, delete-orphan")

class ConsumptionHourly(Base):
    __tablename__ = "consumption_hourly"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    energy_kwh = Column(Float, nullable=False)  # Integrated energy consumed in kWh
    avg_power_kw = Column(Float, nullable=False)  # Average power kW
    max_power_kw = Column(Float, nullable=False)  # Peak power kW in this hour
    min_power_kw = Column(Float, nullable=False)  # Base power kW in this hour
    avg_voltage = Column(Float, default=230.0)
    avg_reactive_power = Column(Float, default=0.0)
    sub_metering_1 = Column(Float, default=0.0)  # Kitchen (kWh)
    sub_metering_2 = Column(Float, default=0.0)  # Laundry (kWh)
    sub_metering_3 = Column(Float, default=0.0)  # Climate/Heater (kWh)
    hour = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    is_weekend = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="consumption_readings")

    __table_args__ = (
        Index("idx_dataset_timestamp", "dataset_id", "timestamp"),
        Index("idx_user_dataset_time", "user_id", "dataset_id", "timestamp"),
    )

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    actual_kwh = Column(Float, nullable=False)
    baseline_kwh = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # 'Low', 'Medium', 'High'
    explanation = Column(Text, nullable=False)
    anomaly_type = Column(String(100), default="Spike")  # Spike, Nighttime, Continuous
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="anomalies")

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_timestamp = Column(DateTime, nullable=False, index=True)
    horizon_type = Column(String(50), nullable=False)  # 'next_hour', 'next_day', 'next_7_days', 'monthly'
    predicted_kwh = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=True)  # Populated when testing/backtesting
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="forecasts")

class UsageCluster(Base):
    __tablename__ = "usage_clusters"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    cluster_id = Column(Integer, nullable=False)
    cluster_name = Column(String(100), nullable=False)  # e.g., 'Low Baseline', 'Moderate Usage', 'High Demand', 'Peak Burst'
    avg_kwh = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    hourly_distribution = Column(Text, nullable=True)  # JSON string of hourly probabilities
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="clusters")

class ElectricityTariff(Base):
    __tablename__ = "electricity_tariffs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    currency = Column(String(10), default="₹")
    tariff_per_kwh = Column(Float, default=7.50)  # ₹/kWh (Indian default typical slab rate)
    fixed_monthly_charge = Column(Float, default=120.00)  # ₹
    tax_rate_pct = Column(Float, default=5.0)  # %
    additional_charges = Column(Float, default=0.0)  # Fuel surcharge, regulatory fee etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="tariffs")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Optimization")
    explanation = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    practical_action = Column(Text, nullable=False)
    estimated_saving_kwh = Column(Float, default=0.0)
    estimated_saving_amount = Column(Float, default=0.0)
    confidence = Column(String(20), default="High")
    priority = Column(String(20), default="Medium")  # 'High', 'Medium', 'Low'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="recommendations")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    default_currency = Column(String(10), default="₹")
    default_tariff = Column(Float, default=7.50)
    theme = Column(String(20), default="light")
    notifications_enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")

