from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from app.database import get_db
from app.models.whatsapp_message import WhatsAppMessage
from app.models.whatsapp_config import WhatsAppConfig
from app.schemas.whatsapp import WAHAWebhookEvent

router = APIRouter(prefix="/waha-webhook", tags=["waha-webhook"])
logger = logging.getLogger(__name__)


@router.post("/events/{session_name}")
async def receive_waha_event(
    session_name: str,
    request: Request,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key")
):
    """
    🔔 Recebe eventos webhook do WAHA.

    Este endpoint é chamado automaticamente pelo WAHA quando eventos ocorrem.

    **Eventos capturados:**
    - `message.any`: Todas mensagens (enviadas + recebidas)
    - `message.ack`: Status de entrega (enviado, entregue, lido)
    - `session.status`: Status da conexão WhatsApp

    **Exemplo de payload (message.any):**
    ```json
    {
      "event": "message.any",
      "session": "agenda_onsell",
      "payload": {
        "id": "ABC123XYZ",
        "timestamp": 1703001234567,
        "from": "5511999999999@c.us",
        "to": "5511888888888@c.us",
        "fromMe": false,
        "body": "Olá! Gostaria de agendar um horário",
        "hasMedia": false
      },
      "environment": {...},
      "engine": "WEBJS"
    }
    ```

    **O que este endpoint faz:**
    1. Recebe o evento
    2. Busca a config do estabelecimento (via session_name)
    3. Salva a mensagem no PostgreSQL
    4. Retorna sucesso para o WAHA (evita retry)

    **Nota**: Este endpoint NÃO requer autenticação JWT pois é chamado
    pelo WAHA (servidor externo). Validação é feita via session_name.
    """

    # ========================================
    # 1. PARSE DO EVENTO
    # ========================================
    try:
        event_data = await request.json()
        logger.info(f"📨 Webhook recebido: {event_data.get('event')} para sessão {session_name}")
    except Exception as e:
        logger.error(f"❌ Erro ao parsear JSON: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

    # ========================================
    # 2. BUSCAR CONFIGURAÇÃO (para pegar estabelecimento_id)
    # ========================================
    config = db.query(WhatsAppConfig).filter(
        WhatsAppConfig.waha_session_name == session_name
    ).first()

    if not config:
        # Log warning mas não falha (permite debugging)
        logger.warning(f"⚠️  Sessão não encontrada no banco: {session_name}")
        # Retorna sucesso para evitar retry do WAHA
        return {
            "status": "ignored",
            "reason": "session_not_found",
            "session": session_name
        }

    # ========================================
    # 3. FILTRAR EVENTOS (processar mensagens + status)
    # ========================================
    event_type = event_data.get("event", "unknown")

    # EVENTOS DE STATUS DA SESSÃO (logar mas não salvar no DB)
    if event_type in ["session.status", "state.change", "session"]:
        payload = event_data.get("payload", {})
        status = payload.get("status", "unknown")

        logger.warning(
            f"🔔 WAHA STATUS CHANGE - Sessão: {session_name} | "
            f"Evento: {event_type} | Status: {status} | "
            f"Payload completo: {payload}"
        )

        # Alertar se desconectou
        if status in ["offline", "disconnected", "failed", "stopped"]:
            logger.error(
                f"❌ WHATSAPP DESCONECTADO! - Sessão: {session_name} | "
                f"Status: {status} | Timestamp: {datetime.now()}"
            )

        return {
            "status": "logged",
            "event": event_type,
            "session_status": status
        }

    # Ignora outros eventos que não são mensagens
    if not event_type.startswith("message"):
        logger.debug(f"🔕 Evento ignorado (não é mensagem): {event_type}")
        return {
            "status": "ignored",
            "reason": "not_a_message_event",
            "event": event_type
        }

    # ========================================
    # 4. EXTRAIR DADOS DA MENSAGEM
    # ========================================
    payload = event_data.get("payload", {})

    message_id = payload.get("id", "")
    from_raw = payload.get("from", "")
    to_raw = payload.get("to", "")
    from_me = payload.get("fromMe", False)
    body = payload.get("body", "")
    has_media = payload.get("hasMedia", False)
    timestamp_ms = payload.get("timestamp", 0)

    # Limpar números (remover @c.us e @s.whatsapp.net)
    from_number = from_raw.replace("@c.us", "").replace("@s.whatsapp.net", "")
    to_number = to_raw.replace("@c.us", "").replace("@s.whatsapp.net", "") if to_raw else None

    # Converter timestamp (milliseconds → datetime)
    if timestamp_ms:
        try:
            message_timestamp = datetime.fromtimestamp(timestamp_ms / 1000)
        except:
            message_timestamp = datetime.now()
    else:
        message_timestamp = datetime.now()

    # Status de confirmação (se for evento message.ack)
    ack_status = None
    if event_type == "message.ack":
        # WAHA retorna ack em payload._data.ack ou payload.ack
        ack_status = payload.get("ack") or payload.get("_data", {}).get("ack")
        if ack_status:
            # Converter número para nome: 0=error, 1=pending, 2=server, 3=delivery, 4=read, 5=played
            ack_map = {0: "error", 1: "pending", 2: "server", 3: "delivery", 4: "read", 5: "played"}
            ack_status = ack_map.get(int(ack_status), str(ack_status))

    # ========================================
    # 5. VERIFICAR DUPLICATA (evitar salvar 2x)
    # ========================================
    existing = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.message_id == message_id,
        WhatsAppMessage.estabelecimento_id == config.estabelecimento_id
    ).first()

    if existing:
        # Se for message.ack, atualiza status
        if event_type == "message.ack" and ack_status:
            existing.ack_status = ack_status
            db.commit()
            logger.info(f"✅ Status atualizado: {message_id} → {ack_status}")
            return {
                "status": "updated",
                "message_id": message_id,
                "ack_status": ack_status
            }
        else:
            logger.debug(f"🔕 Mensagem duplicada ignorada: {message_id}")
            return {
                "status": "duplicate",
                "message_id": message_id
            }

    # ========================================
    # 6. SALVAR MENSAGEM NO POSTGRESQL
    # ========================================
    new_message = WhatsAppMessage(
        message_id=message_id,
        session_name=session_name,
        from_number=from_number,
        to_number=to_number,
        from_me=from_me,
        body=body,
        has_media=has_media,
        media_url=None,  # WAHA pode fornecer URL de mídia depois
        event_type=event_type,
        message_timestamp=message_timestamp,
        ack_status=ack_status,
        payload_json=event_data,  # Salva payload completo para análise
        estabelecimento_id=config.estabelecimento_id
    )

    try:
        db.add(new_message)
        db.commit()
        logger.info(f"✅ Mensagem salva: {message_id} | De: {from_number} | fromMe: {from_me}")

        return {
            "status": "received",
            "message_id": message_id,
            "from": from_number,
            "fromMe": from_me,
            "estabelecimento_id": config.estabelecimento_id
        }

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao salvar mensagem: {str(e)}")
        # Não falha o webhook (WAHA vai tentar de novo)
        # Mas retorna erro para debug
        return {
            "status": "error",
            "message_id": message_id,
            "error": str(e)
        }


@router.get("/health")
def webhook_health():
    """Health check para o webhook"""
    return {
        "status": "healthy",
        "service": "waha-webhook",
        "version": "1.0.0"
    }


@router.get("/stats/{session_name}")
def webhook_stats(
    session_name: str,
    db: Session = Depends(get_db)
):
    """
    📊 Estatísticas de mensagens recebidas via webhook.

    Útil para debug e monitoramento.
    """

    # Buscar config
    config = db.query(WhatsAppConfig).filter(
        WhatsAppConfig.waha_session_name == session_name
    ).first()

    if not config:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    # Contar mensagens
    total_messages = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.estabelecimento_id == config.estabelecimento_id
    ).count()

    received_messages = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.estabelecimento_id == config.estabelecimento_id,
        WhatsAppMessage.from_me == False
    ).count()

    sent_messages = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.estabelecimento_id == config.estabelecimento_id,
        WhatsAppMessage.from_me == True
    ).count()

    return {
        "session": session_name,
        "estabelecimento_id": config.estabelecimento_id,
        "total_messages": total_messages,
        "received": received_messages,
        "sent": sent_messages,
        "webhook_url": f"/waha-webhook/events/{session_name}"
    }
