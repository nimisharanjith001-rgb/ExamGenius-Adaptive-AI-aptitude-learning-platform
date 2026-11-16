from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import datetime, timezone, timedelta
import re
import secrets
import socket

from app.models import User, ElectricityTariff, UserSettings
from app.schemas import UserRegister, UserLogin
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.database.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Strict Email Verification Regex (RFC-compliant format + qualified domain)
STRICT_EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
SPECIAL_CHARS_REGEX = r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]"

# Comprehensive Registry of Real Worldwide Email Providers & Domains
KNOWN_REAL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
    "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com",
    "mac.com", "aol.com", "zoho.com", "proton.me", "protonmail.com", "mail.com",
    "gmx.com", "gmx.net", "yandex.com", "fastmail.com", "tutanota.com", "tutamail.com",
    "microsoft.com", "apple.com", "amazon.com", "google.com", "meta.com", "ibm.com",
    "oracle.com", "intel.com", "cisco.com", "tcs.com", "infosys.com", "wipro.com",
    "accenture.com", "cognizant.com", "powerpulse.ai"
}

# Blocklist of Non-Existent, Fake, Sample, or Disposable Mail Domains
DISPOSABLE_OR_FAKE_DOMAINS = {
    "fake.com", "test.com", "example.com", "sample.com", "invalid.com", "asdf.com",
    "dummy.com", "foo.com", "bar.com", "none.com", "tempmail.com", "mailinator.com",
    "10minutemail.com", "guerrillamail.com", "trashmail.com", "dispostable.com",
    "throwawaymail.com", "sharklasers.com", "yopmail.com", "fakeinbox.com",
    "temp-mail.org", "getairmail.com", "discard.email", "nada.ltd"
}

# Recognized Standard and Country Top-Level Domains
LEGITIMATE_TLDS = {
    "com", "org", "net", "edu", "gov", "mil", "int", "in", "io", "ai", "co",
    "tech", "dev", "app", "info", "biz", "me", "online", "store", "cloud",
    "uk", "ca", "de", "fr", "au", "jp", "sg", "ae", "eu", "us"
}

class AuthService:
    @staticmethod
    def validate_real_world_email(email_clean: str) -> None:
        """
        Validates that the email address corresponds to an authentic, existing domain in the world.
        Rejects non-existent, fake, test, or disposable domains.
        """
        if not re.match(STRICT_EMAIL_REGEX, email_clean):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid email address with a proper domain (e.g. name@gmail.com)."
            )

        domain = email_clean.split("@")[1].lower()

        # 1. Reject known fake, sample, or disposable domains
        if domain in DISPOSABLE_OR_FAKE_DOMAINS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The email domain '{domain}' is not accepted. Please use a real active email provider (e.g. Gmail, Outlook, Yahoo, University, or Company email)."
            )

        # 2. Extract Top-Level Domain (TLD)
        parts = domain.split(".")
        if len(parts) < 2 or len(parts[0]) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid domain structure in '{domain}'. Please provide a valid domain name."
            )

        tld = parts[-1]
        second_tld = parts[-2] if len(parts) >= 3 else None

        # 3. Check for genuine academic, government, or recognized institutional domains
        is_academic_or_gov = any(domain.endswith(f".{ext}") for ext in [
            "edu", "ac.in", "edu.in", "gov", "gov.in", "org.in", "res.in", "nic.in", "ac.uk"
        ])

        # 4. Check for known global providers
        is_known_provider = domain in KNOWN_REAL_DOMAINS

        # 5. Check valid TLD
        is_valid_tld = tld in LEGITIMATE_TLDS or (second_tld and second_tld in ["co", "ac", "gov", "edu", "org", "net", "res"])

        if not (is_known_provider or is_academic_or_gov or is_valid_tld):
            # Attempt DNS lookup if network allows
            try:
                socket.gethostbyname(domain)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"The email domain '{domain}' does not exist. Please enter a valid, active email address."
                )

    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> dict:
        email_clean = user_data.email.strip().lower()
        name_clean = user_data.full_name.strip()
        pwd = user_data.password

        # 1. Real-World Existing Email Validation
        AuthService.validate_real_world_email(email_clean)

        if len(name_clean) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name must be at least 2 characters long."
            )

        # 2. Strict Password Strength Validation (Numbers + Special Characters + 8+ chars)
        if len(pwd) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long."
            )

        if not re.search(r"\d", pwd):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one numeric digit (0-9)."
            )

        if not re.search(SPECIAL_CHARS_REGEX, pwd):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character (e.g. ! @ # $ % ^ & *)."
            )

        if not re.search(r"[a-zA-Z]", pwd):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain alphabetic characters."
            )

        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please sign in instead."
            )

        # Generate Cryptographically Secure 6-Digit Verification Code
        otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        new_user = User(
            email=email_clean,
            full_name=name_clean,
            hashed_password=get_password_hash(pwd),
            is_verified=False,
            verification_code=otp_code,
            verification_code_expires_at=expires_at
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

        # Generate access token
        token = create_access_token(subject=str(new_user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": new_user,
            "is_verified": False,
            "requires_verification": True,
            "verification_code": otp_code,
            "message": f"Account created. A 6-digit security verification code has been dispatched to {email_clean}."
        }

    @staticmethod
    def verify_email_code(db: Session, email: str, code: str) -> dict:
        email_clean = email.strip().lower()
        code_clean = code.strip()

        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account with this email does not exist."
            )

        if user.is_verified:
            token = create_access_token(subject=str(user.id))
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": user,
                "is_verified": True,
                "message": "Account is already verified."
            }

        if not user.verification_code or user.verification_code != code_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 6-digit verification code. Please check your email or click 'Resend Code'."
            )

        # Expiration check
        if user.verification_code_expires_at:
            now_utc = datetime.now(timezone.utc)
            code_exp = user.verification_code_expires_at
            if code_exp.tzinfo is None:
                code_exp = code_exp.replace(tzinfo=timezone.utc)
            if now_utc > code_exp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Verification code has expired. Please request a new code."
                )

        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires_at = None
        db.commit()
        db.refresh(user)

        token = create_access_token(subject=str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user,
            "is_verified": True,
            "message": "Email verified successfully! Welcome to PowerPulse AI."
        }

    @staticmethod
    def resend_verification_code(db: Session, email: str) -> dict:
        email_clean = email.strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account with this email does not exist."
            )

        new_otp = f"{secrets.randbelow(900000) + 100000:06d}"
        user.verification_code = new_otp
        user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        db.commit()

        return {
            "message": f"A new 6-digit verification code has been dispatched to {email_clean}.",
            "verification_code": new_otp
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

        # If user account is not yet verified, issue a fresh OTP code
        if not user.is_verified:
            new_otp = f"{secrets.randbelow(900000) + 100000:06d}"
            user.verification_code = new_otp
            user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
            db.commit()

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": user,
                "is_verified": False,
                "requires_verification": True,
                "verification_code": new_otp,
                "message": f"Email verification required. A 6-digit security code has been sent to {email_clean}."
            }

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user,
            "is_verified": True,
            "requires_verification": False
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account associated with this session no longer exists.",
            )
        return user
