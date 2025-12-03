from sqlalchemy import Column, Integer, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ConfiguracaoFidelidade(Base):
    __tablename__ = "configuracao_fidelidade"

    id = Column(Integer, primary_key=True, index=True)

    # Configuração de pontos
    reais_por_ponto = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Valor em reais para ganhar 1 ponto (ex: 100.00 = R$ 100 = 1 ponto)"
    )

    # Status
    ativo = Column(Boolean, default=False, nullable=False)

    # Foreign Key
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id", ondelete="CASCADE"), nullable=False, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento")
