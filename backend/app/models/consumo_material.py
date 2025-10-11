from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ConsumoMaterial(Base):
    """Registro de consumo de materiais em agendamentos"""
    __tablename__ = "consumos_materiais"

    id = Column(Integer, primary_key=True, index=True)

    # Relacionamentos
    agendamento_id = Column(Integer, ForeignKey("agendamentos.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiais.id"), nullable=False)

    # Quantidade consumida
    quantidade_consumida = Column(Float, nullable=False)  # Quantidade em ml/unidade/grama

    # Custo no momento do consumo (registrado para histórico)
    valor_custo_unitario = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)  # quantidade * valor_custo_unitario

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    agendamento = relationship("Agendamento", back_populates="consumos_materiais")
    material = relationship("Material", back_populates="consumos")
