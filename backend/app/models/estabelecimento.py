from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Time
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Estabelecimento(Base):
    __tablename__ = "estabelecimentos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    endereco = Column(Text, nullable=False)
    cidade = Column(String(100), nullable=False)
    estado = Column(String(2), nullable=False)
    cep = Column(String(10), nullable=False)
    telefone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)

    # Horário de funcionamento
    horario_abertura = Column(Time, nullable=True)
    horario_fechamento = Column(Time, nullable=True)
    dias_funcionamento = Column(String(7), default="1111100")  # 1=funciona, 0=não funciona (Dom-Sab)

    # Configurações
    is_active = Column(Boolean, default=True)
    capacidade_maxima = Column(Integer, default=10)  # Máximo de agendamentos simultâneos

    # Foreign Key
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    empresa = relationship("Empresa", back_populates="estabelecimentos")
    servicos = relationship("Servico", back_populates="estabelecimento", cascade="all, delete-orphan")
    usuarios = relationship("User", back_populates="estabelecimento")
    agendamentos = relationship("Agendamento", back_populates="estabelecimento")
    materiais = relationship("Material", back_populates="estabelecimento", cascade="all, delete-orphan")