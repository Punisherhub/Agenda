from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.auth import get_current_active_user
from app.utils.permissions import check_admin_or_manager
from app.services.whatsapp_service import WhatsAppService
from app.schemas.whatsapp import (
    WhatsAppConfigCreate,
    WhatsAppConfigUpdate,
    WhatsAppConfigResponse,
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppTestRequest,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


# ==================== Configuração ====================

@router.get("/config", response_model=WhatsAppConfigResponse)
def get_config(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Busca configuração do WhatsApp do estabelecimento"""
    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração do WhatsApp não encontrada"
        )
    return config


@router.post("/config", response_model=WhatsAppConfigResponse, status_code=status.HTTP_201_CREATED)
def create_config(
    config_data: WhatsAppConfigCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cria configuração do WhatsApp (Admin/Manager apenas).

    **Importante**: Obtenha o `meta_token` e `telefone_id` no Meta Business Manager:
    1. Acesse https://business.facebook.com/
    2. Selecione sua conta de negócios
    3. Vá em "WhatsApp Business" > "Configurações da API"
    4. Copie o "Token de Acesso" (meta_token)
    5. Copie o "Phone Number ID" (telefone_id)
    """
    check_admin_or_manager(current_user)
    # Força estabelecimento do usuário logado
    config_data.estabelecimento_id = current_user.estabelecimento_id
    return WhatsAppService.create_config(db, config_data)


@router.put("/config", response_model=WhatsAppConfigResponse)
def update_config(
    config_data: WhatsAppConfigUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Atualiza configuração do WhatsApp (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    return WhatsAppService.update_config(db, current_user.estabelecimento_id, config_data)


@router.delete("/config", status_code=status.HTTP_204_NO_CONTENT)
def delete_config(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove configuração do WhatsApp (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    WhatsAppService.delete_config(db, current_user.estabelecimento_id)


# ==================== Envio de Mensagens ====================

@router.post("/send", response_model=WhatsAppMessageResponse)
def send_message(
    message_request: WhatsAppMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Envia mensagem WhatsApp para um cliente.

    **Tipos de mensagem**:
    - `AGENDAMENTO`: Confirmação de novo agendamento
    - `LEMBRETE`: Lembrete 24h antes do agendamento
    - `CONFIRMACAO`: Confirmação do agendamento
    - `CANCELAMENTO`: Notificação de cancelamento
    - `RECICLAGEM`: Campanha de reciclagem de clientes inativos
    - `ANIVERSARIO`: Mensagem de aniversário

    **Placeholders** disponíveis nos templates:
    - `{nome_cliente}`: Nome do cliente
    - `{telefone_cliente}`: Telefone do cliente
    - `{email_cliente}`: Email do cliente
    - `{endereco}`: Endereço do estabelecimento
    - `{data}`: Data do agendamento (dd/mm/yyyy)
    - `{hora}`: Hora de início (HH:MM)
    - `{hora_fim}`: Hora de término (HH:MM)
    - `{servico}`: Nome do serviço
    - `{vendedor}`: Nome do vendedor
    - `{valor}`: Valor do agendamento (R$ XX,XX)
    - `{status}`: Status do agendamento
    """
    return WhatsAppService.send_message(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        message_request=message_request
    )


@router.post("/test", response_model=WhatsAppMessageResponse)
def send_test_message(
    test_request: WhatsAppTestRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Envia mensagem de teste para validar configuração do WhatsApp.

    Use para testar se as credenciais (meta_token e telefone_id) estão corretas.
    """
    check_admin_or_manager(current_user)
    return WhatsAppService.send_test_message(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        test_request=test_request
    )


# ==================== Reciclagem de Clientes Inativos ====================

@router.get("/clientes-inativos")
def get_clientes_inativos(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista clientes inativos (sem agendamento há X meses).

    Retorna lista com informações do cliente e data do último serviço.
    O número de meses é configurável nas configurações do WhatsApp.
    """
    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração do WhatsApp não encontrada"
        )

    return WhatsAppService.get_clientes_inativos(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        meses_inatividade=config.meses_inatividade
    )


@router.post("/send-reciclagem/{cliente_id}", response_model=WhatsAppMessageResponse)
def send_reciclagem_message(
    cliente_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Envia mensagem de reciclagem para um cliente específico.

    **Placeholders** disponíveis no template de reciclagem:
    - `{nome_cliente}`: Nome do cliente
    - `{nome_empresa}`: Nome do estabelecimento
    - `{data_ultimo_servico}`: Data do último agendamento (dd/Mês)
    - `{link_agendamento}`: Link direto para agendamento online
    """
    return WhatsAppService.send_reciclagem_message(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        cliente_id=cliente_id
    )


@router.post("/process-reciclagem-cron")
def process_reciclagem_cron(
    db: Session = Depends(get_db)
):
    """
    Processa envio de mensagens de reciclagem para todos estabelecimentos.

    **IMPORTANTE**: Este endpoint deve ser chamado por um Cron Job diário (ex: 3h da manhã).

    Envia mensagens automáticas para todos os clientes inativos de todos os estabelecimentos
    que têm WhatsApp ativado e reciclagem habilitada.

    Retorna estatísticas do processamento (mensagens enviadas, falhas, etc.).
    """
    return WhatsAppService.process_reciclagem_cron(db=db)


# ==================== Lembretes de Agendamento ====================

@router.post("/process-lembretes-cron")
def process_lembretes_cron(
    db: Session = Depends(get_db)
):
    """
    Processa envio de lembretes 24h antes dos agendamentos.

    **IMPORTANTE**: Este endpoint deve ser chamado por um Cron Job a cada hora.

    Busca agendamentos que estão entre 23h e 25h de distância e envia lembrete
    para clientes, desde que o estabelecimento tenha WhatsApp ativo e enviar_lembrete habilitado.

    Retorna estatísticas do processamento (lembretes enviados, falhas, etc.).
    """
    return WhatsAppService.process_lembretes_cron(db=db)


# ==================== Aniversários ====================

@router.post("/process-aniversarios-cron")
def process_aniversarios_cron(
    db: Session = Depends(get_db)
):
    """
    Processa envio de mensagens de aniversário para clientes.

    **IMPORTANTE**: Este endpoint deve ser chamado por um Cron Job diário (ex: 9h da manhã).

    Busca todos os clientes que fazem aniversário no dia atual e envia mensagem de
    parabéns, desde que o estabelecimento tenha WhatsApp ativo e enviar_aniversario habilitado.

    **Placeholders** disponíveis no template de aniversário:
    - `{nome_cliente}`: Nome do cliente
    - `{endereco}`: Endereço do estabelecimento
    - `{nome_empresa}`: Nome da empresa/estabelecimento

    Retorna estatísticas do processamento (mensagens enviadas, falhas, etc.).
    """
    return WhatsAppService.process_aniversarios_cron(db=db)
