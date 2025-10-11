from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ServicoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    descricao: Optional[str] = None
    preco: Decimal = Field(..., ge=0, decimal_places=2)
    duracao_minutos: int = Field(..., ge=15)  # Mínimo 15 minutos
    categoria: Optional[str] = Field(None, max_length=100)
    cor: Optional[str] = Field("#3788d8", min_length=7, max_length=7)  # Hex color
    requer_agendamento: Optional[bool] = True
    estabelecimento_id: int


class ServicoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    descricao: Optional[str] = None
    preco: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    duracao_minutos: Optional[int] = Field(None, ge=15)
    categoria: Optional[str] = Field(None, max_length=100)
    cor: Optional[str] = Field(None, min_length=7, max_length=7)
    requer_agendamento: Optional[bool] = None
    is_active: Optional[bool] = None


class ServicoResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    preco: Decimal
    duracao_minutos: int
    is_active: bool
    cor: str
    categoria: Optional[str] = None
    requer_agendamento: bool
    estabelecimento_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ServicoList(BaseModel):
    servicos: List[ServicoResponse]
    total: int


class ServicoPublic(BaseModel):
    """Schema público para clientes visualizarem serviços"""
    id: int
    nome: str
    descricao: Optional[str] = None
    preco: Decimal
    duracao_minutos: int
    categoria: Optional[str] = None
    cor: str

    class Config:
        from_attributes = True