"""
Serviço para integração com WAHA (WhatsApp HTTP API)
Documentação: https://waha.devlike.pro
"""
from typing import Dict, Any, Optional
import requests
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class WAHAService:
    """Service para gerenciar sessões WAHA e envio de mensagens"""

    @staticmethod
    def _make_request(
        method: str,
        url: str,
        api_key: str,
        json_data: Optional[Dict[str, Any]] = None,
        timeout: int = 120
    ) -> Dict[str, Any]:
        """
        Faz requisição para API do WAHA com tratamento de erros.
        Timeout padrão: 120s (suficiente para cold start do Render free tier)
        """
        headers = {
            "X-Api-Key": api_key,
            "Content-Type": "application/json"
        }

        try:
            logger.info("=" * 80)
            logger.info(f"WAHA REQUEST - {method.upper()} {url}")
            logger.info(f"Headers: X-Api-Key={api_key[:10]}...{api_key[-4:]}")
            if json_data:
                logger.info(f"JSON Payload: {json_data}")
            logger.info(f"Timeout: {timeout}s")
            logger.info("=" * 80)

            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=json_data, timeout=timeout)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"Método HTTP não suportado: {method}")

            logger.info("=" * 80)
            logger.info(f"WAHA RESPONSE - Status Code: {response.status_code}")
            logger.info(f"Response Text: {response.text[:500]}")
            logger.info("=" * 80)

            response.raise_for_status()
            result = response.json() if response.text else {}
            logger.info(f"WAHA Response Parsed: {result}")
            return result

        except requests.exceptions.Timeout as e:
            logger.error("=" * 80)
            logger.error(f"WAHA TIMEOUT ERROR após {timeout}s")
            logger.error(f"URL: {url}")
            logger.error(f"Erro: {str(e)}")
            logger.error("=" * 80)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Timeout ao comunicar com WAHA (>{timeout}s): {str(e)}"
            )
        except requests.exceptions.RequestException as e:
            logger.error("=" * 80)
            logger.error(f"WAHA REQUEST ERROR")
            logger.error(f"URL: {url}")
            logger.error(f"Erro: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Status Code: {e.response.status_code}")
                logger.error(f"Response Body: {e.response.text}")
            logger.error("=" * 80)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao comunicar com WAHA: {str(e)}"
            )

    @staticmethod
    def start_session(
        waha_url: str,
        waha_api_key: str,
        session_name: str,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Inicia uma nova sessão WAHA.

        Args:
            waha_url: URL base do WAHA
            waha_api_key: API Key do WAHA
            session_name: Nome da sessão
            webhook_url: URL para receber webhooks (opcional)

        Returns:
            Dados da sessão criada
        """
        url = f"{waha_url.rstrip('/')}/api/sessions/start"

        payload = {
            "name": session_name,
            "config": {
                # Configurações de persistência (engine NOWEB)
                "noweb": {
                    "store": {
                        "enabled": True,  # Habilita persistência da sessão
                        "fullHistory": False  # Não salvar histórico completo (economiza espaço)
                    }
                }
            }
        }

        # Adiciona webhook se fornecido
        if webhook_url:
            payload["config"]["webhooks"] = [
                {
                    "url": webhook_url,
                    "events": ["message.any", "message.ack", "session.status", "state.change"]
                }
            ]

        try:
            result = WAHAService._make_request("POST", url, waha_api_key, payload)
            logger.info(f"Sessão WAHA '{session_name}' iniciada com sucesso")
            return result
        except HTTPException as e:
            # Se a sessão já está iniciada (erro 422), apenas retorna o status atual
            if e.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
                error_detail = str(e.detail).lower()
                if "422" in error_detail or "already started" in error_detail:
                    logger.info(f"Sessão '{session_name}' já está iniciada. Retornando status atual...")
                    # Retorna status atual da sessão
                    return WAHAService.get_session_status(waha_url, waha_api_key, session_name)
            # Se for outro erro, repropaga
            raise

    @staticmethod
    def stop_session(
        waha_url: str,
        waha_api_key: str,
        session_name: str
    ) -> Dict[str, Any]:
        """
        Para uma sessão WAHA existente.
        """
        url = f"{waha_url.rstrip('/')}/api/sessions/stop"

        payload = {
            "name": session_name
        }

        result = WAHAService._make_request("POST", url, waha_api_key, payload)
        logger.info(f"Sessão WAHA '{session_name}' parada com sucesso")
        return result

    @staticmethod
    def get_qr_code(
        waha_url: str,
        waha_api_key: str,
        session_name: str
    ) -> Dict[str, Any]:
        """
        Obtém QR Code para conectar WhatsApp em uma sessão WAHA.

        NOWEB engine usa endpoint /api/{session}/auth/qr
        WEBJS engine usa endpoint /api/screenshot

        Returns:
            {
                "qr": "data:image/png;base64,iVBORw0KGgo...",
                "status": "SCAN_QR_CODE"
            }
        """
        import base64

        # NOWEB engine usa /api/{session}/auth/qr
        url = f"{waha_url.rstrip('/')}/api/{session_name}/auth/qr"

        headers = {
            "X-Api-Key": waha_api_key
        }

        try:
            logger.info(f"WAHA Request: GET {url}")
            response = requests.get(url, headers=headers, timeout=120)
            response.raise_for_status()

            # Converte imagem PNG para base64
            image_base64 = base64.b64encode(response.content).decode('utf-8')
            qr_data_uri = f"data:image/png;base64,{image_base64}"

            result = {
                "qr": qr_data_uri,
                "status": "SCAN_QR_CODE"
            }

            logger.info(f"QR Code obtido para sessão '{session_name}'")
            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao obter QR Code: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Resposta da API: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao obter QR Code: {str(e)}"
            )

    @staticmethod
    def get_session_status(
        waha_url: str,
        waha_api_key: str,
        session_name: str
    ) -> Dict[str, Any]:
        """
        Verifica status de uma sessão WAHA.

        Returns:
            {
                "name": "session_name",
                "status": "WORKING" | "STOPPED" | "STARTING" | "SCAN_QR_CODE" | "FAILED",
                "me": {...} (se conectado)
            }
        """
        url = f"{waha_url.rstrip('/')}/api/sessions/{session_name}"

        result = WAHAService._make_request("GET", url, waha_api_key)
        logger.info(f"Status da sessão '{session_name}': {result.get('status')}")
        return result

    @staticmethod
    def send_text_message(
        waha_url: str,
        waha_api_key: str,
        session_name: str,
        to_phone: str,
        message_text: str
    ) -> Dict[str, Any]:
        """
        Envia mensagem de texto via WAHA.

        Args:
            waha_url: URL base do WAHA
            waha_api_key: API Key
            session_name: Nome da sessão
            to_phone: Número do telefone (formato: 5511999999999)
            message_text: Texto da mensagem

        Returns:
            Resposta da API com ID da mensagem
        """
        url = f"{waha_url.rstrip('/')}/api/sendText"

        payload = {
            "session": session_name,
            "chatId": f"{to_phone}@s.whatsapp.net",
            "text": message_text
        }

        # Log detalhado antes do envio
        logger.info("=" * 80)
        logger.info("WAHA SEND_TEXT_MESSAGE - INÍCIO")
        logger.info(f"URL: {url}")
        logger.info(f"Session: {session_name}")
        logger.info(f"To Phone: {to_phone}")
        logger.info(f"Chat ID: {to_phone}@s.whatsapp.net")
        logger.info(f"Message (first 100 chars): {message_text[:100]}")
        logger.info("Payload: %s", payload)
        logger.info("=" * 80)

        result = WAHAService._make_request("POST", url, waha_api_key, payload)

        logger.info("=" * 80)
        logger.info("WAHA SEND_TEXT_MESSAGE - SUCESSO")
        logger.info(f"Response: {result}")
        logger.info(f"Message ID: {result.get('id', 'N/A')}")
        logger.info("=" * 80)

        return result

    @staticmethod
    def get_all_sessions(
        waha_url: str,
        waha_api_key: str
    ) -> list:
        """
        Lista todas as sessões WAHA.
        """
        url = f"{waha_url.rstrip('/')}/api/sessions"

        result = WAHAService._make_request("GET", url, waha_api_key)
        return result if isinstance(result, list) else []

    @staticmethod
    def delete_session(
        waha_url: str,
        waha_api_key: str,
        session_name: str
    ) -> Dict[str, Any]:
        """
        Deleta completamente uma sessão WAHA.
        Usado quando a sessão está em estado FAILED e precisa ser recriada.
        """
        url = f"{waha_url.rstrip('/')}/api/sessions/{session_name}"

        headers = {
            "X-Api-Key": waha_api_key
        }

        try:
            logger.info(f"WAHA Request: DELETE {url}")
            response = requests.delete(url, headers=headers, timeout=120)
            response.raise_for_status()
            logger.info(f"Sessão WAHA '{session_name}' deletada com sucesso")
            return {"success": True}
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao deletar sessão: {str(e)}")
            # Não falha se sessão não existe
            return {"success": False, "error": str(e)}

    @staticmethod
    def logout_session(
        waha_url: str,
        waha_api_key: str,
        session_name: str
    ) -> Dict[str, Any]:
        """
        Faz logout de uma sessão WAHA (reconecta WhatsApp).
        Com NOWEB engine, detecta estado FAILED e recria sessão completamente.
        """
        # Verifica status atual da sessão
        try:
            status = WAHAService.get_session_status(waha_url, waha_api_key, session_name)
            session_status = status.get("status")

            logger.info(f"Status atual da sessão '{session_name}': {session_status}")

            # Se sessão está FAILED, precisa deletar e recriar completamente
            if session_status == "FAILED":
                logger.warning(f"Sessão '{session_name}' está FAILED. Deletando e recriando...")
                WAHAService.delete_session(waha_url, waha_api_key, session_name)
                import time
                time.sleep(2)  # Aguarda 2s para garantir que deletou
            else:
                # Se não está FAILED, apenas para a sessão
                WAHAService.stop_session(waha_url, waha_api_key, session_name)
                import time
                time.sleep(1)

        except Exception as e:
            # Se erro ao verificar status, tenta deletar de qualquer forma
            logger.warning(f"Erro ao verificar status: {e}. Tentando deletar...")
            WAHAService.delete_session(waha_url, waha_api_key, session_name)
            import time
            time.sleep(2)

        # Inicia novamente (gera novo QR Code)
        result = WAHAService.start_session(waha_url, waha_api_key, session_name)

        logger.info(f"Sessão '{session_name}' reconectada - novo QR Code disponível")
        return result
