from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import requests
import logging

from app.models import WhatsAppConfig, Cliente, Agendamento, User, Estabelecimento
from app.schemas.whatsapp import (
    WhatsAppConfigCreate,
    WhatsAppConfigUpdate,
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppTestRequest
)

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service para gerenciar configuração do WhatsApp e envio de mensagens via Meta API"""

    META_API_BASE_URL = "https://graph.facebook.com/v18.0"

    # ==================== Configuração ====================

    @staticmethod
    def get_config(db: Session, estabelecimento_id: int) -> Optional[WhatsAppConfig]:
        """Busca configuração do WhatsApp do estabelecimento"""
        return db.query(WhatsAppConfig).filter(
            WhatsAppConfig.estabelecimento_id == estabelecimento_id
        ).first()

    @staticmethod
    def create_config(
        db: Session,
        config_data: WhatsAppConfigCreate
    ) -> WhatsAppConfig:
        """Cria configuração do WhatsApp"""
        # Verifica se já existe configuração
        existing = WhatsAppService.get_config(db, config_data.estabelecimento_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Configuração do WhatsApp já existe para este estabelecimento"
            )

        config = WhatsAppConfig(**config_data.model_dump())
        db.add(config)
        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def update_config(
        db: Session,
        estabelecimento_id: int,
        config_data: WhatsAppConfigUpdate
    ) -> WhatsAppConfig:
        """Atualiza configuração do WhatsApp"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada"
            )

        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)

        config.updated_at = datetime.now()
        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def delete_config(db: Session, estabelecimento_id: int) -> None:
        """Remove configuração do WhatsApp"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada"
            )

        db.delete(config)
        db.commit()

    # ==================== Envio de Mensagens ====================

    @staticmethod
    def _format_phone_number(phone: str) -> str:
        """
        Formata número de telefone para o padrão Meta API.
        Remove caracteres especiais e garante código do país.
        Exemplo: (11) 99999-9999 -> 5511999999999
        """
        # Remove caracteres não numéricos
        clean_phone = ''.join(filter(str.isdigit, phone))

        # Adiciona código do país se não tiver
        if not clean_phone.startswith('55'):
            clean_phone = '55' + clean_phone

        return clean_phone

    @staticmethod
    def _replace_placeholders(template: str, data: Dict[str, Any]) -> str:
        """Substitui placeholders {nome_cliente}, {data}, {hora}, etc. no template"""
        result = template
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            result = result.replace(placeholder, str(value))
        return result

    @staticmethod
    def _get_template_data_from_agendamento(db: Session, agendamento: Agendamento) -> Dict[str, Any]:
        """Extrai dados do agendamento para preencher templates"""
        cliente = db.query(Cliente).filter(Cliente.id == agendamento.cliente_id).first()
        vendedor = db.query(User).filter(User.id == agendamento.vendedor_id).first() if agendamento.vendedor_id else None

        data_inicio = agendamento.data_inicio
        data_fim = agendamento.data_fim

        return {
            'nome_cliente': cliente.nome if cliente else 'Cliente',
            'telefone_cliente': cliente.telefone if cliente else '',
            'email_cliente': cliente.email if cliente else '',
            'data': data_inicio.strftime('%d/%m/%Y') if data_inicio else '',
            'hora': data_inicio.strftime('%H:%M') if data_inicio else '',
            'hora_fim': data_fim.strftime('%H:%M') if data_fim else '',
            'servico': agendamento.servico.nome if agendamento.servico else agendamento.servico_personalizado_nome or 'Serviço',
            'vendedor': vendedor.nome if vendedor else 'Nossa equipe',
            'valor': f"R$ {agendamento.valor_final:.2f}" if agendamento.valor_final else '',
            'status': agendamento.status.value if agendamento.status else '',
        }

    @staticmethod
    def _send_meta_api_message(
        phone_id: str,
        access_token: str,
        to_phone: str,
        message_text: str
    ) -> Dict[str, Any]:
        """
        Envia mensagem via Meta WhatsApp Business Cloud API (modo texto simples).

        Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
        """
        url = f"{WhatsAppService.META_API_BASE_URL}/{phone_id}/messages"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {
                "body": message_text
            }
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao enviar mensagem WhatsApp: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Resposta da API: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao enviar mensagem WhatsApp: {str(e)}"
            )

    @staticmethod
    def _send_template_message(
        phone_id: str,
        access_token: str,
        to_phone: str,
        template_name: str,
        parameters: List[str],
        button_params: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Envia mensagem via Meta WhatsApp Business Cloud API usando Template HSM aprovado.

        Args:
            phone_id: ID do telefone WhatsApp Business
            access_token: Token de acesso Meta API
            to_phone: Número de destino (formato: 5511999999999)
            template_name: Nome do template aprovado na Meta (ex: "confirmacao_servico_saas")
            parameters: Lista de parâmetros para substituir {{1}}, {{2}}, etc.
            button_params: Lista de parâmetros para botões dinâmicos (URLs, etc.)

        Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
        """
        url = f"{WhatsAppService.META_API_BASE_URL}/{phone_id}/messages"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Construir componentes do template
        components = []

        # Body component com parâmetros
        if parameters:
            body_parameters = [{"type": "text", "text": param} for param in parameters]
            components.append({
                "type": "body",
                "parameters": body_parameters
            })

        # Button component (se houver parâmetros de botão, como URLs dinâmicas)
        if button_params:
            button_parameters = [{"type": "text", "text": param} for param in button_params]
            components.append({
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": button_parameters
            })

        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": "pt_BR"
                },
                "components": components
            }
        }

        try:
            logger.info(f"[WHATSAPP] Enviando template '{template_name}' para {to_phone}")
            logger.debug(f"[WHATSAPP] Payload: {payload}")

            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()

            result = response.json()
            logger.info(f"[WHATSAPP] Template enviado com sucesso. Message ID: {result.get('messages', [{}])[0].get('id')}")
            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao enviar template WhatsApp: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Resposta da API: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao enviar template WhatsApp: {str(e)}"
            )

    @staticmethod
    def _build_template_parameters(tipo_mensagem: str, data: Dict[str, Any]) -> List[str]:
        """
        Mapeia os dados do agendamento para a ordem correta de parâmetros do template HSM.

        Cada tipo de mensagem tem seu próprio mapeamento, que deve corresponder à ordem
        dos {{1}}, {{2}}, {{3}}, etc. definidos no template aprovado na Meta.

        Args:
            tipo_mensagem: 'AGENDAMENTO', 'LEMBRETE', 'CONFIRMACAO', 'CANCELAMENTO', 'RECICLAGEM'
            data: Dicionário com os dados disponíveis (nome_cliente, data, hora, etc.)

        Returns:
            Lista ordenada de strings para substituir {{1}}, {{2}}, {{3}}, etc.
        """
        # Mapeamento padrão para cada tipo de template
        # Atenção: A ORDEM deve ser a MESMA do template aprovado na Meta!

        if tipo_mensagem == 'AGENDAMENTO':
            # Template sugerido: "Olá {{1}}! Seu agendamento foi confirmado para {{2}} às {{3}}. Serviço: {{4}}. Valor: {{5}}."
            return [
                data.get('nome_cliente', 'Cliente'),
                data.get('data', ''),
                data.get('hora', ''),
                data.get('servico', ''),
                data.get('valor', '')
            ]

        elif tipo_mensagem == 'LEMBRETE':
            # Template sugerido: "Olá {{1}}! Lembramos que você tem agendamento amanhã às {{2}}. Serviço: {{3}}. Aguardamos você!"
            return [
                data.get('nome_cliente', 'Cliente'),
                data.get('hora', ''),
                data.get('servico', '')
            ]

        elif tipo_mensagem == 'CONFIRMACAO':
            # Template sugerido: "Olá {{1}}! Seu agendamento para {{2}} às {{3}} foi CONFIRMADO. Nos vemos em breve!"
            return [
                data.get('nome_cliente', 'Cliente'),
                data.get('data', ''),
                data.get('hora', '')
            ]

        elif tipo_mensagem == 'CANCELAMENTO':
            # Template sugerido: "Olá {{1}}. Seu agendamento de {{2}} às {{3}} foi cancelado. Entre em contato para reagendar."
            return [
                data.get('nome_cliente', 'Cliente'),
                data.get('data', ''),
                data.get('hora', '')
            ]

        elif tipo_mensagem == 'RECICLAGEM':
            # Template sugerido: "Olá {{1}}! Vimos que faz {{2}} meses que você não utiliza os serviços da {{3}} (última visita em {{4}}). Que tal agendar agora?"
            return [
                data.get('nome_cliente', 'Cliente'),
                data.get('meses_inativo', ''),
                data.get('nome_empresa', ''),
                data.get('data_ultimo_servico', '')
            ]

        else:
            # Fallback: retorna apenas nome do cliente
            return [data.get('nome_cliente', 'Cliente')]

    @staticmethod
    def send_message(
        db: Session,
        estabelecimento_id: int,
        message_request: WhatsAppMessageRequest
    ) -> WhatsAppMessageResponse:
        """Envia mensagem WhatsApp para um cliente"""
        # Busca configuração
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada. Configure antes de enviar mensagens."
            )

        if not config.ativado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="WhatsApp não está ativado para este estabelecimento"
            )

        # Busca cliente
        cliente = db.query(Cliente).filter(Cliente.id == message_request.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        if not cliente.telefone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cliente não possui telefone cadastrado"
            )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(cliente.telefone)

        # Preparar dados do template (se necessário)
        template_data = {}
        if message_request.agendamento_id:
            agendamento = db.query(Agendamento).filter(
                Agendamento.id == message_request.agendamento_id
            ).first()
            if not agendamento:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Agendamento não encontrado"
                )
            template_data = WhatsAppService._get_template_data_from_agendamento(db, agendamento)
        else:
            # Dados básicos do cliente
            template_data = {'nome_cliente': cliente.nome}

        # Determina o nome do template HSM Meta (se configurado)
        meta_template_map = {
            'AGENDAMENTO': config.meta_template_agendamento,
            'LEMBRETE': config.meta_template_lembrete,
            'CONFIRMACAO': config.meta_template_confirmacao,
            'CANCELAMENTO': config.meta_template_cancelamento,
            'RECICLAGEM': config.meta_template_reciclagem,
        }
        meta_template_name = meta_template_map.get(message_request.tipo_mensagem)

        # Envia mensagem via Meta API
        try:
            # Modo 1: Mensagem customizada (texto simples)
            if message_request.mensagem_customizada:
                result = WhatsAppService._send_meta_api_message(
                    phone_id=config.telefone_id,
                    access_token=config.meta_token,
                    to_phone=formatted_phone,
                    message_text=message_request.mensagem_customizada
                )

            # Modo 2: Template HSM aprovado pela Meta (PRODUÇÃO)
            elif meta_template_name:
                logger.info(f"[WHATSAPP] Usando template HSM Meta: '{meta_template_name}' para tipo '{message_request.tipo_mensagem}'")

                # Construir parâmetros na ordem correta para o template
                parameters = WhatsAppService._build_template_parameters(
                    message_request.tipo_mensagem,
                    template_data
                )

                # Para reciclagem, adicionar link de agendamento como botão (se configurado)
                button_params = None
                if message_request.tipo_mensagem == 'RECICLAGEM' and config.link_agendamento:
                    button_params = [config.link_agendamento]

                result = WhatsAppService._send_template_message(
                    phone_id=config.telefone_id,
                    access_token=config.meta_token,
                    to_phone=formatted_phone,
                    template_name=meta_template_name,
                    parameters=parameters,
                    button_params=button_params
                )

            # Modo 3: Template interno com placeholders (FALLBACK - texto simples)
            else:
                logger.warning(f"[WHATSAPP] Template HSM não configurado para '{message_request.tipo_mensagem}'. Usando texto simples (fallback).")

                # Busca template interno
                template_map = {
                    'AGENDAMENTO': config.template_agendamento,
                    'LEMBRETE': config.template_lembrete,
                    'CONFIRMACAO': config.template_confirmacao,
                    'CANCELAMENTO': config.template_cancelamento,
                    'RECICLAGEM': config.template_reciclagem,
                }

                template = template_map.get(message_request.tipo_mensagem)
                if not template:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Template não configurado para tipo '{message_request.tipo_mensagem}'"
                    )

                message_text = WhatsAppService._replace_placeholders(template, template_data)

                result = WhatsAppService._send_meta_api_message(
                    phone_id=config.telefone_id,
                    access_token=config.meta_token,
                    to_phone=formatted_phone,
                    message_text=message_text
                )

            # Extrai message_id da resposta
            message_id = None
            if 'messages' in result and len(result['messages']) > 0:
                message_id = result['messages'][0].get('id')

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem WhatsApp: {str(e)}")
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e),
                telefone_destino=formatted_phone
            )

    @staticmethod
    def send_test_message(
        db: Session,
        estabelecimento_id: int,
        test_request: WhatsAppTestRequest
    ) -> WhatsAppMessageResponse:
        """Envia mensagem de teste para validar configuração"""
        # Busca configuração
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada"
            )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(test_request.telefone)

        # Envia mensagem de teste
        try:
            result = WhatsAppService._send_meta_api_message(
                phone_id=config.telefone_id,
                access_token=config.meta_token,
                to_phone=formatted_phone,
                message_text=test_request.mensagem
            )

            message_id = None
            if 'messages' in result and len(result['messages']) > 0:
                message_id = result['messages'][0].get('id')

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem de teste WhatsApp: {str(e)}")
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e),
                telefone_destino=formatted_phone
            )

    # ==================== Gatilhos Automáticos ====================

    @staticmethod
    def notify_novo_agendamento(db: Session, agendamento: Agendamento) -> None:
        """Envia notificação ao criar novo agendamento"""
        config = WhatsAppService.get_config(db, agendamento.estabelecimento_id)
        if not config or not config.ativado or not config.enviar_agendamento:
            return

        try:
            WhatsAppService.send_message(
                db=db,
                estabelecimento_id=agendamento.estabelecimento_id,
                message_request=WhatsAppMessageRequest(
                    cliente_id=agendamento.cliente_id,
                    tipo_mensagem='AGENDAMENTO',
                    agendamento_id=agendamento.id
                )
            )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de agendamento: {str(e)}")

    @staticmethod
    def notify_confirmacao(db: Session, agendamento: Agendamento) -> None:
        """Envia notificação ao confirmar agendamento"""
        config = WhatsAppService.get_config(db, agendamento.estabelecimento_id)
        if not config or not config.ativado or not config.enviar_confirmacao:
            return

        try:
            WhatsAppService.send_message(
                db=db,
                estabelecimento_id=agendamento.estabelecimento_id,
                message_request=WhatsAppMessageRequest(
                    cliente_id=agendamento.cliente_id,
                    tipo_mensagem='CONFIRMACAO',
                    agendamento_id=agendamento.id
                )
            )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de confirmação: {str(e)}")

    @staticmethod
    def notify_cancelamento(db: Session, agendamento: Agendamento) -> None:
        """Envia notificação ao cancelar agendamento"""
        config = WhatsAppService.get_config(db, agendamento.estabelecimento_id)
        if not config or not config.ativado or not config.enviar_cancelamento:
            return

        try:
            WhatsAppService.send_message(
                db=db,
                estabelecimento_id=agendamento.estabelecimento_id,
                message_request=WhatsAppMessageRequest(
                    cliente_id=agendamento.cliente_id,
                    tipo_mensagem='CANCELAMENTO',
                    agendamento_id=agendamento.id
                )
            )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de cancelamento: {str(e)}")

    # ==================== Reciclagem de Clientes Inativos ====================

    @staticmethod
    def get_clientes_inativos(
        db: Session,
        estabelecimento_id: int,
        meses_inatividade: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Busca clientes que não têm agendamento há X meses.
        Retorna lista com informações do cliente e data do último serviço.
        """
        # Data limite (hoje - X meses)
        data_limite = datetime.now() - timedelta(days=meses_inatividade * 30)

        # Subconsulta: último agendamento de cada cliente
        subquery = (
            db.query(
                Agendamento.cliente_id,
                func.max(Agendamento.data_inicio).label('ultimo_agendamento')
            )
            .filter(Agendamento.estabelecimento_id == estabelecimento_id)
            .filter(Agendamento.deleted_at.is_(None))  # Ignora agendamentos deletados
            .group_by(Agendamento.cliente_id)
            .subquery()
        )

        # Busca clientes com último agendamento antes da data limite
        clientes_inativos = (
            db.query(Cliente, subquery.c.ultimo_agendamento)
            .join(subquery, Cliente.id == subquery.c.cliente_id)
            .filter(Cliente.estabelecimento_id == estabelecimento_id)
            .filter(Cliente.is_active == True)
            .filter(subquery.c.ultimo_agendamento < data_limite)
            .all()
        )

        # Formata resultado
        result = []
        for cliente, ultimo_agendamento in clientes_inativos:
            result.append({
                'cliente_id': cliente.id,
                'nome': cliente.nome,
                'telefone': cliente.telefone,
                'email': cliente.email,
                'ultimo_agendamento': ultimo_agendamento,
                'meses_inativo': (datetime.now() - ultimo_agendamento).days // 30
            })

        return result

    @staticmethod
    def send_reciclagem_message(
        db: Session,
        estabelecimento_id: int,
        cliente_id: int
    ) -> WhatsAppMessageResponse:
        """Envia mensagem de reciclagem para um cliente específico"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada"
            )

        if not config.ativado or not config.enviar_reciclagem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Envio de mensagens de reciclagem não está ativado"
            )

        if not config.template_reciclagem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template de reciclagem não configurado"
            )

        # Busca cliente e estabelecimento
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente or not cliente.telefone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado ou sem telefone cadastrado"
            )

        estabelecimento = db.query(Estabelecimento).filter(
            Estabelecimento.id == estabelecimento_id
        ).first()

        # Busca último agendamento
        ultimo_agendamento = (
            db.query(Agendamento)
            .filter(Agendamento.cliente_id == cliente_id)
            .filter(Agendamento.estabelecimento_id == estabelecimento_id)
            .filter(Agendamento.deleted_at.is_(None))
            .order_by(Agendamento.data_inicio.desc())
            .first()
        )

        # Prepara dados para template
        template_data = {
            'nome_cliente': cliente.nome,
            'nome_empresa': estabelecimento.nome if estabelecimento else 'Nossa empresa',
            'data_ultimo_servico': ultimo_agendamento.data_inicio.strftime('%d/%B') if ultimo_agendamento else 'há algum tempo',
            'link_agendamento': config.link_agendamento or 'Entre em contato conosco'
        }

        # Substitui placeholders
        message_text = WhatsAppService._replace_placeholders(
            config.template_reciclagem,
            template_data
        )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(cliente.telefone)

        # Envia mensagem
        try:
            result = WhatsAppService._send_meta_api_message(
                phone_id=config.telefone_id,
                access_token=config.meta_token,
                to_phone=formatted_phone,
                message_text=message_text
            )

            message_id = None
            if 'messages' in result and len(result['messages']) > 0:
                message_id = result['messages'][0].get('id')

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem de reciclagem: {str(e)}")
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e),
                telefone_destino=formatted_phone
            )

    @staticmethod
    def process_reciclagem_cron(db: Session) -> Dict[str, Any]:
        """
        Processa envio de mensagens de reciclagem para todos os estabelecimentos ativos.
        Deve ser chamado por um Cron Job diário (ex: 3h da manhã).

        Retorna estatísticas do processamento.
        """
        logger.info("Iniciando processamento de reciclagem de clientes inativos")

        stats = {
            'estabelecimentos_processados': 0,
            'clientes_inativos_encontrados': 0,
            'mensagens_enviadas': 0,
            'mensagens_falhas': 0,
            'erros': []
        }

        # Busca todos os estabelecimentos com WhatsApp ativo e reciclagem habilitada
        configs = (
            db.query(WhatsAppConfig)
            .filter(WhatsAppConfig.ativado == True)
            .filter(WhatsAppConfig.enviar_reciclagem == True)
            .all()
        )

        for config in configs:
            try:
                stats['estabelecimentos_processados'] += 1

                # Busca clientes inativos
                clientes_inativos = WhatsAppService.get_clientes_inativos(
                    db=db,
                    estabelecimento_id=config.estabelecimento_id,
                    meses_inatividade=config.meses_inatividade
                )

                stats['clientes_inativos_encontrados'] += len(clientes_inativos)

                # Envia mensagem para cada cliente inativo
                for cliente_info in clientes_inativos:
                    try:
                        response = WhatsAppService.send_reciclagem_message(
                            db=db,
                            estabelecimento_id=config.estabelecimento_id,
                            cliente_id=cliente_info['cliente_id']
                        )

                        if response.sucesso:
                            stats['mensagens_enviadas'] += 1
                        else:
                            stats['mensagens_falhas'] += 1
                            stats['erros'].append(
                                f"Falha ao enviar para cliente {cliente_info['cliente_id']}: {response.erro}"
                            )
                    except Exception as e:
                        stats['mensagens_falhas'] += 1
                        stats['erros'].append(
                            f"Erro ao processar cliente {cliente_info['cliente_id']}: {str(e)}"
                        )
                        logger.error(f"Erro ao processar cliente {cliente_info['cliente_id']}: {str(e)}")

            except Exception as e:
                stats['erros'].append(
                    f"Erro ao processar estabelecimento {config.estabelecimento_id}: {str(e)}"
                )
                logger.error(f"Erro ao processar estabelecimento {config.estabelecimento_id}: {str(e)}")

        logger.info(f"Processamento de reciclagem finalizado: {stats}")
        return stats

    # ==================== Lembretes de Agendamento ====================

    @staticmethod
    def get_agendamentos_para_lembrete(db: Session) -> List[Agendamento]:
        """
        Busca agendamentos que precisam de lembrete 24h antes.
        Critérios:
        - data_inicio entre 23h e 25h a partir de agora
        - status = AGENDADO ou CONFIRMADO
        - lembrete_enviado = False
        - deleted_at = None
        - WhatsApp ativo e enviar_lembrete = True
        """
        agora = datetime.now()
        limite_inferior = agora + timedelta(hours=23)
        limite_superior = agora + timedelta(hours=25)

        # Busca agendamentos que precisam de lembrete
        agendamentos = (
            db.query(Agendamento)
            .join(WhatsAppConfig, Agendamento.estabelecimento_id == WhatsAppConfig.estabelecimento_id)
            .filter(Agendamento.data_inicio >= limite_inferior)
            .filter(Agendamento.data_inicio <= limite_superior)
            .filter(Agendamento.status.in_(['AGENDADO', 'CONFIRMADO']))
            .filter(Agendamento.lembrete_enviado == False)
            .filter(Agendamento.deleted_at.is_(None))
            .filter(WhatsAppConfig.ativado == True)
            .filter(WhatsAppConfig.enviar_lembrete == True)
            .all()
        )

        return agendamentos

    @staticmethod
    def send_lembrete(db: Session, agendamento: Agendamento) -> WhatsAppMessageResponse:
        """Envia lembrete 24h antes do agendamento"""
        config = WhatsAppService.get_config(db, agendamento.estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada"
            )

        if not config.ativado or not config.enviar_lembrete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Envio de lembretes não está ativado"
            )

        if not config.template_lembrete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template de lembrete não configurado"
            )

        # Busca cliente
        cliente = db.query(Cliente).filter(Cliente.id == agendamento.cliente_id).first()
        if not cliente or not cliente.telefone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado ou sem telefone cadastrado"
            )

        # Prepara dados para template
        template_data = WhatsAppService._get_template_data_from_agendamento(db, agendamento)

        # Substitui placeholders
        message_text = WhatsAppService._replace_placeholders(
            config.template_lembrete,
            template_data
        )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(cliente.telefone)

        # Envia mensagem
        try:
            result = WhatsAppService._send_meta_api_message(
                phone_id=config.telefone_id,
                access_token=config.meta_token,
                to_phone=formatted_phone,
                message_text=message_text
            )

            message_id = None
            if 'messages' in result and len(result['messages']) > 0:
                message_id = result['messages'][0].get('id')

            # Marca como enviado
            agendamento.lembrete_enviado = True
            db.commit()

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except Exception as e:
            logger.error(f"Erro ao enviar lembrete: {str(e)}")
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e),
                telefone_destino=formatted_phone
            )

    @staticmethod
    def process_lembretes_cron(db: Session) -> Dict[str, Any]:
        """
        Processa envio de lembretes 24h antes dos agendamentos.
        Deve ser chamado por um Cron Job a cada hora.

        Retorna estatísticas do processamento.
        """
        logger.info("Iniciando processamento de lembretes de agendamento")

        stats = {
            'agendamentos_encontrados': 0,
            'lembretes_enviados': 0,
            'lembretes_falhas': 0,
            'erros': []
        }

        # Busca agendamentos que precisam de lembrete
        agendamentos = WhatsAppService.get_agendamentos_para_lembrete(db)
        stats['agendamentos_encontrados'] = len(agendamentos)

        # Envia lembrete para cada agendamento
        for agendamento in agendamentos:
            try:
                response = WhatsAppService.send_lembrete(db, agendamento)

                if response.sucesso:
                    stats['lembretes_enviados'] += 1
                else:
                    stats['lembretes_falhas'] += 1
                    stats['erros'].append(
                        f"Falha ao enviar lembrete para agendamento {agendamento.id}: {response.erro}"
                    )
            except Exception as e:
                stats['lembretes_falhas'] += 1
                stats['erros'].append(
                    f"Erro ao processar agendamento {agendamento.id}: {str(e)}"
                )
                logger.error(f"Erro ao processar agendamento {agendamento.id}: {str(e)}")

        logger.info(f"Processamento de lembretes finalizado: {stats}")
        return stats
