from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.models import User, ElectricityTariff, UserSettings
from app.schemas import UserRegister, UserLogin
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.database.session import get_db

import re

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> dict:
        email_clean = user_data.email.strip().lower()
        name_clean = user_data.full_name.strip()
        pwd = user_data.password

        # Security validations
        if not re.match(EMAIL_REGEX, email_clean):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid email address."
            )

        if len(name_clean) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name must be at least 2 characters long."
            )

        if len(pwd) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )

        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please sign in instead."
            )

        new_user = User(
            email=email_clean,
            full_name=name_clean,
            hashed_password=get_password_hash(pwd)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Initialize Default user-specific tariff and settings (Isolated per user)
        default_tariff = ElectricityTariff(
            user_id=new_user.id,
            currency="₹",
            tariff_per_kwh=7.50,
            fixed_monthly_charge=120.00,
            tax_rate_pct=5.0
        )
        db.add(default_tariff)

        default_settings = UserSettings(
            user_id=new_user.id,
            default_currency="₹",
            default_tariff=7.50,
            theme="light"
        )
        db.add(default_settings)
        db.commit()

        # Generate instant JWT access token for seamless onboarding
        token = create_access_token(subject=str(new_user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": new_user
        }

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> dict:
        email_clean = login_data.email.strip().lower()
        pwd = login_data.password

        user = db.query(User).filter(User.email == email_clean).first()
        if not user or not verify_password(pwd, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password. Please verify your credentials or register a new account."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact support."
            )

        token = create_access_token(subject=str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials or session expired.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = int(payload["sub"])
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

        return user

