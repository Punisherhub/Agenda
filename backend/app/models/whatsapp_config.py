from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class WhatsAppConfig(Base):
    """
    Configurações do WhatsApp Business API (Meta Cloud API) por estabelecimento.
    Cada estabelecimento pode ter suas próprias credenciais e templates.
    """
    __tablename__ = "whatsapp_configs"

    id = Column(Integer, primary_key=True, index=True)

    # Meta WhatsApp Business API Credentials
    meta_token = Column(String(500), nullable=False)  # Token de acesso da Meta API
    telefone_id = Column(String(100), nullable=False)  # Phone Number ID da Meta

    # Templates de Mensagens (usando placeholders {nome_cliente}, {data}, {hora}, etc.)
    template_agendamento = Column(Text, nullable=True)  # Confirmação de novo agendamento
    template_lembrete = Column(Text, nullable=True)     # Lembrete 24h antes
    template_confirmacao = Column(Text, nullable=True)  # Confirmação do agendamento
    template_cancelamento = Column(Text, nullable=True) # Notificação de cancelamento
    template_reciclagem = Column(Text, nullable=True)   # Reciclagem de clientes inativos

    # Nomes dos Templates HSM aprovados na Meta (necessário para produção)
    meta_template_agendamento = Column(String(255), nullable=True)    # Ex: "confirmacao_servico_saas"
    meta_template_lembrete = Column(String(255), nullable=True)       # Ex: "lembrete_24h_saas"
    meta_template_confirmacao = Column(String(255), nullable=True)    # Ex: "confirmacao_servico_saas"
    meta_template_cancelamento = Column(String(255), nullable=True)   # Ex: "cancelamento_servico_saas"
    meta_template_reciclagem = Column(String(255), nullable=True)     # Ex: "aviso_inatividade_personalizado"

    # Configurações de envio
    ativado = Column(Boolean, default=False)  # Ativar/desativar WhatsApp para este estabelecimento
    enviar_agendamento = Column(Boolean, default=True)      # Enviar ao criar agendamento
    enviar_lembrete = Column(Boolean, default=True)         # Enviar lembrete 24h antes
    enviar_confirmacao = Column(Boolean, default=True)      # Enviar ao confirmar
    enviar_cancelamento = Column(Boolean, default=True)     # Enviar ao cancelar
    enviar_reciclagem = Column(Boolean, default=False)      # Enviar campanhas de reciclagem

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
