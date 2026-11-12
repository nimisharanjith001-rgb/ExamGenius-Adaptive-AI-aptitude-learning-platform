from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.schemas import AnomalyResponse, ForecastResponse, ClusterResponse
from app.ml.anomaly_detector import AnomalyDetector
from app.ml.forecaster import ElectricityForecaster
from app.ml.clusterer import ConsumptionClusterer
from app.ml.model_manager import ModelManager
from app.services.analytics_service import AnalyticsService
from app.services.dataset_service import DatasetService
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User, AnomalyResult

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/anomaly-detection", response_model=AnomalyResponse)
def run_anomaly_detection(
    dataset_id: Optional[int] = None,
    contamination: float = Query(0.03, ge=0.01, le=0.15),
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        raise HTTPException(status_code=400, detail="No active dataset selected for anomaly detection.")

    df_hourly = AnalyticsService.get_dataset_dataframe(db, dataset.id)
    if len(df_hourly) < 24:
        raise HTTPException(status_code=400, detail="Dataset must contain at least 24 hours of data for anomaly detection.")

    detector = AnomalyDetector(contamination=contamination)
    anomalies, model_info = detector.detect(df_hourly)

    # Persist or update anomaly records in database for this dataset
    from datetime import datetime
    db.query(AnomalyResult).filter(AnomalyResult.dataset_id == dataset.id).delete()
    for anom in anomalies:
        db_anom = AnomalyResult(
            dataset_id=dataset.id,
            user_id=current_user.id,
            timestamp=datetime.fromisoformat(anom["timestamp"]),
            actual_kwh=anom["actual_kwh"],
            baseline_kwh=anom["baseline_kwh"],
            deviation_pct=anom["deviation_pct"],
            anomaly_score=anom["anomaly_score"],
            severity=anom["severity"],
            explanation=anom["explanation"],
            anomaly_type=anom["anomaly_type"]
        )
        db.add(db_anom)
    db.commit()

    # Save model artifacts (User isolated)
    ModelManager.save_model(dataset.id, "isolation_forest", detector.model, model_info, user_id=current_user.id)

    return AnomalyResponse(
        total_anomalies=len(anomalies),
        high_severity_count=model_info["high_severity"],
        medium_severity_count=model_info["medium_severity"],
        low_severity_count=model_info["low_severity"],
        anomalies=anomalies,
        model_info=model_info
    )

@router.post("/forecast", response_model=ForecastResponse)
def run_forecasting(
    dataset_id: Optional[int] = None,
    horizon_type: str = Query("next_day", pattern="^(next_hour|next_day|next_7_days|monthly)$"),
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        raise HTTPException(status_code=400, detail="No active dataset selected for forecasting.")

    df_hourly = AnalyticsService.get_dataset_dataframe(db, dataset.id)
    if len(df_hourly) < 48:
        raise HTTPException(status_code=400, detail="Forecasting requires at least 48 continuous hourly readings.")

    forecaster = ElectricityForecaster()
    eval_result = forecaster.train_and_evaluate(df_hourly)
    forecast_result = forecaster.generate_future_forecast(df_hourly, horizon_type=horizon_type)

    # Save model artifact (User isolated)
    ModelManager.save_model(dataset.id, "random_forest_forecaster", forecaster.model, eval_result["metrics"], user_id=current_user.id)

    return ForecastResponse(**forecast_result)

@router.post("/clustering", response_model=ClusterResponse)
def run_clustering(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        raise HTTPException(status_code=400, detail="No active dataset selected for clustering.")

    df_hourly = AnalyticsService.get_dataset_dataframe(db, dataset.id)
    if len(df_hourly) < 24:
        raise HTTPException(status_code=400, detail="Clustering requires at least 24 hours of data.")

    clusterer = ConsumptionClusterer()
    cluster_result = clusterer.cluster(df_hourly)

    return ClusterResponse(**cluster_result)

@router.get("/model-metrics")
def get_model_metrics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return {"status": "no_active_dataset"}

    rf_loaded = ModelManager.load_model(dataset.id, "random_forest_forecaster", user_id=current_user.id)
    if_loaded = ModelManager.load_model(dataset.id, "isolation_forest", user_id=current_user.id)

    return {
        "forecasting_model": rf_loaded[1] if rf_loaded else None,
        "anomaly_model": if_loaded[1] if if_loaded else None
    }
