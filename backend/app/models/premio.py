from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Premio(Base):
    __tablename__ = "premios"

    id = Column(Integer, primary_key=True, index=True)

    # Dados do prêmio
    nome = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    pontos_necessarios = Column(Integer, nullable=False)

    # Tipo de prêmio: DESCONTO_PERCENTUAL, DESCONTO_FIXO, SERVICO_GRATIS, PRODUTO
    tipo_premio = Column(
        String(50),
        nullable=False,
        comment="DESCONTO_PERCENTUAL, DESCONTO_FIXO, SERVICO_GRATIS, PRODUTO"
    )

    # Valor do desconto (para descontos) - em % ou R$
    valor_desconto = Column(
        Numeric(10, 2),
        nullable=True,
        comment="Valor do desconto (% ou R$)"
    )

    # Serviço gratuito (se tipo_premio = SERVICO_GRATIS)
    servico_id = Column(
        Integer,
        ForeignKey("servicos.id", ondelete="SET NULL"),
        nullable=True,
        comment="Serviço gratuito (se aplicável)"
    )

    # Status
    ativo = Column(Boolean, default=True, nullable=False)

    # Foreign Key
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id", ondelete="CASCADE"), nullable=False, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento")
    servico = relationship("Servico")
