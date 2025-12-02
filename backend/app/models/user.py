from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(enum.Enum):
    ADMIN = "admin"              # Administrador da empresa
    MANAGER = "manager"          # Gerente do estabelecimento
    VENDEDOR = "vendedor"        # Vendedor/Funcionário
    ATENDENTE = "atendente"      # Atendente
    SUPORTE = "suporte"          # Suporte técnico


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Dados do funcionário
    cpf = Column(String(14), nullable=True, unique=True)
    telefone = Column(String(20), nullable=True)
    cargo = Column(String(100), nullable=True)
    role = Column(String(20), default="vendedor")  # Armazenar como string ao invés de enum

    # Status e configurações
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    timezone = Column(String(50), default="America/Sao_Paulo")

    # Horário de trabalho
    horario_inicio = Column(String(5), nullable=True)  # Ex: "08:00"
    horario_fim = Column(String(5), nullable=True)     # Ex: "18:00"
    dias_trabalho = Column(String(7), default="1111100")  # 1=trabalha, 0=não trabalha (Dom-Sab)

    # Foreign Key
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento", back_populates="usuarios")
    agendamentos = relationship("Agendamento", back_populates="vendedor")