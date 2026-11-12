from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.schemas import RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.services.dataset_service import DatasetService
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User, ElectricityTariff

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    dataset_id: Optional[int] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    dataset = DatasetService.get_active_dataset(db, current_user, dataset_id)
    tariff = db.query(ElectricityTariff).filter(
        ElectricityTariff.user_id == current_user.id,
        ElectricityTariff.is_active == True
    ).first()
    currency = tariff.currency if tariff else "₹"

    if not dataset:
        return RecommendationResponse(
            total_recommendations=0,
            potential_monthly_savings_kwh=0.0,
            potential_monthly_savings_amount=0.0,
            currency=currency,
            items=[]
        )

    recs = RecommendationService.generate_recommendations(db, current_user, dataset)
    total_savings_kwh = sum(r.get("estimated_saving_kwh", 0.0) for r in recs)
    total_savings_amt = sum(r.get("estimated_saving_amount", 0.0) for r in recs)

    return RecommendationResponse(
        total_recommendations=len(recs),
        potential_monthly_savings_kwh=round(total_savings_kwh, 1),
        potential_monthly_savings_amount=round(total_savings_amt, 2),
        currency=currency,
        items=recs
    )

