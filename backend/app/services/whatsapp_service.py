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
    """Service para gerenciar configuração do WhatsApp e envio de mensagens via Evolution API"""

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
        Formata número de telefone para o padrão Evolution API.
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
            'vendedor': vendedor.full_name if vendedor else 'Nossa equipe',
            'valor': f"R$ {agendamento.valor_final:.2f}" if agendamento.valor_final else '',
            'status': agendamento.status.value if agendamento.status else '',
        }

    @staticmethod
    def _send_evolution_message(
        evolution_api_url: str,
        evolution_api_key: str,
        instance_name: str,
        to_phone: str,
        message_text: str
    ) -> Dict[str, Any]:
        """
        Envia mensagem via Evolution API.

        Docs: https://doc.evolution-api.com/v2/pt/endpoints/send-message
        """
        url = f"{evolution_api_url.rstrip('/')}/message/sendText/{instance_name}"

        headers = {
            "apikey": evolution_api_key,
            "Content-Type": "application/json"
        }

        payload = {
            "number": to_phone,
            "text": message_text
        }

        try:
            logger.info(f"Enviando mensagem WhatsApp para {to_phone} via Evolution API")
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Mensagem enviada com sucesso: {result}")
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao enviar mensagem WhatsApp: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Resposta da API: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao enviar mensagem WhatsApp: {str(e)}"
            )

    @staticmethod
    def send_message(
        db: Session,
        estabelecimento_id: int,
        message_request: WhatsAppMessageRequest
    ) -> WhatsAppMessageResponse:
        """Envia mensagem WhatsApp para um cliente"""
        # Busca configuração
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config or not config.ativado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="WhatsApp não está configurado ou ativado para este estabelecimento"
            )

        # Busca cliente
        cliente = db.query(Cliente).filter(
            and_(
                Cliente.id == message_request.cliente_id,
                Cliente.estabelecimento_id == estabelecimento_id,
                Cliente.is_active == True
            )
        ).first()

        if not cliente or not cliente.telefone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado ou sem telefone cadastrado"
            )

        # Determina o template a usar
        template_map = {
            'AGENDAMENTO': (config.template_agendamento, config.enviar_agendamento),
            'LEMBRETE': (config.template_lembrete, config.enviar_lembrete),
            'CONFIRMACAO': (config.template_confirmacao, config.enviar_confirmacao),
            'CANCELAMENTO': (config.template_cancelamento, config.enviar_cancelamento),
            'RECICLAGEM': (config.template_reciclagem, config.enviar_reciclagem),
        }

        tipo = message_request.tipo_mensagem.upper()
        if tipo not in template_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de mensagem inválido: {tipo}"
            )

        template, enviar_ativo = template_map[tipo]

        if not enviar_ativo:
            return WhatsAppMessageResponse(
                sucesso=False,
                erro="Tipo de mensagem desativado nas configurações",
                telefone_destino=cliente.telefone
            )

        # Monta mensagem
        if message_request.mensagem_customizada:
            message_text = message_request.mensagem_customizada
        elif template:
            # Busca dados do agendamento se necessário
            if message_request.agendamento_id:
                agendamento = db.query(Agendamento).filter(Agendamento.id == message_request.agendamento_id).first()
                if agendamento:
                    template_data = WhatsAppService._get_template_data_from_agendamento(db, agendamento)
                else:
                    template_data = {'nome_cliente': cliente.nome}
            else:
                template_data = {'nome_cliente': cliente.nome}

            message_text = WhatsAppService._replace_placeholders(template, template_data)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template não configurado para {tipo}"
            )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(cliente.telefone)

        # Envia mensagem via Evolution API
        try:
            result = WhatsAppService._send_evolution_message(
                evolution_api_url=config.evolution_api_url,
                evolution_api_key=config.evolution_api_key,
                instance_name=config.evolution_instance_name,
                to_phone=formatted_phone,
                message_text=message_text
            )

            # Extrai ID da mensagem (Evolution API retorna formato diferente)
            message_id = result.get('key', {}).get('id') if isinstance(result.get('key'), dict) else None

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except HTTPException as e:
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e.detail),
                telefone_destino=formatted_phone
            )

    @staticmethod
    def send_test_message(
        db: Session,
        estabelecimento_id: int,
        test_request: WhatsAppTestRequest
    ) -> WhatsAppMessageResponse:
        """Envia mensagem de teste"""
        # Busca configuração
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração do WhatsApp não encontrada"
            )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(test_request.telefone)

        # Envia mensagem
        try:
            result = WhatsAppService._send_evolution_message(
                evolution_api_url=config.evolution_api_url,
                evolution_api_key=config.evolution_api_key,
                instance_name=config.evolution_instance_name,
                to_phone=formatted_phone,
                message_text=test_request.mensagem
            )

            message_id = result.get('key', {}).get('id') if isinstance(result.get('key'), dict) else None

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except HTTPException as e:
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e.detail),
                telefone_destino=formatted_phone
            )

    # ==================== Notificações Automáticas ====================

    @staticmethod
    def notify_novo_agendamento(db: Session, agendamento: Agendamento) -> None:
        """Envia notificação de novo agendamento"""
        if not agendamento.cliente or not agendamento.estabelecimento_id:
            return

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
        """Envia notificação de confirmação"""
        if not agendamento.cliente or not agendamento.estabelecimento_id:
            return

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
        """Envia notificação de cancelamento"""
        if not agendamento.cliente or not agendamento.estabelecimento_id:
            return

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

    # ==================== Reciclagem de Clientes ====================

    @staticmethod
    def get_clientes_inativos(
        db: Session,
        estabelecimento_id: int,
        meses_inatividade: int
    ) -> List[Dict[str, Any]]:
        """
        Retorna lista de clientes inativos (sem agendamento há X meses).
        """
        data_limite = datetime.now() - timedelta(days=30 * meses_inatividade)

        # Subquery para último agendamento de cada cliente
        ultimo_agendamento_sq = (
            db.query(
                Agendamento.cliente_id,
                func.max(Agendamento.data_inicio).label('ultimo_agendamento')
            )
            .filter(Agendamento.estabelecimento_id == estabelecimento_id)
            .group_by(Agendamento.cliente_id)
            .subquery()
        )

        # Clientes inativos
        clientes_inativos = (
            db.query(Cliente, ultimo_agendamento_sq.c.ultimo_agendamento)
            .outerjoin(ultimo_agendamento_sq, Cliente.id == ultimo_agendamento_sq.c.cliente_id)
            .filter(
                Cliente.estabelecimento_id == estabelecimento_id,
                Cliente.is_active == True,
                Cliente.telefone != None,
                Cliente.telefone != '',
                func.coalesce(ultimo_agendamento_sq.c.ultimo_agendamento, Cliente.created_at) < data_limite
            )
            .all()
        )

        result = []
        for cliente, ultimo_agendamento in clientes_inativos:
            meses_inativo = (datetime.now() - (ultimo_agendamento or cliente.created_at)).days // 30
            result.append({
                'cliente_id': cliente.id,
                'nome': cliente.nome,
                'telefone': cliente.telefone,
                'email': cliente.email,
                'ultimo_agendamento': ultimo_agendamento.isoformat() if ultimo_agendamento else None,
                'meses_inativo': meses_inativo
            })

        return result

    @staticmethod
    def send_reciclagem_message(
        db: Session,
        estabelecimento_id: int,
        cliente_id: int
    ) -> WhatsAppMessageResponse:
        """Envia mensagem de reciclagem para cliente específico"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config or not config.ativado or not config.enviar_reciclagem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reciclagem não está ativada"
            )

        cliente = db.query(Cliente).filter(
            Cliente.id == cliente_id,
            Cliente.estabelecimento_id == estabelecimento_id,
            Cliente.is_active == True
        ).first()

        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        # Busca último agendamento
        ultimo_agendamento = (
            db.query(Agendamento)
            .filter(Agendamento.cliente_id == cliente_id)
            .order_by(Agendamento.data_inicio.desc())
            .first()
        )

        # Busca estabelecimento
        estabelecimento = db.query(Estabelecimento).filter(Estabelecimento.id == estabelecimento_id).first()

        # Monta dados do template
        template_data = {
            'nome_cliente': cliente.nome,
            'nome_empresa': estabelecimento.nome if estabelecimento else 'Nossa empresa',
            'meses_inativo': config.meses_inatividade,
            'data_ultimo_servico': ultimo_agendamento.data_inicio.strftime('%d/%m') if ultimo_agendamento else 'há muito tempo',
            'link_agendamento': config.link_agendamento or ''
        }

        if not config.template_reciclagem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template de reciclagem não configurado"
            )

        message_text = WhatsAppService._replace_placeholders(config.template_reciclagem, template_data)

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(cliente.telefone)

        # Envia mensagem
        try:
            result = WhatsAppService._send_evolution_message(
                evolution_api_url=config.evolution_api_url,
                evolution_api_key=config.evolution_api_key,
                instance_name=config.evolution_instance_name,
                to_phone=formatted_phone,
                message_text=message_text
            )

            message_id = result.get('key', {}).get('id') if isinstance(result.get('key'), dict) else None

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )
        except HTTPException as e:
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e.detail),
                telefone_destino=formatted_phone
            )

    @staticmethod
    def process_reciclagem_cron(db: Session) -> Dict[str, Any]:
        """
        Processa reciclagem de clientes inativos para TODOS os estabelecimentos.
        Usado por cron job diário.
        """
        # Busca todas as configurações ativas com reciclagem habilitada
        configs = db.query(WhatsAppConfig).filter(
            WhatsAppConfig.ativado == True,
            WhatsAppConfig.enviar_reciclagem == True
        ).all()

        estatisticas = {
            'estabelecimentos_processados': 0,
            'clientes_inativos_encontrados': 0,
            'mensagens_enviadas': 0,
            'mensagens_falhas': 0,
            'erros': []
        }

        for config in configs:
            try:
                estatisticas['estabelecimentos_processados'] += 1

                # Busca clientes inativos
                clientes_inativos = WhatsAppService.get_clientes_inativos(
                    db=db,
                    estabelecimento_id=config.estabelecimento_id,
                    meses_inatividade=config.meses_inatividade
                )

                estatisticas['clientes_inativos_encontrados'] += len(clientes_inativos)

                # Envia mensagem para cada cliente
                for cliente_data in clientes_inativos:
                    try:
                        response = WhatsAppService.send_reciclagem_message(
                            db=db,
                            estabelecimento_id=config.estabelecimento_id,
                            cliente_id=cliente_data['cliente_id']
                        )

                        if response.sucesso:
                            estatisticas['mensagens_enviadas'] += 1
                        else:
                            estatisticas['mensagens_falhas'] += 1
                            estatisticas['erros'].append(f"Cliente {cliente_data['nome']}: {response.erro}")

                    except Exception as e:
                        estatisticas['mensagens_falhas'] += 1
                        estatisticas['erros'].append(f"Cliente {cliente_data['nome']}: {str(e)}")
                        logger.error(f"Erro ao enviar reciclagem para cliente {cliente_data['cliente_id']}: {str(e)}")

            except Exception as e:
                estatisticas['erros'].append(f"Estabelecimento {config.estabelecimento_id}: {str(e)}")
                logger.error(f"Erro ao processar reciclagem para estabelecimento {config.estabelecimento_id}: {str(e)}")

        logger.info(f"Processamento de reciclagem concluído: {estatisticas}")
        return estatisticas
