from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from fastapi import HTTPException, status
from typing import Optional, List
from datetime import datetime, date, timedelta, timezone

from app.models.agendamento import Agendamento, StatusAgendamento
from app.models.user import User
from app.models.cliente import Cliente
from app.models.servico import Servico
from app.schemas.agendamento import AgendamentoCreate, AgendamentoUpdate


class AgendamentoService:
    @staticmethod
    def get_agendamentos_by_estabelecimento(
        db: Session,
        estabelecimento_id: int,
        skip: int = 0,
        limit: int = 50,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        status: Optional[StatusAgendamento] = None,
        cliente_id: Optional[int] = None,
        servico_id: Optional[int] = None
    ) -> tuple[List[Agendamento], int]:
        """Listar agendamentos do estabelecimento com filtros."""

        query = db.query(Agendamento).options(
            joinedload(Agendamento.cliente),
            joinedload(Agendamento.servico),
            joinedload(Agendamento.vendedor)
        ).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            Agendamento.deleted_at.is_(None)  # Não mostrar agendamentos excluídos
        )

        # Aplicar filtros
        if data_inicio:
            query = query.filter(func.date(Agendamento.data_inicio) >= data_inicio)

        if data_fim:
            query = query.filter(func.date(Agendamento.data_inicio) <= data_fim)

        if status:
            query = query.filter(Agendamento.status == status)

        if cliente_id:
            query = query.filter(Agendamento.cliente_id == cliente_id)

        if servico_id:
            query = query.filter(Agendamento.servico_id == servico_id)

        # Ordenar por data
        query = query.order_by(Agendamento.data_inicio.desc())

        total = query.count()
        agendamentos = query.offset(skip).limit(limit).all()

        return agendamentos, total

    @staticmethod
    def create_agendamento(
        db: Session,
        agendamento_data: AgendamentoCreate,
        current_user: User
    ) -> Agendamento:
        """Criar novo agendamento (serviço predefinido ou personalizado)."""

        # Verificar se cliente existe
        cliente = db.query(Cliente).filter(Cliente.id == agendamento_data.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        # Variáveis para dados do serviço
        servico = None
        valor_servico = None
        duracao_minutos = 60  # Duração padrão de 1 hora para serviços personalizados

        # Lógica para serviço personalizado vs predefinido
        if agendamento_data.servico_personalizado:
            # Serviço personalizado - validar campos obrigatórios
            if not agendamento_data.servico_personalizado_nome:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nome do serviço personalizado é obrigatório"
                )

            if agendamento_data.valor_servico_personalizado is None or agendamento_data.valor_servico_personalizado <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Valor do serviço personalizado é obrigatório e deve ser maior que zero"
                )

            valor_servico = agendamento_data.valor_servico_personalizado
            duracao_minutos = 60  # Duração padrão de 1 hora para serviços personalizados
        else:
            # Serviço predefinido - exigir servico_id
            if not agendamento_data.servico_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Serviço deve ser selecionado ou marcar como personalizado"
                )

            servico = db.query(Servico).filter(
                Servico.id == agendamento_data.servico_id,
                Servico.estabelecimento_id == current_user.estabelecimento_id
            ).first()

            if not servico:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Serviço não encontrado ou não pertence ao seu estabelecimento"
                )

            valor_servico = servico.preco
            duracao_minutos = servico.duracao_minutos

        # Calcular data_fim
        if agendamento_data.data_fim:
            data_fim = agendamento_data.data_fim
        else:
            data_fim = agendamento_data.data_inicio + timedelta(minutes=duracao_minutos)

        # Verificar conflitos de horário
        conflito = db.query(Agendamento).filter(
            Agendamento.estabelecimento_id == current_user.estabelecimento_id,
            Agendamento.status.in_([StatusAgendamento.AGENDADO, StatusAgendamento.CONFIRMADO]),
            or_(
                and_(Agendamento.data_inicio <= agendamento_data.data_inicio, Agendamento.data_fim > agendamento_data.data_inicio),
                and_(Agendamento.data_inicio < data_fim, Agendamento.data_fim >= data_fim),
                and_(Agendamento.data_inicio >= agendamento_data.data_inicio, Agendamento.data_fim <= data_fim)
            )
        ).first()

        if conflito:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Conflito de horário com agendamento existente (ID: {conflito.id})"
            )

        # Calcular valores finais
        valor_desconto = agendamento_data.valor_desconto or 0
        valor_final = valor_servico - valor_desconto

        # Criar agendamento
        db_agendamento = Agendamento(
            data_agendamento=datetime.now(),
            data_inicio=agendamento_data.data_inicio,
            data_fim=data_fim,
            status=StatusAgendamento.AGENDADO,
            observacoes=agendamento_data.observacoes,
            valor_servico=valor_servico,
            valor_desconto=valor_desconto,
            valor_final=valor_final,
            cliente_id=agendamento_data.cliente_id,
            servico_id=agendamento_data.servico_id,  # Será None se personalizado
            vendedor_id=current_user.id,
            estabelecimento_id=current_user.estabelecimento_id,
            # Campos de serviço personalizado
            servico_personalizado=agendamento_data.servico_personalizado or False,
            servico_personalizado_nome=agendamento_data.servico_personalizado_nome,
            servico_personalizado_descricao=agendamento_data.servico_personalizado_descricao
        )

        db.add(db_agendamento)
        db.commit()
        db.refresh(db_agendamento)

        return db_agendamento

    @staticmethod
    def get_agendamento(
        db: Session,
        agendamento_id: int,
        estabelecimento_id: int
    ) -> Agendamento:
        """Obter agendamento por ID (apenas do estabelecimento)."""

        agendamento = db.query(Agendamento).filter(
            Agendamento.id == agendamento_id,
            Agendamento.estabelecimento_id == estabelecimento_id
        ).first()

        if not agendamento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado"
            )

        return agendamento

    @staticmethod
    def update_agendamento(
        db: Session,
        agendamento_id: int,
        agendamento_data: AgendamentoUpdate,
        current_user: User
    ) -> Agendamento:
        """Atualizar agendamento."""

        agendamento = AgendamentoService.get_agendamento(
            db, agendamento_id, current_user.estabelecimento_id
        )

        # Atualizar campos fornecidos
        update_data = agendamento_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(agendamento, field):
                setattr(agendamento, field, value)

        # Se mudou data/hora mas não forneceu data_fim, recalcular data_fim
        if 'data_inicio' in update_data and update_data['data_inicio'] and 'data_fim' not in update_data:
            servico = db.query(Servico).filter(Servico.id == agendamento.servico_id).first()
            if servico and servico.duracao_minutos:
                agendamento.data_fim = agendamento_data.data_inicio + timedelta(minutes=servico.duracao_minutos)

        db.commit()
        db.refresh(agendamento)

        return agendamento

    @staticmethod
    def update_status(
        db: Session,
        agendamento_id: int,
        novo_status: StatusAgendamento,
        current_user: User
    ) -> Agendamento:
        """Atualizar apenas o status do agendamento."""

        print(f"[AGENDAMENTO] update_status CHAMADO - ID: {agendamento_id}, Novo Status: {novo_status}")

        agendamento = AgendamentoService.get_agendamento(
            db, agendamento_id, current_user.estabelecimento_id
        )

        print(f"[AGENDAMENTO] Status atual: {agendamento.status}, Mudando para: {novo_status}")

        agendamento.status = novo_status

        # Atualizar timestamps específicos
        # Comparar por .value porque vem do schema (Pydantic) e não do model (SQLAlchemy)
        status_valor = novo_status.value if hasattr(novo_status, 'value') else str(novo_status)

        if status_valor == StatusAgendamento.CANCELADO.value:
            agendamento.canceled_at = datetime.now()
            print(f"[AGENDAMENTO] Marcado como cancelado")
        elif status_valor == StatusAgendamento.CONCLUIDO.value:
            agendamento.completed_at = datetime.now()

            # Sistema de fidelidade: adicionar pontos automaticamente
            print(f"[AGENDAMENTO] Concluindo agendamento {agendamento_id}, processando fidelidade...")
            try:
                from app.services.fidelidade_service import FidelidadeService
                pontos = FidelidadeService.processar_pontos_agendamento(db, agendamento_id)
                print(f"[AGENDAMENTO] Fidelidade processada! Pontos adicionados: {pontos}")
            except Exception as e:
                # Não falhar o agendamento se houver erro no sistema de fidelidade
                print(f"[AGENDAMENTO] ERRO ao processar pontos de fidelidade: {e}")
                import traceback
                traceback.print_exc()

        db.commit()
        db.refresh(agendamento)

        return agendamento

    @staticmethod
    def get_agendamentos_calendario(
        db: Session,
        estabelecimento_id: int,
        data_inicio: date,
        data_fim: date
    ) -> List[Agendamento]:
        """Buscar agendamentos para visualização em calendário."""

        agendamentos = db.query(Agendamento).options(
            joinedload(Agendamento.cliente),
            joinedload(Agendamento.servico),
            joinedload(Agendamento.vendedor)
        ).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            func.date(Agendamento.data_inicio) >= data_inicio,
            func.date(Agendamento.data_inicio) <= data_fim,
            Agendamento.status != StatusAgendamento.CANCELADO,
            Agendamento.deleted_at.is_(None)  # Não mostrar agendamentos excluídos
        ).order_by(Agendamento.data_inicio).all()

        return agendamentos

    @staticmethod
    def cancel_agendamento(
        db: Session,
        agendamento_id: int,
        current_user: User
    ) -> Agendamento:
        """Cancelar agendamento."""

        return AgendamentoService.update_status(
            db, agendamento_id, StatusAgendamento.CANCELADO, current_user
        )

    @staticmethod
    def delete_agendamento(
        db: Session,
        agendamento_id: int,
        current_user: User
    ) -> None:
        """Excluir agendamento do calendário (soft delete ou hard delete conforme status)."""

        agendamento = AgendamentoService.get_agendamento(
            db, agendamento_id, current_user.estabelecimento_id
        )

        # Se agendamento está CANCELADO ou NAO_COMPARECEU: hard delete (exclusão permanente)
        if agendamento.status in [StatusAgendamento.CANCELADO, StatusAgendamento.NAO_COMPARECEU]:
            db.delete(agendamento)
        else:
            # Outros status: soft delete (apenas oculta do calendário)
            agendamento.deleted_at = datetime.now(timezone.utc)

        db.commit()