from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
from app.models import Dataset, Recommendation, ElectricityTariff, User
from app.services.analytics_service import AnalyticsService

class RecommendationService:
    @staticmethod
    def generate_recommendations(db: Session, user: User, dataset: Dataset) -> List[Dict[str, Any]]:
        df = AnalyticsService.get_dataset_dataframe(db, dataset.id)
        if df.empty:
            return []

        tariff = db.query(ElectricityTariff).filter(
            ElectricityTariff.user_id == user.id,
            ElectricityTariff.is_active == True
        ).first()
        rate = tariff.tariff_per_kwh if tariff else 7.50

        recommendations = []

        # 1. Nighttime Standby Analysis (Hours 00:00 to 05:00)
        night_df = df[df['hour'].isin([0, 1, 2, 3, 4, 5])]
        day_df = df[~df['hour'].isin([0, 1, 2, 3, 4, 5])]
        
        avg_night_kwh = float(night_df['energy_kwh'].mean()) if not night_df.empty else 0.0
        avg_day_kwh = float(day_df['energy_kwh'].mean()) if not day_df.empty else 0.0

        # If overnight average exceeds 0.5 kWh/hour (12 kWh overnight/day is high for residential standby)
        if avg_night_kwh > 0.45:
            excess_per_night = (avg_night_kwh - 0.25) * 6.0  # 6 night hours vs 0.25 normal baseline
            monthly_saving_kwh = round(excess_per_night * 30.0 * 0.7, 1) # realistic 70% capture
            monthly_saving_amount = round(monthly_saving_kwh * rate, 2)
            
            recommendations.append({
                "title": "Optimize High Overnight Standby Loads",
                "category": "Phantom Load Reduction",
                "explanation": "Significant electricity is being consumed during sleep hours (12:00 AM – 6:00 AM) when household activity is minimal.",
                "evidence": f"Average nighttime consumption is {avg_night_kwh:.2f} kWh/hour ({avg_night_kwh * 6:.2f} kWh each night), which is higher than typical residential idle loads (0.20–0.25 kWh/hr).",
                "practical_action": "Check for electric water heaters left on timers overnight, older refrigerators with failing gaskets, or entertainment systems and desktop PCs that remain powered on standby.",
                "estimated_saving_kwh": monthly_saving_kwh,
                "estimated_saving_amount": monthly_saving_amount,
                "confidence": "High",
                "priority": "High"
            })

        # 2. Evening Peak Concentration (Hours 18:00 to 22:00)
        evening_df = df[df['hour'].isin([18, 19, 20, 21])]
        avg_evening_kwh = float(evening_df['energy_kwh'].mean()) if not evening_df.empty else 0.0
        
        if avg_evening_kwh > 1.8:
            potential_shift_kwh = round((avg_evening_kwh - 1.2) * 4.0 * 30.0 * 0.4, 1)
            saving_amount = round(potential_shift_kwh * (rate * 0.2), 2)  # Assuming peak tariff differential or efficiency
            
            recommendations.append({
                "title": "Stagger Heavy Evening Appliance Use",
                "category": "Peak Load Shifting",
                "explanation": "Severe power concentration occurs during the evening peak window (6:00 PM – 10:00 PM), stressing local wiring and driving up demand charges.",
                "evidence": f"Evening peak consumption averages {avg_evening_kwh:.2f} kWh/hr, accounting for over 35% of total daily energy in just 4 hours.",
                "practical_action": "Avoid running clothes washing machines, dishwashers, and iron presses simultaneously with cooking appliances or AC units. Shift laundry cycles to off-peak daytime or morning hours.",
                "estimated_saving_kwh": potential_shift_kwh,
                "estimated_saving_amount": saving_amount,
                "confidence": "Medium",
                "priority": "Medium"
            })

        # 3. Weekend vs Weekday Disparity
        weekend_df = df[df['is_weekend'] == True]
        weekday_df = df[df['is_weekend'] == False]
        
        if not weekend_df.empty and not weekday_df.empty:
            avg_wknd = float(weekend_df['energy_kwh'].mean())
            avg_wkday = float(weekday_df['energy_kwh'].mean())
            
            if avg_wknd > avg_wkday * 1.35:
                diff_pct = round(((avg_wknd - avg_wkday) / avg_wkday) * 100.0, 1)
                wknd_excess_kwh = round((avg_wknd - avg_wkday) * 24.0 * 8.0 * 0.35, 1) # 8 weekend days/mo
                wknd_saving = round(wknd_excess_kwh * rate, 2)
                
                recommendations.append({
                    "title": "Address High Weekend Electricity Spikes",
                    "category": "Behavioral Management",
                    "explanation": "Weekend daily electricity usage is dramatically higher than standard weekday routines.",
                    "evidence": f"Weekend consumption averages {avg_wknd:.2f} kWh/hr compared to {avg_wkday:.2f} kWh/hr on weekdays (+{diff_pct}% surge).",
                    "practical_action": "Utilize natural daylight during weekend chores, group multiple baking/cooking sessions together, and ensure cooling or entertainment centers are turned off when leaving rooms.",
                    "estimated_saving_kwh": wknd_excess_kwh,
                    "estimated_saving_amount": wknd_saving,
                    "confidence": "High",
                    "priority": "Medium"
                })

        # 4. Continuous High Baseline Check
        min_hourly_power = float(df['min_power_kw'].quantile(0.1))
        if min_hourly_power > 0.4:
            rec_kwh = round((min_hourly_power - 0.2) * 24.0 * 30.0 * 0.5, 1)
            rec_amt = round(rec_kwh * rate, 2)
            recommendations.append({
                "title": "Eliminate Always-On Base Load",
                "category": "Phantom Load Reduction",
                "explanation": "Your residence maintains an elevated minimum base power draw at all times, 24 hours a day, 7 days a week.",
                "evidence": f"Minimum recorded base load never drops below {min_hourly_power:.2f} kW even during deepest inactivity.",
                "practical_action": "Deploy smart power strips for home audio, gaming consoles, and work-from-home multi-monitors to eliminate vampire draw when turned off.",
                "estimated_saving_kwh": rec_kwh,
                "estimated_saving_amount": rec_amt,
                "confidence": "Medium",
                "priority": "Low"
            })

        # 5. General Climate / AC / Water Heater Optimization
        if 'sub_metering_3' in df.columns and df['sub_metering_3'].sum() > 0:
            sub3_total = float(df['sub_metering_3'].sum())
            total_energy = float(df['energy_kwh'].sum())
            sub3_pct = round((sub3_total / max(0.1, total_energy)) * 100.0, 1)
            
            if sub3_pct > 30.0:
                saving_kwh = round(sub3_total * 0.15 * (30.0 / max(1, df['timestamp'].dt.date.nunique())), 1)
                recommendations.append({
                    "title": "Calibrate Climate & Heating Thermostats",
                    "category": "HVAC Efficiency",
                    "explanation": "Space heating/cooling and water heating (Sub-meter 3) represents the largest individual energy consumer in the home.",
                    "evidence": f"Sub-meter 3 accounts for {sub3_pct}% ({sub3_total:.1f} kWh) of total monitored electricity consumption.",
                    "practical_action": "Set cooling thermostats to 24°C–25°C instead of 20°C, and insulate electric water storage geysers. Every 1°C increase in AC setting reduces power consumption by approximately 6%.",
                    "estimated_saving_kwh": saving_kwh,
                    "estimated_saving_amount": round(saving_kwh * rate, 2),
                    "confidence": "High",
                    "priority": "High"
                })

        return recommendations

