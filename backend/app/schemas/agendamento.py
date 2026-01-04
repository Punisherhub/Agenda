from pydantic import BaseModel, Field, ConfigDict, field_validator, field_serializer
from typing import Optional, List, Any, Union
from datetime import datetime
from decimal import Decimal
from enum import Enum


class StatusAgendamento(str, Enum):
    AGENDADO = "AGENDADO"
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

    @field_validator('data_inicio', 'data_fim', mode='before')
    @classmethod
    def parse_datetime_brasil(cls, v: Optional[str | datetime]) -> Optional[datetime]:
        """Parsear datetime e SEMPRE assumir que é hora do Brasil"""
        if v is None:
            return None

        from zoneinfo import ZoneInfo
        from datetime import datetime as dt

        # Se já é datetime, verificar timezone
        if isinstance(v, datetime):
            print(f"[VALIDATOR BEFORE] Datetime object recebido: {v}, tzinfo: {v.tzinfo}")
            # Se tem timezone, converter para Brasil
            if v.tzinfo is not None:
                # Pegar apenas os componentes de data/hora (ignorar timezone que veio)
                v_naive = v.replace(tzinfo=None)
                print(f"[VALIDATOR BEFORE] Removido timezone, ficou: {v_naive}")
                # Adicionar timezone do Brasil
                v_brasil = v_naive.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
                print(f"[VALIDATOR BEFORE] Adicionado timezone Brasil: {v_brasil}")
                return v_brasil
            else:
                # Se não tem timezone, adicionar Brasil
                v_brasil = v.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
                print(f"[VALIDATOR BEFORE] Sem timezone, adicionado Brasil: {v_brasil}")
                return v_brasil

        # Se é string, parsear como naive e adicionar Brasil
        if isinstance(v, str):
            print(f"[VALIDATOR BEFORE] String recebida: {v}")
            # Remover timezone se tiver na string
            if '+' in v or v.endswith('Z'):
                v = v.split('+')[0].split('Z')[0]
                print(f"[VALIDATOR BEFORE] Removido timezone da string: {v}")

            # Parsear como naive
            v_naive = dt.fromisoformat(v)
            # Adicionar timezone Brasil
            v_brasil = v_naive.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
            print(f"[VALIDATOR BEFORE] Parseado e adicionado Brasil: {v_brasil}")
            return v_brasil

        return v


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
    forma_pagamento: Optional[FormaPagamento] = None  # DEPRECATED: não mais coletado
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
    deleted_at: Optional[datetime] = None

    # Campos de serviço personalizado
    servico_personalizado: Optional[bool] = False
    servico_personalizado_nome: Optional[str] = None
    servico_personalizado_descricao: Optional[str] = None

    @field_serializer('data_agendamento', 'data_inicio', 'data_fim', 'created_at', 'updated_at', 'canceled_at', 'completed_at', 'deleted_at')
    def serialize_datetime_brasil(self, dt: Optional[datetime], _info) -> Optional[str]:
        """Serializar datetime mantendo timezone do Brasil"""
        if dt is None:
            return None

        from zoneinfo import ZoneInfo

        # Se já tem timezone do Brasil, retornar ISO string com timezone
        if dt.tzinfo is not None:
            # Garantir que está no timezone do Brasil
            if str(dt.tzinfo) != 'America/Sao_Paulo':
                dt = dt.astimezone(ZoneInfo('America/Sao_Paulo'))
            # Retornar ISO string COM timezone (não UTC)
            return dt.isoformat()

        # Se não tem timezone, adicionar Brasil e retornar
        dt_brasil = dt.replace(tzinfo=ZoneInfo('America/Sao_Paulo'))
        return dt_brasil.isoformat()

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