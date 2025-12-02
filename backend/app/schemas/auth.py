from pydantic import BaseModel, EmailStr, Field, field_serializer, model_validator
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VENDEDOR = "vendedor"
    ATENDENTE = "atendente"
    SUPORTE = "suporte"


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    role: Optional[UserRole] = UserRole.VENDEDOR
    estabelecimento_id: Optional[int] = None
    timezone: Optional[str] = "America/Sao_Paulo"

    @model_validator(mode='before')
    @classmethod
    def convert_empty_strings_to_none(cls, data):
        """Converte strings vazias para None em campos opcionais"""
        if isinstance(data, dict):
            for field in ['cpf', 'telefone', 'cargo']:
                if field in data and data[field] == '':
                    data[field] = None
        return data


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    role: Optional[UserRole] = None
    estabelecimento_id: Optional[int] = None
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    dias_trabalho: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def convert_empty_strings_to_none(cls, data):
        """Converte strings vazias para None em campos opcionais"""
        if isinstance(data, dict):
            for field in ['full_name', 'cpf', 'telefone', 'cargo', 'horario_inicio', 'horario_fim', 'dias_trabalho', 'timezone', 'avatar_url']:
                if field in data and data[field] == '':
                    data[field] = None
        return data


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    role: str  # Mudado de UserRole para str para aceitar qualquer valor e converter depois
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    timezone: str
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    dias_trabalho: str
    estabelecimento_id: Optional[int] = None
    estabelecimento_nome: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def normalize_role(cls, data):
        """Normaliza role para lowercase antes da validação"""
        if isinstance(data, dict) and 'role' in data:
            role_value = data['role']
            if isinstance(role_value, str):
                data['role'] = role_value.lower()
            elif hasattr(role_value, 'value'):
                data['role'] = role_value.value.lower()
        return data

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)