from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.schemas import BillCalculateRequest, BillCalculateResponse
from app.services.bill_service import BillService
from app.services.dataset_service import DatasetService
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User

router = APIRouter(prefix="/bill", tags=["Electricity Bill"])

@router.post("/calculate", response_model=BillCalculateResponse)
def calculate_bill(
    request: BillCalculateRequest,
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    return BillService.calculate_bill(db, current_user, dataset, request)

@router.get("/tariff")
def get_user_tariff(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    tariff = BillService.get_or_update_tariff(db, current_user)
    return {
        "currency": tariff.currency,
        "tariff_per_kwh": tariff.tariff_per_kwh,
        "fixed_monthly_charge": tariff.fixed_monthly_charge,
        "tax_rate_pct": tariff.tax_rate_pct,
        "additional_charges": tariff.additional_charges
    }

@router.put("/tariff")
def update_user_tariff(
    tariff_data: Dict[str, Any],
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    tariff = BillService.get_or_update_tariff(db, current_user, tariff_data)
    return {
        "message": "Tariff updated successfully",
        "currency": tariff.currency,
        "tariff_per_kwh": tariff.tariff_per_kwh,
        "fixed_monthly_charge": tariff.fixed_monthly_charge,
        "tax_rate_pct": tariff.tax_rate_pct,
        "additional_charges": tariff.additional_charges
    }

