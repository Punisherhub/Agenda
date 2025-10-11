from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Servico(Base):
    __tablename__ = "servicos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)

    # Preço e duração
    preco = Column(Numeric(10, 2), nullable=False)
    duracao_minutos = Column(Integer, nullable=False, default=60)  # Duração em minutos

    # Configurações
    is_active = Column(Boolean, default=True)
    cor = Column(String(7), default="#3788d8")  # Cor para exibição na agenda
    categoria = Column(String(100), nullable=True)  # Ex: "Mecânica", "Estética", etc.

    # Requer agendamento prévio?
    requer_agendamento = Column(Boolean, default=True)

    # Foreign Key
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento", back_populates="servicos")
    agendamentos = relationship("Agendamento", back_populates="servico")