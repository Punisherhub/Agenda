"""
Serviço de WhatsApp usando WAHA (WhatsApp HTTP API)
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import logging

from app.models import WhatsAppConfig, Cliente, Agendamento, User, Estabelecimento
from app.schemas.whatsapp import (
    WhatsAppConfigCreate,
    WhatsAppConfigUpdate,
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppTestRequest
)
from app.services.waha_service import WAHAService

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service para gerenciar WhatsApp via WAHA"""

    # ==================== Configuração ====================

    @staticmethod
    def get_config(db: Session, estabelecimento_id: int) -> Optional[WhatsAppConfig]:
        """Busca configuração WAHA do estabelecimento"""
        return db.query(WhatsAppConfig).filter(
            WhatsAppConfig.estabelecimento_id == estabelecimento_id
        ).first()

    @staticmethod
    def create_config(
        db: Session,
        config_data: WhatsAppConfigCreate
    ) -> WhatsAppConfig:
        """Cria configuração WAHA"""
        # Verifica se já existe
        existing = WhatsAppService.get_config(db, config_data.estabelecimento_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Configuração do WhatsApp já existe"
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
        """Atualiza configuração WAHA"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração não encontrada"
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
        """Remove configuração WAHA"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração não encontrada"
            )

        db.delete(config)
        db.commit()

    # ==================== Utilidades ====================

    @staticmethod
    def _format_phone_number(phone: str) -> str:
        """
        Formata número para padrão internacional.
        Exemplo: (11) 99999-9999 -> 5511999999999
        """
        clean_phone = ''.join(filter(str.isdigit, phone))

        # Adiciona código do país se não tiver
        if not clean_phone.startswith('55'):
            clean_phone = '55' + clean_phone

        return clean_phone

    @staticmethod
    def _replace_placeholders(template: str, data: Dict[str, Any]) -> str:
        """Substitui placeholders no template"""
        message = template
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            message = message.replace(placeholder, str(value))
        return message

    # ==================== Envio de Mensagens ====================

    @staticmethod
    def send_test_message(
        db: Session,
        estabelecimento_id: int,
        test_request: WhatsAppTestRequest
    ) -> WhatsAppMessageResponse:
        """Envia mensagem de teste via WAHA"""
        print("\n" + "=" * 80)
        print("WHATSAPP_SERVICE - ENVIO DE TESTE")
        print(f"Estabelecimento: {estabelecimento_id}")
        print(f"Telefone: {test_request.telefone}")
        print(f"Mensagem: {test_request.mensagem}")
        print("=" * 80)

        # Busca config
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração WAHA não encontrada"
            )

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(test_request.telefone)
        print(f"Telefone formatado: {formatted_phone}")

        try:
            # Envia via WAHA
            result = WAHAService.send_text_message(
                waha_url=config.waha_url,
                waha_api_key=config.waha_api_key,
                session_name=config.waha_session_name,
                to_phone=formatted_phone,
                message_text=test_request.mensagem
            )

            print(f"WAHA Response: {result}")

            # Extrai message_id corretamente
            message_id = result.get('key', {}).get('id')
            print(f"Message ID extraído: {message_id}")

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )

        except Exception as e:
            print(f"ERRO: {type(e).__name__} - {str(e)}")
            logger.error(f"Erro ao enviar teste: {str(e)}")
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e),
                telefone_destino=formatted_phone
            )

    @staticmethod
    def send_message(
        db: Session,
        estabelecimento_id: int,
        message_request: WhatsAppMessageRequest
    ) -> WhatsAppMessageResponse:
        """Envia mensagem WhatsApp usando template"""
        # Busca config
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config or not config.ativado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="WhatsApp não configurado ou desativado"
            )

        # Busca cliente
        cliente = db.query(Cliente).filter(
            Cliente.id == message_request.cliente_id,
            Cliente.estabelecimento_id == estabelecimento_id
        ).first()

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

        # Prepara mensagem
        if message_request.mensagem_customizada:
            message_text = message_request.mensagem_customizada
        else:
            # Busca template
            template = None
            tipo = message_request.tipo_mensagem.upper()

            if tipo == 'AGENDAMENTO':
                template = config.template_agendamento
            elif tipo == 'LEMBRETE':
                template = config.template_lembrete
            elif tipo == 'CONFIRMACAO':
                template = config.template_conclusao  # DEPRECATED - manter por compatibilidade
            elif tipo == 'CONCLUSAO':
                template = config.template_conclusao
            elif tipo == 'CANCELAMENTO':
                template = config.template_cancelamento
            elif tipo == 'RECICLAGEM':
                template = config.template_reciclagem

            if not template:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Template não configurado para tipo {tipo}"
                )

            # Busca nome da empresa do estabelecimento
            from app.models.estabelecimento import Estabelecimento
            from app.models.empresa import Empresa
            estabelecimento = db.query(Estabelecimento).filter(
                Estabelecimento.id == estabelecimento_id
            ).first()
            nome_empresa = ''
            if estabelecimento and estabelecimento.empresa_id:
                empresa = db.query(Empresa).filter(Empresa.id == estabelecimento.empresa_id).first()
                nome_empresa = empresa.nome if empresa else estabelecimento.nome

            # Busca dados do agendamento se fornecido
            placeholders = {
                'nome_cliente': cliente.nome,
                'telefone_cliente': cliente.telefone,
                'nome_empresa': nome_empresa
            }

            if message_request.agendamento_id:
                from sqlalchemy.orm import joinedload
                from zoneinfo import ZoneInfo

                BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")

                agendamento = db.query(Agendamento).options(
                    joinedload(Agendamento.cliente),
                    joinedload(Agendamento.servico),
                    joinedload(Agendamento.vendedor)
                ).filter(
                    Agendamento.id == message_request.agendamento_id
                ).first()

                if agendamento:
                    # Converter para timezone do Brasil antes de formatar
                    # Se o datetime não tem timezone (naive), assume que já está em horário do Brasil
                    if agendamento.data_inicio.tzinfo is None:
                        # Datetime naive - adiciona timezone do Brasil
                        data_inicio_br = agendamento.data_inicio.replace(tzinfo=BRAZIL_TZ)
                    else:
                        # Datetime aware - converte para timezone do Brasil
                        data_inicio_br = agendamento.data_inicio.astimezone(BRAZIL_TZ)

                    if agendamento.data_fim:
                        if agendamento.data_fim.tzinfo is None:
                            data_fim_br = agendamento.data_fim.replace(tzinfo=BRAZIL_TZ)
                        else:
                            data_fim_br = agendamento.data_fim.astimezone(BRAZIL_TZ)
                    else:
                        data_fim_br = None

                    # Log para debug
                    logger.info(f"[WHATSAPP] Agendamento ID {agendamento.id}:")
                    logger.info(f"  data_inicio original: {agendamento.data_inicio} (tzinfo: {agendamento.data_inicio.tzinfo})")
                    logger.info(f"  data_inicio_br: {data_inicio_br}")
                    logger.info(f"  hora formatada: {data_inicio_br.strftime('%H:%M')}")

                    placeholders.update({
                        'data': data_inicio_br.strftime('%d/%m/%Y'),
                        'hora': data_inicio_br.strftime('%H:%M'),
                        'hora_fim': data_fim_br.strftime('%H:%M') if data_fim_br else '',
                        'servico': agendamento.servico.nome if agendamento.servico else agendamento.servico_personalizado_nome or '',
                        'vendedor': agendamento.vendedor.full_name if agendamento.vendedor else '',
                        'valor': f"R$ {agendamento.valor_final:.2f}" if agendamento.valor_final else '',
                        'status': agendamento.status.value if agendamento.status else '',
                        'veiculo': agendamento.veiculo or ''
                    })

            message_text = WhatsAppService._replace_placeholders(template, placeholders)

        # Formata telefone
        formatted_phone = WhatsAppService._format_phone_number(cliente.telefone)

        # Envia via WAHA
        try:
            result = WAHAService.send_text_message(
                waha_url=config.waha_url,
                waha_api_key=config.waha_api_key,
                session_name=config.waha_session_name,
                to_phone=formatted_phone,
                message_text=message_text
            )

            message_id = result.get('key', {}).get('id')

            return WhatsAppMessageResponse(
                sucesso=True,
                mensagem_id=message_id,
                telefone_destino=formatted_phone
            )

        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {str(e)}")
            return WhatsAppMessageResponse(
                sucesso=False,
                erro=str(e),
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
        """Envia notificação de confirmação (DEPRECATED - manter por compatibilidade)"""
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
    def notify_conclusao(db: Session, agendamento: Agendamento) -> None:
        """Envia notificação de conclusão de serviço"""
        if not agendamento.cliente or not agendamento.estabelecimento_id:
            return

        config = WhatsAppService.get_config(db, agendamento.estabelecimento_id)
        if not config or not config.ativado or not config.enviar_conclusao:
            return

        try:
            WhatsAppService.send_message(
                db=db,
                estabelecimento_id=agendamento.estabelecimento_id,
                message_request=WhatsAppMessageRequest(
                    cliente_id=agendamento.cliente_id,
                    tipo_mensagem='CONCLUSAO',
                    agendamento_id=agendamento.id
                )
            )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação de conclusão: {str(e)}")

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
        meses_inatividade: int = 3
    ) -> List[Dict[str, Any]]:
        """Lista clientes sem agendamento há X meses"""
        from zoneinfo import ZoneInfo
        BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")

        data_limite = datetime.now(BRAZIL_TZ) - timedelta(days=meses_inatividade * 30)
        logger.info(f"[CLIENTES_INATIVOS] Data limite: {data_limite} (inatividade: {meses_inatividade} meses)")

        # Subquery: último agendamento de cada cliente
        subq = db.query(
            Agendamento.cliente_id,
            func.max(Agendamento.data_inicio).label('ultima_data')
        ).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            Agendamento.deleted_at.is_(None)
        ).group_by(Agendamento.cliente_id).subquery()

        # Clientes com último agendamento antes da data limite
        clientes_inativos = db.query(Cliente).join(
            subq, Cliente.id == subq.c.cliente_id
        ).filter(
            Cliente.estabelecimento_id == estabelecimento_id,
            Cliente.is_active == True,
            subq.c.ultima_data < data_limite
        ).all()

        resultado = []
        for cliente in clientes_inativos:
            # Busca data do último agendamento
            ultimo = db.query(Agendamento).filter(
                Agendamento.cliente_id == cliente.id,
                Agendamento.deleted_at.is_(None)
            ).order_by(Agendamento.data_inicio.desc()).first()

            # Calcular dias de inatividade usando timezone do Brasil
            dias_inativo = None
            if ultimo and ultimo.data_inicio:
                # Garantir que ambos datetimes estão no mesmo timezone
                agora_br = datetime.now(BRAZIL_TZ)
                ultimo_br = ultimo.data_inicio.astimezone(BRAZIL_TZ) if ultimo.data_inicio.tzinfo else ultimo.data_inicio.replace(tzinfo=BRAZIL_TZ)
                dias_inativo = (agora_br - ultimo_br).days

            resultado.append({
                'id': cliente.id,
                'nome': cliente.nome,
                'telefone': cliente.telefone,
                'email': cliente.email,
                'ultimo_agendamento': ultimo.data_inicio if ultimo else None,
                'dias_inativo': dias_inativo
            })

        return resultado

    @staticmethod
    def send_reciclagem_message(
        db: Session,
        estabelecimento_id: int,
        cliente_id: int
    ) -> WhatsAppMessageResponse:
        """Envia mensagem de reciclagem para cliente específico"""
        config = WhatsAppService.get_config(db, estabelecimento_id)
        if not config or not config.ativado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="WhatsApp não configurado"
            )

        return WhatsAppService.send_message(
            db=db,
            estabelecimento_id=estabelecimento_id,
            message_request=WhatsAppMessageRequest(
                cliente_id=cliente_id,
                tipo_mensagem='RECICLAGEM'
            )
        )

    @staticmethod
    def process_reciclagem_cron(db: Session) -> Dict[str, Any]:
        """Processa envio de reciclagem para todos estabelecimentos (CRON)"""
        stats = {
            'estabelecimentos_processados': 0,
            'mensagens_enviadas': 0,
            'erros': 0
        }

        # Busca todos estabelecimentos com WhatsApp ativo e reciclagem habilitada
        configs = db.query(WhatsAppConfig).filter(
            WhatsAppConfig.ativado == True,
            WhatsAppConfig.enviar_reciclagem == True
        ).all()

        for config in configs:
            stats['estabelecimentos_processados'] += 1

            # Lista clientes inativos
            clientes_inativos = WhatsAppService.get_clientes_inativos(
                db=db,
                estabelecimento_id=config.estabelecimento_id,
                meses_inatividade=config.meses_inatividade
            )

            # Envia para cada cliente
            for cliente in clientes_inativos:
                try:
                    WhatsAppService.send_reciclagem_message(
                        db=db,
                        estabelecimento_id=config.estabelecimento_id,
                        cliente_id=cliente['id']
                    )
                    stats['mensagens_enviadas'] += 1
                except Exception as e:
                    logger.error(f"Erro ao enviar reciclagem para cliente {cliente['id']}: {str(e)}")
                    stats['erros'] += 1

        return stats

    @staticmethod
    def process_lembretes_cron(db: Session) -> Dict[str, Any]:
        """Processa envio de lembretes 24h antes (CRON)"""
        from zoneinfo import ZoneInfo
        BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")

        stats = {
            'agendamentos_processados': 0,
            'lembretes_enviados': 0,
            'erros': 0
        }

        # Busca agendamentos entre 23h e 25h no futuro (usar horário do Brasil)
        agora = datetime.now(BRAZIL_TZ)
        inicio_janela = agora + timedelta(hours=23)
        fim_janela = agora + timedelta(hours=25)

        logger.info(f"[LEMBRETES_CRON] Processando lembretes. Agora: {agora}")
        logger.info(f"[LEMBRETES_CRON] Janela: {inicio_janela} até {fim_janela}")

        agendamentos = db.query(Agendamento).filter(
            Agendamento.data_inicio >= inicio_janela,
            Agendamento.data_inicio <= fim_janela,
            Agendamento.deleted_at.is_(None),
            Agendamento.status.in_(['AGENDADO', 'CONFIRMADO'])
        ).all()

        for agendamento in agendamentos:
            stats['agendamentos_processados'] += 1

            # Verifica config
            config = WhatsAppService.get_config(db, agendamento.estabelecimento_id)
            if not config or not config.ativado or not config.enviar_lembrete:
                continue

            try:
                WhatsAppService.send_message(
                    db=db,
                    estabelecimento_id=agendamento.estabelecimento_id,
                    message_request=WhatsAppMessageRequest(
                        cliente_id=agendamento.cliente_id,
                        tipo_mensagem='LEMBRETE',
                        agendamento_id=agendamento.id
                    )
                )
                stats['lembretes_enviados'] += 1
            except Exception as e:
                logger.error(f"Erro ao enviar lembrete para agendamento {agendamento.id}: {str(e)}")
                stats['erros'] += 1

        return stats
