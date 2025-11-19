from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


class ClienteCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    telefone: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    data_nascimento: Optional[date] = None
    genero: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    observacoes: Optional[str] = None
    preferencias: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    telefone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    data_nascimento: Optional[date] = None
    genero: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    observacoes: Optional[str] = None
    preferencias: Optional[str] = None
    is_active: Optional[bool] = None


class ClienteResponse(BaseModel):
    id: int
    nome: str
    email: Optional[str] = None
    telefone: str
    cpf: Optional[str] = None
    data_nascimento: Optional[date] = None
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