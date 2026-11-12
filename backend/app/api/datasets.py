import os
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import DatasetResponse, DatasetValidationReport
from app.services.dataset_service import DatasetService
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User, Dataset, ConsumptionHourly
from app.core.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])

SAMPLE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "sample_data"

@router.post("/validate", response_model=DatasetValidationReport)
async def validate_csv(file: UploadFile = File(...)):
    content = await file.read()
    report = DatasetService.validate_file(content, file.filename or "uploaded.csv")
    return report

@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    custom_name: Optional[str] = Form(None),
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:  # 100MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (100MB).")

    dataset = DatasetService.import_dataset(
        db=db,
        user=current_user,
        content_bytes=content,
        filename=file.filename or "dataset.csv",
        custom_name=custom_name
    )
    return dataset

@router.post("/seed-demo", response_model=DatasetResponse)
def seed_demo_dataset(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    uci_sample_path = SAMPLE_DIR / "sample_uci_household_sample.csv"
    if not uci_sample_path.exists():
        raise HTTPException(status_code=404, detail="Demo dataset not found on server.")

    with open(uci_sample_path, "rb") as f:
        content = f.read()

    dataset = DatasetService.import_dataset(
        db=db,
        user=current_user,
        content_bytes=content,
        filename="UCI_Household_Power_Consumption_Sample.csv",
        custom_name="UCI Household Power (Demo)"
    )
    return dataset

@router.get("", response_model=List[DatasetResponse])
def get_datasets(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    return DatasetService.get_user_datasets(db, current_user)

@router.get("/active", response_model=Optional[DatasetResponse])
def get_active_dataset(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    return DatasetService.get_active_dataset(db, current_user)

@router.post("/{dataset_id}/activate", response_model=DatasetResponse)
def activate_dataset(
    dataset_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    return DatasetService.set_active_dataset(db, current_user, dataset_id)

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    ds = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return ds

@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    ds = DatasetService.get_active_dataset(db, current_user, dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    readings = db.query(ConsumptionHourly).filter(
        ConsumptionHourly.dataset_id == ds.id
    ).order_by(ConsumptionHourly.timestamp.asc()).limit(20).all()

    return [{
        "timestamp": r.timestamp.isoformat(),
        "energy_kwh": r.energy_kwh,
        "avg_power_kw": r.avg_power_kw,
        "max_power_kw": r.max_power_kw,
        "voltage": r.avg_voltage,
        "sub_metering_1": r.sub_metering_1,
        "sub_metering_2": r.sub_metering_2,
        "sub_metering_3": r.sub_metering_3
    } for r in readings]

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    DatasetService.delete_dataset(db, current_user, dataset_id)
    return {"message": "Dataset successfully deleted."}

@router.get("/template/download")
def download_template():
    tpl_path = SAMPLE_DIR / "sample_template.csv"
    if not tpl_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found.")
    return FileResponse(tpl_path, media_type="text/csv", filename="powerpulse_template.csv")

