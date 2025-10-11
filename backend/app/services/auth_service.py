from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import Optional

from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin
from app.utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from datetime import timedelta
from app.config import settings


class AuthService:
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user."""
        try:
            hashed_password = get_password_hash(user_data.password)

            db_user = User(
                email=user_data.email,
                username=user_data.username,
                full_name=user_data.full_name,
                hashed_password=hashed_password,
                timezone=user_data.timezone,
                is_active=True,
                is_verified=False
            )

            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            return db_user

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password."""
        user = db.query(User).filter(User.email == email).first()

        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user

    @staticmethod
    def login_user(db: Session, login_data: UserLogin) -> dict:
        """Login user and return tokens."""
        user = AuthService.authenticate_user(db, login_data.email, login_data.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account"
            )

        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )

        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
            "user": user
        }

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def update_user_verification(db: Session, user_id: int, is_verified: bool = True) -> User:
        """Update user verification status."""
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.is_verified = is_verified
        db.commit()
        db.refresh(user)

        return user