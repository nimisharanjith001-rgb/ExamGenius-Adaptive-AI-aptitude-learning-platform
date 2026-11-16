from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import UserRegister, UserLogin, UserResponse, Token, VerifyCodeRequest, ResendCodeRequest
from app.services.auth_service import AuthService
from app.database.session import get_db
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    return AuthService.register_user(db, user_in)

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    return AuthService.authenticate_user(db, login_in)

@router.post("/verify-code", response_model=Token)
def verify_code(req: VerifyCodeRequest, db: Session = Depends(get_db)):
    return AuthService.verify_email_code(db, req.email, req.code)

@router.post("/resend-code")
def resend_code(req: ResendCodeRequest, db: Session = Depends(get_db)):
    return AuthService.resend_verification_code(db, req.email)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(AuthService.get_current_user)):
    return current_user
