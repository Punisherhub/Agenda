from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class StatusAgendamento(enum.Enum):
    AGENDADO = "AGENDADO"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"
    NAO_COMPARECEU = "NAO_COMPARECEU"


class FormaPagamento(enum.Enum):
    DINHEIRO = "dinheiro"
    CARTAO_DEBITO = "cartao_debito"
    CARTAO_CREDITO = "cartao_credito"
    PIX = "pix"
    BOLETO = "boleto"
    PENDENTE = "pendente"


class Agendamento(Base):
    __tablename__ = "agendamentos"

    id = Column(Integer, primary_key=True, index=True)

    # Data e horário
    data_agendamento = Column(DateTime(timezone=True), nullable=False, index=True)
    data_inicio = Column(DateTime(timezone=True), nullable=False)
    data_fim = Column(DateTime(timezone=True), nullable=False)

    # Status e observações
    status = Column(Enum(StatusAgendamento), default=StatusAgendamento.AGENDADO, index=True)
    observacoes = Column(Text, nullable=True)
    observacoes_internas = Column(Text, nullable=True)  # Observações só para funcionários
    veiculo = Column(String(200), nullable=True)  # Modelo e placa do veículo (ex: "Honda Civic - ABC1234")

    # Serviço personalizado
    servico_personalizado = Column(Boolean, default=False)  # True se é serviço personalizado
    servico_personalizado_nome = Column(String(255), nullable=True)  # Nome do serviço personalizado
    servico_personalizado_descricao = Column(Text, nullable=True)  # Descrição opcional

    # Valores
    valor_servico = Column(Numeric(10, 2), nullable=False)
    valor_desconto = Column(Numeric(10, 2), default=0)
    valor_final = Column(Numeric(10, 2), nullable=False)
    forma_pagamento = Column(Enum(FormaPagamento), default=FormaPagamento.PENDENTE)

    # Avaliação (opcional)
    avaliacao_nota = Column(Integer, nullable=True)  # 1-5 estrelas
    avaliacao_comentario = Column(Text, nullable=True)

    # Foreign Keys
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    servico_id = Column(Integer, ForeignKey("servicos.id", ondelete="SET NULL"), nullable=True)  # Nullable para serviços personalizados
    vendedor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Quem fez o agendamento (pode ser NULL se usuário deletado)
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id", ondelete="CASCADE"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete (oculta do calendário)

    # WhatsApp notifications
    lembrete_enviado = Column(Boolean, default=False)  # Controla se já enviou lembrete 24h antes

    # Relationships
    cliente = relationship("Cliente", back_populates="agendamentos")
    servico = relationship("Servico", back_populates="agendamentos")
    vendedor = relationship("User", back_populates="agendamentos")
    estabelecimento = relationship("Estabelecimento", back_populates="agendamentos")
    consumos_materiais = relationship("ConsumoMaterial", back_populates="agendamento", cascade="all, delete-orphan")