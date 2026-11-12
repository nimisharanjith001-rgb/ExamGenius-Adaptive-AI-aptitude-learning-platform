from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.models import Dataset, ElectricityTariff, User
from app.schemas import BillCalculateRequest, BillCalculateResponse

class BillService:
    @staticmethod
    def calculate_bill(
        db: Session,
        user: User,
        dataset: Optional[Dataset],
        request: BillCalculateRequest
    ) -> BillCalculateResponse:
        # Determine kWh
        if request.custom_kwh is not None and request.custom_kwh > 0:
            total_kwh = float(request.custom_kwh)
        elif dataset:
            # Scale dataset average daily consumption to period (e.g. 30 days)
            total_kwh = float(dataset.total_energy_kwh)
            if request.days_in_period and request.days_in_period != 30:
                # If custom days requested
                pass
        else:
            total_kwh = 150.0  # Reasonable fallback default

        tariff_rate = float(request.tariff_per_kwh)
        fixed_charge = float(request.fixed_monthly_charge)
        tax_pct = float(request.tax_rate_pct)
        additional = float(request.additional_charges)
        currency = request.currency or "₹"

        # Energy charge = Total consumption in kWh * Tariff per kWh
        energy_charge = round(total_kwh * tariff_rate, 2)
        
        # Subtotal before tax
        subtotal = energy_charge + fixed_charge + additional
        tax_amount = round(subtotal * (tax_pct / 100.0), 2)

        # Estimated total bill
        total_bill = round(subtotal + tax_amount, 2)

        days = request.days_in_period or 30
        avg_per_day = round(total_bill / max(1, days), 2)
        effective_rate = round(total_bill / max(0.1, total_kwh), 2)

        disclaimer = (
            "NOTICE: This bill calculation is an approximation based on flat-rate energy consumption "
            "and user-specified parameters. Actual power utility bills typically apply tiered telescopic "
            "tariffs, time-of-day (ToD) surcharges, fuel cost adjustments (FCA), and municipal duties. "
            "Please refer to your official electricity distribution utility for legal billing."
        )

        return BillCalculateResponse(
            total_kwh=round(total_kwh, 2),
            currency=currency,
            tariff_per_kwh=tariff_rate,
            energy_charge=energy_charge,
            fixed_charge=fixed_charge,
            tax_amount=tax_amount,
            additional_charges=additional,
            total_estimated_bill=total_bill,
            average_cost_per_day=avg_per_day,
            effective_rate_per_kwh=effective_rate,
            disclaimer=disclaimer
        )

    @staticmethod
    def get_or_update_tariff(
        db: Session,
        user: User,
        update_data: Optional[Dict[str, Any]] = None
    ) -> ElectricityTariff:
        tariff = db.query(ElectricityTariff).filter(
            ElectricityTariff.user_id == user.id,
            ElectricityTariff.is_active == True
        ).first()

        if not tariff:
            tariff = ElectricityTariff(
                user_id=user.id,
                currency="₹",
                tariff_per_kwh=7.50,
                fixed_monthly_charge=120.0,
                tax_rate_pct=5.0
            )
            db.add(tariff)
            db.commit()
            db.refresh(tariff)

        if update_data:
            if "tariff_per_kwh" in update_data:
                tariff.tariff_per_kwh = float(update_data["tariff_per_kwh"])
            if "fixed_monthly_charge" in update_data:
                tariff.fixed_monthly_charge = float(update_data["fixed_monthly_charge"])
            if "currency" in update_data:
                tariff.currency = str(update_data["currency"])
            if "tax_rate_pct" in update_data:
                tariff.tax_rate_pct = float(update_data["tax_rate_pct"])
            if "additional_charges" in update_data:
                tariff.additional_charges = float(update_data["additional_charges"])
            db.commit()
            db.refresh(tariff)

        return tariff

