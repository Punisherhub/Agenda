from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MaterialBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)
    descricao: Optional[str] = None
    valor_custo: float = Field(..., gt=0)
    unidade_medida: str  # "ML", "UNIDADE", "GRAMA", "CM"
    quantidade_estoque: float = Field(..., ge=0)
    quantidade_minima: Optional[float] = None
    marca: Optional[str] = None
    fornecedor: Optional[str] = None


class MaterialCreate(MaterialBase):
    estabelecimento_id: int


class MaterialUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=255)
    descricao: Optional[str] = None
    valor_custo: Optional[float] = Field(None, gt=0)
    unidade_medida: Optional[str] = None
    quantidade_estoque: Optional[float] = Field(None, ge=0)
    quantidade_minima: Optional[float] = None
    marca: Optional[str] = None
    fornecedor: Optional[str] = None
    is_active: Optional[bool] = None


class MaterialResponse(MaterialBase):
    id: int
    is_active: bool
    estabelecimento_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class MaterialList(BaseModel):
    materiais: list[MaterialResponse]
    total: int


class ConsumoMaterialCreate(BaseModel):
    material_id: int
    quantidade_consumida: float = Field(..., gt=0)


class MaterialSimple(BaseModel):
    """Versão simplificada do material para inclusão em outras respostas"""
    id: int
    nome: str
    unidade_medida: str

    class Config:
        from_attributes = True


class ConsumoMaterialResponse(BaseModel):
    id: int
    agendamento_id: int
    material_id: int
    material: Optional[MaterialSimple] = None  # Incluir dados do material
    quantidade_consumida: float
    valor_custo_unitario: float
    valor_total: float
    created_at: datetime

    class Config:
        from_attributes = True
