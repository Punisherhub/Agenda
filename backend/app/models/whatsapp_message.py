from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class WhatsAppMessage(Base):
    """
    Armazena mensagens WhatsApp recebidas via webhook do WAHA.

    Esta tabela permite:
    - Analytics de mensagens
    - Auditoria de comunicações
    - Relatórios de engajamento
    - Histórico completo
    """
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)

    # Identificação da mensagem
    message_id = Column(String(255), nullable=False, index=True)  # ID único do WhatsApp
    session_name = Column(String(100), nullable=False)  # Nome da sessão WAHA

    # Remetente e destinatário
    from_number = Column(String(50), nullable=False, index=True)  # Número do remetente
    to_number = Column(String(50), nullable=True)  # Número do destinatário
    from_me = Column(Boolean, default=False)  # True se enviada por nós

    # Conteúdo
    body = Column(Text, nullable=True)  # Texto da mensagem
    has_media = Column(Boolean, default=False)  # Se tem mídia anexa
    media_url = Column(String(1000), nullable=True)  # URL da mídia (se aplicável)

    # Metadata
    event_type = Column(String(50), nullable=False)  # message.any, message.ack, etc
    message_timestamp = Column(DateTime(timezone=True), nullable=False)  # Timestamp do WhatsApp
    ack_status = Column(String(20), nullable=True)  # server, delivery, read, played

    # Payload completo (para casos especiais)
    payload_json = Column(JSON, nullable=True)  # Payload completo do webhook

    # Relacionamento
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id", ondelete="CASCADE"), nullable=False)

    # Timestamps do banco
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento")
