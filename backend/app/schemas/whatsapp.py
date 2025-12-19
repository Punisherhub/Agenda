from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ==================== WhatsAppConfig ====================

class WhatsAppConfigBase(BaseModel):
    # Evolution API Credentials
    evolution_api_url: str = Field(..., description="URL da Evolution API (ex: https://evolution.onrender.com)")
    evolution_api_key: str = Field(..., description="API Key da Evolution API")
    evolution_instance_name: str = Field(..., description="Nome da instância WhatsApp")

    # Templates (texto livre com placeholders)
    template_agendamento: Optional[str] = Field(None, description="Template para novo agendamento")
    template_lembrete: Optional[str] = Field(None, description="Template para lembrete 24h antes")
    template_confirmacao: Optional[str] = Field(None, description="Template para confirmação")
    template_cancelamento: Optional[str] = Field(None, description="Template para cancelamento")
    template_reciclagem: Optional[str] = Field(None, description="Template para reciclagem")

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
    # Evolution API Credentials
    evolution_api_url: Optional[str] = None
    evolution_api_key: Optional[str] = None
    evolution_instance_name: Optional[str] = None

    # Templates
    template_agendamento: Optional[str] = None
    template_lembrete: Optional[str] = None
    template_confirmacao: Optional[str] = None
    template_cancelamento: Optional[str] = None
    template_reciclagem: Optional[str] = None

    # Configurações
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
    mensagem_id: Optional[str] = None  # ID da mensagem retornado pela Evolution API
    erro: Optional[str] = None
    telefone_destino: str


# ==================== WhatsApp Test ====================

class WhatsAppTestRequest(BaseModel):
    telefone: str = Field(..., description="Número de telefone para teste (formato: +5511999999999)")
    mensagem: str = Field(..., description="Mensagem de teste")
