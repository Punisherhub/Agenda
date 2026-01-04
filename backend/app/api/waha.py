"""
Endpoints para gerenciar sessões WAHA (WhatsApp HTTP API)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.auth import get_current_active_user
from app.utils.permissions import check_admin_or_manager
from app.services.waha_service import WAHAService
from app.services.whatsapp_service import WhatsAppService

router = APIRouter()


@router.post("/start-session")
def start_waha_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Inicia uma sessão WAHA (cria instância WhatsApp).

    **Fluxo:**
    1. Busca configuração WAHA do estabelecimento
    2. Cria/inicia sessão no servidor WAHA
    3. Retorna dados da sessão (incluindo URL do webhook)

    **Requer:** Admin ou Manager
    """
    check_admin_or_manager(current_user)

    # Busca configuração
    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração do WhatsApp não encontrada"
        )

    if not config.waha_url or not config.waha_api_key or not config.waha_session_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração WAHA incompleta. Configure URL, API Key e Session Name."
        )

    # TODO: Substituir pela URL real do backend em produção
    # Por enquanto, webhook será configurado manualmente
    webhook_url = None  # f"https://seu-backend.railway.app/waha-webhook/events/{config.waha_session_name}"

    result = WAHAService.start_session(
        waha_url=config.waha_url,
        waha_api_key=config.waha_api_key,
        session_name=config.waha_session_name,
        webhook_url=webhook_url
    )

    return {
        "success": True,
        "message": "Sessão WAHA iniciada com sucesso",
        "session": result
    }


@router.post("/stop-session")
def stop_waha_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Para uma sessão WAHA (mas não deleta).
    """
    check_admin_or_manager(current_user)

    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config or not config.waha_url or not config.waha_api_key or not config.waha_session_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração WAHA não encontrada ou incompleta"
        )

    result = WAHAService.stop_session(
        waha_url=config.waha_url,
        waha_api_key=config.waha_api_key,
        session_name=config.waha_session_name
    )

    return {
        "success": True,
        "message": "Sessão WAHA parada",
        "result": result
    }


@router.get("/qrcode")
def get_waha_qrcode(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtém QR Code para conectar WhatsApp via WAHA.

    **Retorna:**
    ```json
    {
      "qr": "data:image/png;base64,iVBORw0KGgo...",
      "status": "SCAN_QR_CODE"
    }
    ```

    **Estados possíveis:**
    - `SCAN_QR_CODE`: Aguardando escaneamento
    - `WORKING`: Já conectado
    - `STOPPED`: Sessão parada
    - `FAILED`: Erro na sessão
    """
    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config or not config.waha_url or not config.waha_api_key or not config.waha_session_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração WAHA não encontrada ou incompleta"
        )

    result = WAHAService.get_qr_code(
        waha_url=config.waha_url,
        waha_api_key=config.waha_api_key,
        session_name=config.waha_session_name
    )

    return result


@router.get("/status")
def get_waha_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Verifica status de conexão da sessão WAHA.

    **Retorna:**
    ```json
    {
      "name": "session_name",
      "status": "WORKING",
      "me": {
        "id": "5511999999999@c.us",
        "pushName": "Nome do WhatsApp"
      }
    }
    ```

    **Status possíveis:**
    - `WORKING`: Conectado e funcionando
    - `SCAN_QR_CODE`: Aguardando escaneamento do QR Code
    - `STARTING`: Iniciando sessão
    - `STOPPED`: Sessão parada
    - `FAILED`: Erro na sessão
    """
    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config or not config.waha_url or not config.waha_api_key or not config.waha_session_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração WAHA não encontrada ou incompleta"
        )

    try:
        result = WAHAService.get_session_status(
            waha_url=config.waha_url,
            waha_api_key=config.waha_api_key,
            session_name=config.waha_session_name
        )

        # Normaliza resposta para formato similar ao Evolution API
        return {
            "connected": result.get("status") == "WORKING",
            "session": result.get("name"),
            "status": result.get("status"),
            "me": result.get("me"),
            "qrcode": None  # QR Code é obtido via endpoint separado
        }

    except HTTPException as e:
        # Se sessão não existe, retorna status desconectado
        if "404" in str(e.detail) or "not found" in str(e.detail).lower():
            return {
                "connected": False,
                "session": config.waha_session_name,
                "status": "NOT_STARTED",
                "me": None,
                "qrcode": None
            }
        raise


@router.post("/logout")
def logout_waha_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Faz logout da sessão WAHA (desconecta WhatsApp mas mantém sessão).
    Útil para reconectar com outro número.
    """
    check_admin_or_manager(current_user)

    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config or not config.waha_url or not config.waha_api_key or not config.waha_session_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração WAHA não encontrada ou incompleta"
        )

    result = WAHAService.logout_session(
        waha_url=config.waha_url,
        waha_api_key=config.waha_api_key,
        session_name=config.waha_session_name
    )

    return {
        "success": True,
        "message": "Logout realizado. Escaneie o QR Code novamente para reconectar.",
        "result": result
    }


@router.get("/sessions")
def list_waha_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as sessões WAHA (Debug).
    Útil para verificar se a sessão foi criada corretamente.
    """
    check_admin_or_manager(current_user)

    config = WhatsAppService.get_config(db, current_user.estabelecimento_id)
    if not config or not config.waha_url or not config.waha_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração WAHA não encontrada ou incompleta"
        )

    sessions = WAHAService.get_all_sessions(
        waha_url=config.waha_url,
        waha_api_key=config.waha_api_key
    )

    return {
        "sessions": sessions,
        "total": len(sessions)
    }


@router.get("/health")
def waha_health_check(db: Session = Depends(get_db)):
    """
    Health check público para UptimeRobot/monitoramento (sem autenticação).

    Este endpoint faz duas coisas:
    1. Mantém o backend ativo
    2. Faz ping no servidor WAHA para mantê-lo ativo também

    Configure no UptimeRobot:
    - URL: https://seu-backend.onrender.com/waha/health
    - Intervalo: 10 minutos
    - Não precisa de headers customizados
    """
    import requests

    # Busca primeira configuração WAHA ativa
    from app.models.whatsapp_config import WhatsAppConfig
    config = db.query(WhatsAppConfig).filter(
        WhatsAppConfig.waha_url.isnot(None),
        WhatsAppConfig.waha_api_key.isnot(None)
    ).first()

    waha_status = "not_configured"

    if config:
        # Faz ping no WAHA para mantê-lo ativo
        try:
            waha_url = f"{config.waha_url.rstrip('/')}/api/server/status"
            headers = {"X-Api-Key": config.waha_api_key}
            response = requests.get(waha_url, headers=headers, timeout=10)

            if response.status_code == 200:
                waha_status = "alive"
            else:
                waha_status = f"error_{response.status_code}"
        except Exception as e:
            waha_status = f"error: {str(e)[:50]}"

    return {
        "status": "healthy",
        "service": "WAHA Integration",
        "waha_ping": waha_status
    }
