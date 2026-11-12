import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.services.analytics_service import AnalyticsService
from app.services.dataset_service import DatasetService
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/daily")
def get_daily_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return []
    return AnalyticsService.get_consumption_trend(db, dataset.id, date_filter="all", aggregation="daily")

@router.get("/weekly")
def get_weekly_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return []
    return AnalyticsService.get_consumption_trend(db, dataset.id, date_filter="all", aggregation="weekly")

@router.get("/monthly")
def get_monthly_analytics(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return []
    return AnalyticsService.get_consumption_trend(db, dataset.id, date_filter="all", aggregation="monthly")

@router.get("/patterns")
def get_patterns_breakdown(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return {
            "weekday_avg_kwh": 0.0,
            "weekend_avg_kwh": 0.0,
            "sub_metering_shares": {},
            "hourly_heat": []
        }

    df = AnalyticsService.get_dataset_dataframe(db, dataset.id)
    if df.empty:
        return {
            "weekday_avg_kwh": 0.0,
            "weekend_avg_kwh": 0.0,
            "sub_metering_shares": {},
            "hourly_heat": []
        }

    weekday_avg = float(df[df['is_weekend'] == False]['energy_kwh'].mean())
    weekend_avg = float(df[df['is_weekend'] == True]['energy_kwh'].mean())

    total_kwh = float(df['energy_kwh'].sum())
    sub1 = float(df['sub_metering_1'].sum())
    sub2 = float(df['sub_metering_2'].sum())
    sub3 = float(df['sub_metering_3'].sum())
    other = max(0.0, total_kwh - (sub1 + sub2 + sub3))

    sub_shares = [
        {"name": "Kitchen (Oven/Microwave)", "kwh": round(sub1, 2), "percentage": round((sub1 / max(0.1, total_kwh)) * 100.0, 1)},
        {"name": "Laundry (Washer/Dryer)", "kwh": round(sub2, 2), "percentage": round((sub2 / max(0.1, total_kwh)) * 100.0, 1)},
        {"name": "Climate & Geyser (HVAC/Heater)", "kwh": round(sub3, 2), "percentage": round((sub3 / max(0.1, total_kwh)) * 100.0, 1)},
        {"name": "General Base & Lighting", "kwh": round(other, 2), "percentage": round((other / max(0.1, total_kwh)) * 100.0, 1)}
    ]

    # Day of week vs Hour consumption matrix
    matrix = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for dow in range(7):
        day_sub = df[df['day_of_week'] == dow]
        for hour in range(24):
            val = day_sub[day_sub['hour'] == hour]['energy_kwh'].mean()
            matrix.append({
                "day": day_names[dow],
                "day_idx": dow,
                "hour": hour,
                "value": round(float(val), 3) if pd.notna(val) else 0.0
            })

    return {
        "weekday_avg_kwh": round(weekday_avg, 3),
        "weekend_avg_kwh": round(weekend_avg, 3),
        "sub_metering_shares": sub_shares,
        "hourly_heat": matrix
    }

@router.get("/appliances")
def get_appliance_breakdown(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not dataset:
        return {"appliances": [], "top_appliance": None, "total_kwh": 0.0, "currency": "₹"}

    return AnalyticsService.get_appliance_disaggregation(db, current_user, dataset.id)

