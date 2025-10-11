from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class EmpresaCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    cnpj: str = Field(..., min_length=14, max_length=18)
    email: EmailStr
    telefone: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    website: Optional[str] = Field(None, max_length=255)


class EmpresaUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    website: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    logo_url: Optional[str] = Field(None, max_length=500)


class EmpresaResponse(BaseModel):
    id: int
    nome: str
    cnpj: str
    email: str
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    is_active: bool
    logo_url: Optional[str] = None
    website: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmpresaList(BaseModel):
    empresas: List[EmpresaResponse]
    total: int