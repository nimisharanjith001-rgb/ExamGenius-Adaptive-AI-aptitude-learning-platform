from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import SettingsUpdate
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User, UserSettings, ElectricityTariff

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_settings(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    settings_obj = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    tariff = db.query(ElectricityTariff).filter(
        ElectricityTariff.user_id == current_user.id,
        ElectricityTariff.is_active == True
    ).first()

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "default_currency": settings_obj.default_currency if settings_obj else "₹",
        "default_tariff": tariff.tariff_per_kwh if tariff else 7.50,
        "fixed_monthly_charge": tariff.fixed_monthly_charge if tariff else 120.0,
        "tax_rate_pct": tariff.tax_rate_pct if tariff else 5.0,
        "theme": settings_obj.theme if settings_obj else "light",
        "notifications_enabled": settings_obj.notifications_enabled if settings_obj else True
    }

@router.put("")
def update_settings(
    settings_in: SettingsUpdate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    settings_obj = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)

    if settings_in.default_currency is not None:
        settings_obj.default_currency = settings_in.default_currency
    if settings_in.theme is not None:
        settings_obj.theme = settings_in.theme
    if settings_in.notifications_enabled is not None:
        settings_obj.notifications_enabled = settings_in.notifications_enabled

    if settings_in.default_tariff is not None:
        tariff = db.query(ElectricityTariff).filter(
            ElectricityTariff.user_id == current_user.id,
            ElectricityTariff.is_active == True
        ).first()
        if tariff:
            tariff.tariff_per_kwh = settings_in.default_tariff

    db.commit()
    db.refresh(settings_obj)

    return {"message": "Settings updated successfully."}

