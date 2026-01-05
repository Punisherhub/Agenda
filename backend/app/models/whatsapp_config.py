from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class WhatsAppConfig(Base):
    """
    Configurações do WhatsApp via WAHA (WhatsApp HTTP API) por estabelecimento.
    Cada estabelecimento pode ter sua própria sessão WAHA e templates customizados.
    """
    __tablename__ = "whatsapp_configs"

    id = Column(Integer, primary_key=True, index=True)

    # WAHA Credentials
    waha_url = Column(String(500), nullable=False)              # URL do WAHA (ex: https://waha.onrender.com)
    waha_api_key = Column(String(500), nullable=False)          # API Key do WAHA (X-Api-Key header)
    waha_session_name = Column(String(100), nullable=False)     # Nome da sessão WAHA (padrão: "default")

    # Templates de Mensagens (texto livre com placeholders {nome_cliente}, {data}, {hora}, {endereco}, etc.)
    template_agendamento = Column(Text, nullable=True)  # Confirmação de novo agendamento
    template_lembrete = Column(Text, nullable=True)     # Lembrete 24h antes
    template_conclusao = Column(Text, nullable=True)    # Notificação de conclusão do serviço
    template_cancelamento = Column(Text, nullable=True) # Notificação de cancelamento
    template_reciclagem = Column(Text, nullable=True)   # Reciclagem de clientes inativos
    template_aniversario = Column(Text, nullable=True)  # Mensagem de aniversário

    # Configurações de envio
    ativado = Column(Boolean, default=False)  # Ativar/desativar WhatsApp para este estabelecimento
    enviar_agendamento = Column(Boolean, default=True)      # Enviar ao criar agendamento
    enviar_lembrete = Column(Boolean, default=True)         # Enviar lembrete 24h antes
    enviar_conclusao = Column(Boolean, default=True)        # Enviar ao concluir serviço
    enviar_cancelamento = Column(Boolean, default=True)     # Enviar ao cancelar
    enviar_reciclagem = Column(Boolean, default=False)      # Enviar campanhas de reciclagem
    enviar_aniversario = Column(Boolean, default=True)      # Enviar mensagem de aniversário

    # Configurações de reciclagem/inatividade
    meses_inatividade = Column(Integer, default=3)  # Meses sem agendamento para considerar inativo
    link_agendamento = Column(String(500), nullable=True)  # Link direto para agendamento online

    # Foreign Key
    estabelecimento_id = Column(Integer, ForeignKey("estabelecimentos.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    estabelecimento = relationship("Estabelecimento", back_populates="whatsapp_config")
