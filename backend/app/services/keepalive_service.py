"""
Serviço de Keep-Alive para evitar hibernação do WAHA no Render
"""
import requests
import logging
from typing import List, Dict
from sqlalchemy.orm import Session
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)


class KeepAliveService:
    """Serviço para manter WAHA ativo com pings periódicos"""

    @staticmethod
    def ping_waha_instances(db: Session) -> Dict[str, any]:
        """
        Faz ping em todas as instâncias WAHA configuradas para evitar hibernação.

        Returns:
            Dict com estatísticas dos pings (total, sucesso, falhas)
        """
        from app.models.whatsapp_config import WhatsAppConfig

        stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'results': []
        }

        try:
            # Buscar todas as configurações WAHA ativas
            configs = db.query(WhatsAppConfig).filter(
                WhatsAppConfig.ativado == True,
                WhatsAppConfig.waha_url.isnot(None)
            ).all()

            stats['total'] = len(configs)

            if not configs:
                logger.info("[KEEP-ALIVE] Nenhuma configuração WAHA ativa encontrada")
                return stats

            for config in configs:
                try:
                    # Fazer ping no endpoint de health do WAHA
                    health_url = f"{config.waha_url.rstrip('/')}/health"

                    response = requests.get(
                        health_url,
                        headers={'X-Api-Key': config.waha_api_key},
                        timeout=10
                    )

                    if response.status_code == 200:
                        stats['success'] += 1
                        logger.info(
                            f"[KEEP-ALIVE] ✓ WAHA ping OK - Estabelecimento {config.estabelecimento_id}"
                        )
                        stats['results'].append({
                            'estabelecimento_id': config.estabelecimento_id,
                            'status': 'success',
                            'url': health_url
                        })
                    else:
                        stats['failed'] += 1
                        logger.warning(
                            f"[KEEP-ALIVE] ✗ WAHA ping FAILED (HTTP {response.status_code}) - "
                            f"Estabelecimento {config.estabelecimento_id}"
                        )
                        stats['results'].append({
                            'estabelecimento_id': config.estabelecimento_id,
                            'status': 'failed',
                            'error': f"HTTP {response.status_code}"
                        })

                except requests.exceptions.RequestException as e:
                    stats['failed'] += 1
                    logger.error(
                        f"[KEEP-ALIVE] ✗ Erro ao pingar WAHA - Estabelecimento {config.estabelecimento_id}: {str(e)}"
                    )
                    stats['results'].append({
                        'estabelecimento_id': config.estabelecimento_id,
                        'status': 'error',
                        'error': str(e)
                    })

        except Exception as e:
            logger.error(f"[KEEP-ALIVE] Erro geral ao executar pings: {str(e)}")
            stats['error'] = str(e)

        logger.info(
            f"[KEEP-ALIVE] Resumo: {stats['success']}/{stats['total']} pings bem-sucedidos"
        )

        return stats
