from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any, Union
from datetime import datetime
from decimal import Decimal
from enum import Enum


class StatusAgendamento(str, Enum):
    AGENDADO = "AGENDADO"
    CONFIRMADO = "CONFIRMADO"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"
    NAO_COMPARECEU = "NAO_COMPARECEU"


class FormaPagamento(str, Enum):
    DINHEIRO = "dinheiro"
    CARTAO_DEBITO = "cartao_debito"
    CARTAO_CREDITO = "cartao_credito"
    PIX = "pix"
    BOLETO = "boleto"
    PENDENTE = "pendente"


class AgendamentoCreate(BaseModel):
    data_inicio: datetime
    data_fim: Optional[datetime] = None
    cliente_id: int
    servico_id: Union[int, None] = None  # Aceita int ou None explicitamente
    observacoes: Optional[str] = None
    valor_desconto: Optional[Decimal] = Field(default=0, ge=0)

    # Campos para serviço personalizado
    servico_personalizado: bool = False
    servico_personalizado_nome: Optional[str] = None
    servico_personalizado_descricao: Optional[str] = None
    valor_servico_personalizado: Optional[Decimal] = None  # Preço do serviço personalizado


class AgendamentoUpdate(BaseModel):
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    status: Optional[StatusAgendamento] = None
    observacoes: Optional[str] = None
    observacoes_internas: Optional[str] = None
    valor_desconto: Optional[Decimal] = Field(None, ge=0)
    forma_pagamento: Optional[FormaPagamento] = None
    avaliacao_nota: Optional[int] = Field(None, ge=1, le=5)
    avaliacao_comentario: Optional[str] = None
    cliente_id: Optional[int] = None
    servico_id: Optional[int] = None


class AgendamentoResponse(BaseModel):
    id: int
    data_agendamento: datetime
    data_inicio: datetime
    data_fim: datetime
    status: StatusAgendamento
    observacoes: Optional[str] = None
    observacoes_internas: Optional[str] = None
    valor_servico: Decimal
    valor_desconto: Decimal
    valor_final: Decimal
    forma_pagamento: FormaPagamento
    avaliacao_nota: Optional[int] = None
    avaliacao_comentario: Optional[str] = None
    cliente_id: int
    servico_id: Optional[int] = None  # Nullable para serviços personalizados
    vendedor_id: int
    estabelecimento_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Campos de serviço personalizado
    servico_personalizado: Optional[bool] = False
    servico_personalizado_nome: Optional[str] = None
    servico_personalizado_descricao: Optional[str] = None

    class Config:
        from_attributes = True


class AgendamentoDetalhado(AgendamentoResponse):
    """Agendamento com dados relacionados"""
    cliente: Optional[Any] = None
    servico: Optional[Any] = None
    vendedor: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class AgendamentoList(BaseModel):
    agendamentos: List[AgendamentoDetalhado]
    total: int


class AgendamentoCalendar(BaseModel):
    """Schema simplificado para visualização no calendário"""
    id: int
    titulo: str  # Nome do serviço
    data_inicio: datetime
    data_fim: datetime
    status: StatusAgendamento
    cliente_nome: str
    servico_nome: str
    cor: str  # Cor do serviço

    class Config:
        from_attributes = True


class AgendamentoFiltros(BaseModel):
    """Filtros para busca de agendamentos"""
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    status: Optional[StatusAgendamento] = None
    cliente_id: Optional[int] = None
    servico_id: Optional[int] = None
    vendedor_id: Optional[int] = None
    estabelecimento_id: Optional[int] = None


class AgendamentoStatusUpdate(BaseModel):
    """Schema para atualização rápida de status"""
    status: StatusAgendamento
    observacoes_internas: Optional[str] = None