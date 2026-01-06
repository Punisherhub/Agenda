from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


class ClienteCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    telefone: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    data_aniversario: Optional[str] = Field(None, max_length=5, description="Formato DD/MM (ex: 15/03)")
    genero: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    observacoes: Optional[str] = None
    preferencias: Optional[str] = None

    @field_validator('data_aniversario')
    @classmethod
    def validate_data_aniversario(cls, v):
        if v is None or v == "":
            return None

        # Validar formato DD/MM
        pattern = r'^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$'
        if not re.match(pattern, v):
            raise ValueError('Data de aniversário deve estar no formato DD/MM (ex: 15/03)')

        return v


class ClienteUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    telefone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    data_aniversario: Optional[str] = Field(None, max_length=5, description="Formato DD/MM (ex: 15/03)")
    genero: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    observacoes: Optional[str] = None
    preferencias: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('data_aniversario')
    @classmethod
    def validate_data_aniversario(cls, v):
        if v is None or v == "":
            return None

        # Validar formato DD/MM
        pattern = r'^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$'
        if not re.match(pattern, v):
            raise ValueError('Data de aniversário deve estar no formato DD/MM (ex: 15/03)')

        return v


class ClienteResponse(BaseModel):
    id: int
    nome: str
    email: Optional[str] = None
    telefone: str
    cpf: Optional[str] = None
    data_aniversario: Optional[str] = None
    genero: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    observacoes: Optional[str] = None
    preferencias: Optional[str] = None
    pontos: int = 0
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_visit: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClienteList(BaseModel):
    clientes: List[ClienteResponse]
    total: int


class ClientePublic(BaseModel):
    """Schema público simplificado para clientes"""
    id: int
    nome: str
    telefone: str

    class Config:
        from_attributes = True


class ClienteSearch(BaseModel):
    """Schema para busca de clientes"""
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    cpf: Optional[str] = None