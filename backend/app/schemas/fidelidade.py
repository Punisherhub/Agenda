from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ==================== ConfiguracaoFidelidade ====================

class ConfiguracaoFidelidadeBase(BaseModel):
    reais_por_ponto: Decimal = Field(..., description="Valor em reais para ganhar 1 ponto")
    ativo: bool = True


class ConfiguracaoFidelidadeCreate(ConfiguracaoFidelidadeBase):
    estabelecimento_id: Optional[int] = None  # Será preenchido automaticamente pelo backend


class ConfiguracaoFidelidadeUpdate(BaseModel):
    reais_por_ponto: Optional[Decimal] = None
    ativo: Optional[bool] = None


class ConfiguracaoFidelidadeResponse(ConfiguracaoFidelidadeBase):
    id: int
    estabelecimento_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ==================== Premio ====================

class PremioBase(BaseModel):
    nome: str = Field(..., max_length=100)
    descricao: Optional[str] = None
    pontos_necessarios: int = Field(..., gt=0)
    tipo_premio: str = Field(..., description="DESCONTO_PERCENTUAL, DESCONTO_FIXO, SERVICO_GRATIS, PRODUTO")
    valor_desconto: Optional[Decimal] = None
    servico_id: Optional[int] = None
    ativo: bool = True


class PremioCreate(PremioBase):
    estabelecimento_id: Optional[int] = None  # Será preenchido automaticamente pelo backend


class PremioUpdate(BaseModel):
    nome: Optional[str] = Field(None, max_length=100)
    descricao: Optional[str] = None
    pontos_necessarios: Optional[int] = Field(None, gt=0)
    tipo_premio: Optional[str] = None
    valor_desconto: Optional[Decimal] = None
    servico_id: Optional[int] = None
    ativo: Optional[bool] = None


class PremioResponse(PremioBase):
    id: int
    estabelecimento_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ==================== ResgatePremio ====================

class ResgatePremioBase(BaseModel):
    cliente_id: int
    premio_id: int
    pontos_utilizados: int


class ResgatePremioCreate(ResgatePremioBase):
    pass


class ResgatePremioUpdate(BaseModel):
    status: Optional[str] = Field(None, description="DISPONIVEL, USADO, EXPIRADO")
    usado_em_agendamento_id: Optional[int] = None
    data_expiracao: Optional[datetime] = None


class ResgatePremioResponse(ResgatePremioBase):
    id: int
    data_resgate: datetime
    status: str
    usado_em_agendamento_id: Optional[int]
    data_expiracao: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ==================== Schemas auxiliares ====================

class PontosClienteResponse(BaseModel):
    """Resposta com pontos do cliente"""
    cliente_id: int
    nome_cliente: str
    pontos_atuais: int
    historico_resgates: list[ResgatePremioResponse]

    class Config:
        from_attributes = True


class PremiosDisponiveisResponse(BaseModel):
    """Prêmios que o cliente pode resgatar"""
    premio: PremioResponse
    pode_resgatar: bool
    pontos_faltantes: int = 0

    class Config:
        from_attributes = True
