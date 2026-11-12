import sys
from pathlib import Path
from app.database.session import SessionLocal, engine
from app.database.base import Base
import app.models
from app.models import User, ElectricityTariff, UserSettings
from app.core.security import get_password_hash
from app.services.dataset_service import DatasetService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if demo user exists
        demo_user = db.query(User).filter(User.email == "demo@powerpulse.ai").first()
        if not demo_user:
            print("Creating demo user...")
            demo_user = User(
                email="demo@powerpulse.ai",
                full_name="Final Year Student / Examiner",
                hashed_password=get_password_hash("DemoPassword123!")
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Tariff & Settings
            tariff = ElectricityTariff(
                user_id=demo_user.id,
                currency="₹",
                tariff_per_kwh=7.50,
                fixed_monthly_charge=120.00,
                tax_rate_pct=5.0
            )
            db.add(tariff)

            settings = UserSettings(
                user_id=demo_user.id,
                default_currency="₹",
                default_tariff=7.50,
                theme="light"
            )
            db.add(settings)
            db.commit()
            print("Demo user created successfully!")
        else:
            # Update password hash just in case
            demo_user.hashed_password = get_password_hash("DemoPassword123!")
            db.commit()
            print("Demo user password updated.")

        # Seed UCI sample dataset if not present for this user
        datasets = DatasetService.get_user_datasets(db, demo_user)
        if not datasets:
            print("Seeding benchmark UCI dataset for demo user...")
            sample_path = Path(__file__).resolve().parent.parent / "sample_data" / "sample_uci_household_sample.csv"
            if sample_path.exists():
                with open(sample_path, "rb") as f:
                    content = f.read()
                ds = DatasetService.import_dataset(
                    db=db,
                    user=demo_user,
                    content_bytes=content,
                    filename="sample_uci_household_sample.csv",
                    custom_name="UCI Benchmark Household Power (14 Days)"
                )
                print(f"Dataset '{ds.name}' imported with {ds.total_records} records!")
            else:
                print(f"Sample file not found at {sample_path}")
        else:
            print(f"Demo user already has {len(datasets)} dataset(s).")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

