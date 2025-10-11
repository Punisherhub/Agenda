from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UnidadeMedida(enum.Enum):
    ML = "ML"           # Mililitros (líquidos)
    UNIDADE = "UNIDADE" # Unidades (itens)
    GRAMA = "GRAMA"     # Gramas (sólidos)


class Material(Base):
    __tablename__ = "materiais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    descricao = Column(String(500), nullable=True)

    # Custos e quantidades
    valor_custo = Column(Float, nullable=False)  # Custo por unidade/ml/grama

    # Estoque
    unidade_medida = Column(Enum(UnidadeMedida), nullable=False, default=UnidadeMedida.UNIDADE)
    quantidade_estoque = Column(Float, nullable=False, default=0)  # Quantidade atual em estoque
    quantidade_minima = Column(Float, nullable=True)  # Alerta de estoque mínimo

    # Marca/Fornecedor
    marca = Column(String(255), nullable=True)
    fornecedor = Column(String(255), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento", back_populates="materiais")
    consumos = relationship("ConsumoMaterial", back_populates="material")
