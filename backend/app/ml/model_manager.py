import os
import joblib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings

class ModelManager:
    @staticmethod
    def _get_model_dir(dataset_id: int, user_id: Optional[int] = None) -> Path:
        prefix = f"user_{user_id}_dataset_{dataset_id}" if user_id else f"dataset_{dataset_id}"
        p = settings.MODEL_STORAGE_DIR / prefix
        p.mkdir(parents=True, exist_ok=True)
        return p

    @staticmethod
    def save_model(dataset_id: int, model_name: str, model_obj: Any, metadata: Dict[str, Any], user_id: Optional[int] = None):
        model_dir = ModelManager._get_model_dir(dataset_id, user_id)
        model_file = model_dir / f"{model_name}.joblib"
        meta_file = model_dir / f"{model_name}_metadata.json"

        joblib.dump(model_obj, model_file)
        
        metadata["saved_at"] = datetime.now(timezone.utc).isoformat()
        metadata["model_name"] = model_name
        metadata["dataset_id"] = dataset_id
        if user_id:
            metadata["user_id"] = user_id

        with open(meta_file, "w") as f:
            json.dump(metadata, f, indent=2)

    @staticmethod
    def load_model(dataset_id: int, model_name: str, user_id: Optional[int] = None) -> Optional[Tuple[Any, Dict[str, Any]]]:
        model_dir = ModelManager._get_model_dir(dataset_id, user_id)
        model_file = model_dir / f"{model_name}.joblib"
        meta_file = model_dir / f"{model_name}_metadata.json"

        # Fallback to non-user-prefixed if migrating
        if not model_file.exists() and user_id:
            fallback_file = ModelManager._get_model_dir(dataset_id) / f"{model_name}.joblib"
            if fallback_file.exists():
                model_file = fallback_file
                meta_file = ModelManager._get_model_dir(dataset_id) / f"{model_name}_metadata.json"

        if not model_file.exists():
            return None

        try:
            model_obj = joblib.load(model_file)
            meta = {}
            if meta_file.exists():
                with open(meta_file, "r") as f:
                    meta = json.load(f)
            return model_obj, meta
        except Exception:
            return None
