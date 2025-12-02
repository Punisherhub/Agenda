from pydantic import BaseModel, EmailStr, Field, field_serializer
from typing import Optional, List, Any, TYPE_CHECKING
from datetime import datetime, time

if TYPE_CHECKING:
    from app.schemas.empresa import EmpresaResponse


class EstabelecimentoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    endereco: str = Field(..., min_length=5)
    cidade: str = Field(..., min_length=2, max_length=100)
    estado: str = Field(..., min_length=2, max_length=2)
    cep: str = Field(..., min_length=8, max_length=10)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    horario_abertura: Optional[time] = None
    horario_fechamento: Optional[time] = None
    dias_funcionamento: Optional[str] = Field("1111100", min_length=7, max_length=7)  # Dom-Sab
    capacidade_maxima: Optional[int] = Field(10, ge=1, le=100)
    empresa_id: int


class EstabelecimentoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    endereco: Optional[str] = Field(None, min_length=5)
    cidade: Optional[str] = Field(None, min_length=2, max_length=100)
    estado: Optional[str] = Field(None, min_length=2, max_length=2)
    cep: Optional[str] = Field(None, min_length=8, max_length=10)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    horario_abertura: Optional[time] = None
    horario_fechamento: Optional[time] = None
    dias_funcionamento: Optional[str] = Field(None, min_length=7, max_length=7)
    capacidade_maxima: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None


class EmpresaSimpleResponse(BaseModel):
    """Schema simplificado de empresa para evitar import circular"""
    id: int
    nome: str
    cnpj: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class EstabelecimentoResponse(BaseModel):
    id: int
    nome: str
    endereco: str
    cidade: str
    estado: str
    cep: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    horario_abertura: Optional[time] = None
    horario_fechamento: Optional[time] = None
    dias_funcionamento: str
    is_active: bool
    capacidade_maxima: int
    empresa_id: int
    empresa: Optional[EmpresaSimpleResponse] = None  # Incluir dados da empresa
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('horario_abertura', 'horario_fechamento')
    def serialize_time(self, value: Optional[time]) -> Optional[str]:
        """Serializar time como string HH:MM:SS"""
        if value is None:
            return None
        return value.strftime('%H:%M:%S')

    class Config:
        from_attributes = True


class EstabelecimentoList(BaseModel):
    estabelecimentos: List[EstabelecimentoResponse]
    total: int