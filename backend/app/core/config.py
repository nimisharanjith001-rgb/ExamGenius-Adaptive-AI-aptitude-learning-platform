import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    PROJECT_NAME: str = "PowerPulse AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "powerpulse_secret_super_key_jwt_token_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # SQLite database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/powerpulse.db")

    # Directories
    DATASET_STORAGE_DIR: Path = BASE_DIR / "uploaded_datasets"
    MODEL_STORAGE_DIR: Path = BASE_DIR / "trained_models"

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

settings = Settings()
settings.DATASET_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.MODEL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

