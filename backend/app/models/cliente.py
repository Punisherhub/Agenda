from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    telefone = Column(String(20), nullable=False, index=True)
    cpf = Column(String(14), nullable=True, index=True)

    # Dados pessoais
    data_nascimento = Column(Date, nullable=True)
    genero = Column(String(20), nullable=True)  # M, F, Outro
    endereco = Column(Text, nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    cep = Column(String(10), nullable=True)

    # Observações e preferências
    observacoes = Column(Text, nullable=True)
    preferencias = Column(Text, nullable=True)  # JSON string com preferências

    # Programa de fidelidade
    pontos = Column(Integer, default=0, nullable=False)

    # Status
    is_active = Column(Boolean, default=True)

    # Foreign Key
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id", ondelete="CASCADE"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_visit = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    estabelecimento = relationship("Estabelecimento", back_populates="clientes")
    agendamentos = relationship("Agendamento", back_populates="cliente", cascade="all, delete-orphan")