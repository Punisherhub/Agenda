from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ==================== WhatsAppConfig ====================

class WhatsAppConfigBase(BaseModel):
    meta_token: str = Field(..., description="Token de acesso da Meta WhatsApp Business API")
    telefone_id: str = Field(..., description="Phone Number ID da Meta")

    # Templates (para referência interna e modo fallback)
    template_agendamento: Optional[str] = Field(None, description="Template para novo agendamento")
    template_lembrete: Optional[str] = Field(None, description="Template para lembrete 24h antes")
    template_confirmacao: Optional[str] = Field(None, description="Template para confirmação")
    template_cancelamento: Optional[str] = Field(None, description="Template para cancelamento")
    template_reciclagem: Optional[str] = Field(None, description="Template para reciclagem")

    # Nomes dos Templates HSM aprovados na Meta (PRODUÇÃO)
    meta_template_agendamento: Optional[str] = Field(None, description="Nome do template HSM aprovado para agendamento")
    meta_template_lembrete: Optional[str] = Field(None, description="Nome do template HSM aprovado para lembrete")
    meta_template_confirmacao: Optional[str] = Field(None, description="Nome do template HSM aprovado para confirmação")
    meta_template_cancelamento: Optional[str] = Field(None, description="Nome do template HSM aprovado para cancelamento")
    meta_template_reciclagem: Optional[str] = Field(None, description="Nome do template HSM aprovado para reciclagem")

    # Configurações de envio
    ativado: bool = False
    enviar_agendamento: bool = True
    enviar_lembrete: bool = True
    enviar_confirmacao: bool = True
    enviar_cancelamento: bool = True
    enviar_reciclagem: bool = False

    # Configurações de reciclagem
    meses_inatividade: int = Field(3, description="Meses sem agendamento para considerar inativo")
    link_agendamento: Optional[str] = Field(None, description="Link direto para agendamento online")


class WhatsAppConfigCreate(WhatsAppConfigBase):
    estabelecimento_id: Optional[int] = None  # Será preenchido automaticamente pelo backend


class WhatsAppConfigUpdate(BaseModel):
    meta_token: Optional[str] = None
    telefone_id: Optional[str] = None
    template_agendamento: Optional[str] = None
    template_lembrete: Optional[str] = None
    template_confirmacao: Optional[str] = None
    template_cancelamento: Optional[str] = None
    template_reciclagem: Optional[str] = None
    meta_template_agendamento: Optional[str] = None
    meta_template_lembrete: Optional[str] = None
    meta_template_confirmacao: Optional[str] = None
    meta_template_cancelamento: Optional[str] = None
    meta_template_reciclagem: Optional[str] = None
    ativado: Optional[bool] = None
    enviar_agendamento: Optional[bool] = None
    enviar_lembrete: Optional[bool] = None
    enviar_confirmacao: Optional[bool] = None
    enviar_cancelamento: Optional[bool] = None
    enviar_reciclagem: Optional[bool] = None
    meses_inatividade: Optional[int] = None
    link_agendamento: Optional[str] = None


class WhatsAppConfigResponse(WhatsAppConfigBase):
    id: int
    estabelecimento_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ==================== WhatsApp Message ====================

class WhatsAppMessageRequest(BaseModel):
    cliente_id: int = Field(..., description="ID do cliente para enviar mensagem")
    tipo_mensagem: str = Field(..., description="Tipo: AGENDAMENTO, LEMBRETE, CONFIRMACAO, CANCELAMENTO, RECICLAGEM")
    agendamento_id: Optional[int] = Field(None, description="ID do agendamento (se aplicável)")
    mensagem_customizada: Optional[str] = Field(None, description="Mensagem customizada (sobrescreve template)")


class WhatsAppMessageResponse(BaseModel):
    sucesso: bool
    mensagem_id: Optional[str] = None  # ID da mensagem retornado pela Meta API
    erro: Optional[str] = None
    telefone_destino: str


# ==================== WhatsApp Test ====================

class WhatsAppTestRequest(BaseModel):
    telefone: str = Field(..., description="Número de telefone para teste (formato: +5511999999999)")
    mensagem: str = Field(..., description="Mensagem de teste")
