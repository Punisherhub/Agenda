from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ResgatePremio(Base):
    __tablename__ = "resgates_premios"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False, index=True)
    premio_id = Column(Integer, ForeignKey("premios.id"), nullable=False)
    usado_em_agendamento_id = Column(
        Integer,
        ForeignKey("agendamentos.id"),
        nullable=True,
        comment="Agendamento onde o prêmio foi usado"
    )

    # Dados do resgate
    pontos_utilizados = Column(Integer, nullable=False)
    data_resgate = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Status: DISPONIVEL, USADO, EXPIRADO
    status = Column(
        String(20),
        nullable=False,
        default="DISPONIVEL",
        index=True,
        comment="DISPONIVEL, USADO, EXPIRADO"
    )

    # Data de expiração (opcional)
    data_expiracao = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cliente = relationship("Cliente")
    premio = relationship("Premio")
    agendamento = relationship("Agendamento")
