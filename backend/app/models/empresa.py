from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)
    endereco = Column(Text, nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    cep = Column(String(10), nullable=True)

    # Configurações
    is_active = Column(Boolean, default=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    estabelecimentos = relationship("Estabelecimento", back_populates="empresa", cascade="all, delete-orphan")