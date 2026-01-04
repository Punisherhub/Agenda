"""
API Endpoints para Keep-Alive do sistema
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.keepalive_service import KeepAliveService

router = APIRouter(prefix="/keepalive", tags=["keepalive"])


@router.get("/health")
def health_check():
    """
    Health check simples do backend.

    Use este endpoint para uptime monitors (UptimeRobot, Better Uptime, etc).
    """
    return {
        "status": "ok",
        "service": "AgendaOnSell Backend",
        "message": "Sistema operacional"
    }


@router.get("/ping-waha")
def ping_waha_services(db: Session = Depends(get_db)):
    """
    Faz ping em todas as instâncias WAHA configuradas para evitar hibernação.

    **Endpoint público** (sem autenticação) para permitir pings automáticos.

    **Como usar:**
    1. Configure um uptime monitor (UptimeRobot) para pingar este endpoint a cada 10 minutos
    2. O endpoint automaticamente faz ping em todos os serviços WAHA configurados
    3. Mantém o WAHA ativo no Render free tier

    **Retorna:**
    - Estatísticas dos pings (total, sucesso, falhas)
    - Lista detalhada de resultados por estabelecimento
    """
    stats = KeepAliveService.ping_waha_instances(db)

    return {
        "status": "completed",
        "statistics": {
            "total_instances": stats['total'],
            "successful_pings": stats['success'],
            "failed_pings": stats['failed']
        },
        "details": stats.get('results', []),
        "message": f"Ping realizado em {stats['total']} instâncias WAHA"
    }


@router.get("/status")
def system_status(db: Session = Depends(get_db)):
    """
    Retorna status geral do sistema incluindo WAHA.

    **Endpoint público** para monitoramento.
    """
    from app.models.whatsapp_config import WhatsAppConfig

    # Contar configurações WAHA ativas
    total_configs = db.query(WhatsAppConfig).count()
    active_configs = db.query(WhatsAppConfig).filter(
        WhatsAppConfig.ativado == True
    ).count()
    waha_configs = db.query(WhatsAppConfig).filter(
        WhatsAppConfig.waha_url.isnot(None),
        WhatsAppConfig.ativado == True
    ).count()

    return {
        "backend": "operational",
        "database": "connected",
        "whatsapp": {
            "total_configs": total_configs,
            "active_configs": active_configs,
            "waha_instances": waha_configs
        }
    }
