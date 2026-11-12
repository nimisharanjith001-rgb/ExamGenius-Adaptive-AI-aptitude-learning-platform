import os
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models import Dataset, ConsumptionHourly, User
from app.ml.preprocessing import DataPreprocessingService
from app.core.config import settings

class DatasetService:
    @staticmethod
    def validate_file(content_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Validates CSV content and returns inspection and summary report without committing.
        """
        if len(content_bytes) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")

        try:
            _, report = DataPreprocessingService.process_and_validate_csv(content_bytes, filename)
            return report
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Dataset validation failed: {str(e)}")

    @staticmethod
    def import_dataset(db: Session, user: User, content_bytes: bytes, filename: str, custom_name: Optional[str] = None) -> Dataset:
        """
        Parses, validates, aggregates into hourly records and bulk stores into DB.
        """
        df_hourly, report = DataPreprocessingService.process_and_validate_csv(content_bytes, filename)

        # Save raw file
        dataset_name = custom_name.strip() if custom_name and custom_name.strip() else Path(filename).stem
        save_filename = f"user_{user.id}_{int(datetime.now().timestamp())}_{filename}"
        save_path = settings.DATASET_STORAGE_DIR / save_filename
        with open(save_path, "wb") as f:
            f.write(content_bytes)

        # Deactivate previous datasets for user to set this one as active
        db.query(Dataset).filter(Dataset.user_id == user.id).update({"is_active": False})

        # Create Dataset record
        dataset = Dataset(
            user_id=user.id,
            name=dataset_name,
            filename=filename,
            file_path=str(save_path),
            dataset_type=report["detected_format"],
            total_records=report["total_records"],
            missing_records=report["missing_records"],
            duplicate_records=report["duplicate_records"],
            start_date=datetime.fromisoformat(report["start_date"]),
            end_date=datetime.fromisoformat(report["end_date"]),
            total_energy_kwh=report["total_energy_kwh"],
            avg_power_kw=report["avg_power_kw"],
            max_power_kw=report["max_power_kw"],
            min_power_kw=report["min_power_kw"],
            data_quality_status=report["data_quality_status"],
            is_active=True
        )
        db.add(dataset)
        db.flush()

        # Bulk insert hourly records
        hourly_records = []
        for _, row in df_hourly.iterrows():
            hourly_records.append({
                "dataset_id": dataset.id,
                "user_id": user.id,
                "timestamp": row['timestamp'].to_pydatetime(),
                "energy_kwh": float(row['energy_kwh']),
                "avg_power_kw": float(row['avg_power_kw']),
                "max_power_kw": float(row['max_power_kw']),
                "min_power_kw": float(row['min_power_kw']),
                "avg_voltage": float(row['voltage']),
                "avg_reactive_power": float(row['reactive_power']),
                "sub_metering_1": float(row['sub_metering_1']),
                "sub_metering_2": float(row['sub_metering_2']),
                "sub_metering_3": float(row['sub_metering_3']),
                "hour": int(row['hour']),
                "day_of_week": int(row['day_of_week']),
                "is_weekend": bool(row['is_weekend'])
            })

        # Bulk insert mappings for speed
        db.bulk_insert_mappings(ConsumptionHourly, hourly_records)
        db.commit()
        db.refresh(dataset)

        return dataset

    @staticmethod
    def get_user_datasets(db: Session, user: User) -> List[Dataset]:
        return db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).all()

    @staticmethod
    def get_active_dataset(db: Session, user: User, dataset_id: Optional[int] = None) -> Optional[Dataset]:
        if dataset_id:
            return db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
        active = db.query(Dataset).filter(Dataset.user_id == user.id, Dataset.is_active == True).first()
        if not active:
            # Fallback to most recent dataset
            active = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()
        return active

    @staticmethod
    def set_active_dataset(db: Session, user: User, dataset_id: int) -> Dataset:
        ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Dataset not found.")

        db.query(Dataset).filter(Dataset.user_id == user.id).update({"is_active": False})
        ds.is_active = True
        db.commit()
        db.refresh(ds)
        return ds

    @staticmethod
    def delete_dataset(db: Session, user: User, dataset_id: int):
        ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Dataset not found.")

        # Remove local file if exists
        try:
            if os.path.exists(ds.file_path):
                os.remove(ds.file_path)
        except Exception:
            pass

        db.delete(ds)
        db.commit()

        # Set another dataset active if available
        remaining = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()
        if remaining:
            remaining.is_active = True
            db.commit()

