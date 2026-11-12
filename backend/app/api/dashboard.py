from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.schemas import KPISummary, ConsumptionChartPoint, PeakHoursSummary
from app.services.analytics_service import AnalyticsService
from app.services.dataset_service import DatasetService
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=KPISummary)
def get_summary(
    dataset_id: Optional[int] = None,
    filter_period: str = Query("all", pattern="^(all|today|last_7_days|last_30_days)$"),
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return KPISummary(
            total_energy_kwh=0.0,
            avg_daily_kwh=0.0,
            estimated_monthly_bill=0.0,
            currency="₹",
            max_power_kw=0.0,
            anomaly_count=0,
            predicted_next_day_kwh=0.0,
            consumption_change_pct=0.0,
            data_points_count=0
        )

    return AnalyticsService.get_kpi_summary(db, current_user, dataset, filter_period)

@router.get("/consumption", response_model=List[ConsumptionChartPoint])
def get_consumption(
    dataset_id: Optional[int] = None,
    filter_period: str = Query("all", pattern="^(all|today|last_7_days|last_30_days)$"),
    aggregation: str = Query("hourly", pattern="^(hourly|daily|weekly|monthly)$"),
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return []

    return AnalyticsService.get_consumption_trend(db, dataset.id, filter_period, aggregation)

@router.get("/peak-hours")
def get_peak_hours(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return {
            "peak_hours": [],
            "off_peak_hours": [],
            "peak_avg_kwh": 0.0,
            "off_peak_avg_kwh": 0.0,
            "peak_percentage": 0.0,
            "hourly_breakdown": []
        }

    return AnalyticsService.get_peak_hours_analysis(db, dataset.id)
