from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VENDEDOR = "vendedor"
    ATENDENTE = "atendente"


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    telefone: Optional[str] = Field(None, max_length=20)
    cargo: Optional[str] = Field(None, max_length=100)
    role: Optional[UserRole] = UserRole.VENDEDOR
    estabelecimento_id: Optional[int] = None
    timezone: Optional[str] = "America/Sao_Paulo"


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    telefone: Optional[str] = Field(None, max_length=20)
    cargo: Optional[str] = Field(None, max_length=100)
    role: Optional[UserRole] = None
    estabelecimento_id: Optional[int] = None
    horario_inicio: Optional[str] = Field(None, max_length=5)  # "08:00"
    horario_fim: Optional[str] = Field(None, max_length=5)     # "18:00"
    dias_trabalho: Optional[str] = Field(None, min_length=7, max_length=7)
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    timezone: str
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    dias_trabalho: str
    estabelecimento_id: Optional[int] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)