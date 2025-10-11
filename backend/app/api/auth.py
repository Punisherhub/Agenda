from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.utils.auth import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = AuthService.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    existing_username = AuthService.get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    user = AuthService.create_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token."""
    login_result = AuthService.login_user(db, login_data)

    return Token(
        access_token=login_result["access_token"],
        token_type=login_result["token_type"],
        expires_in=login_result["expires_in"]
    )


@router.post("/refresh", response_model=Token)
async def refresh_token():
    """Refresh access token using refresh token."""
    return {"message": "Token refresh endpoint - to be implemented"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current authenticated user."""
    return current_user