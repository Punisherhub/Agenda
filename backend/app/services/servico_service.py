from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List

from app.models.servico import Servico
from app.models.user import User
from app.schemas.servico import ServicoCreate, ServicoUpdate


class ServicoService:
    @staticmethod
    def get_servicos_by_estabelecimento(
        db: Session,
        estabelecimento_id: int,
        skip: int = 0,
        limit: int = 50,
        categoria: Optional[str] = None,
        ativo: Optional[bool] = True
    ) -> tuple[List[Servico], int]:
        """Listar serviços do estabelecimento com filtros."""

        query = db.query(Servico).filter(
            Servico.estabelecimento_id == estabelecimento_id
        )

        # Aplicar filtros
        if categoria:
            query = query.filter(Servico.categoria.ilike(f"%{categoria}%"))

        if ativo is not None:
            query = query.filter(Servico.is_active == ativo)

        # Ordenar por categoria e nome
        query = query.order_by(Servico.categoria, Servico.nome)

        total = query.count()
        servicos = query.offset(skip).limit(limit).all()

        return servicos, total

    @staticmethod
    def get_servicos_publicos(
        db: Session,
        estabelecimento_id: int,
        categoria: Optional[str] = None
    ) -> List[Servico]:
        """Listar serviços públicos para clientes (não requer autenticação)."""

        query = db.query(Servico).filter(
            Servico.estabelecimento_id == estabelecimento_id,
            Servico.is_active == True
        )

        if categoria:
            query = query.filter(Servico.categoria.ilike(f"%{categoria}%"))

        servicos = query.order_by(Servico.categoria, Servico.nome).all()
        return servicos

    @staticmethod
    def get_servico(
        db: Session,
        servico_id: int,
        estabelecimento_id: int
    ) -> Servico:
        """Obter serviço por ID (apenas do estabelecimento)."""

        servico = db.query(Servico).filter(
            Servico.id == servico_id,
            Servico.estabelecimento_id == estabelecimento_id
        ).first()

        if not servico:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado"
            )

        return servico

    @staticmethod
    def create_servico(
        db: Session,
        servico_data: ServicoCreate,
        current_user: User
    ) -> Servico:
        """Criar novo serviço (apenas MANAGER ou ADMIN)."""

        # Verificar se já existe serviço com mesmo nome no estabelecimento
        existing_servico = db.query(Servico).filter(
            Servico.nome == servico_data.nome,
            Servico.estabelecimento_id == current_user.estabelecimento_id
        ).first()

        if existing_servico:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um serviço com este nome no estabelecimento"
            )

        # Criar serviço
        servico_dict = servico_data.dict()
        servico_dict['estabelecimento_id'] = current_user.estabelecimento_id
        db_servico = Servico(**servico_dict)

        db.add(db_servico)
        db.commit()
        db.refresh(db_servico)

        return db_servico

    @staticmethod
    def update_servico(
        db: Session,
        servico_id: int,
        servico_data: ServicoUpdate,
        current_user: User
    ) -> Servico:
        """Atualizar serviço (apenas MANAGER ou ADMIN)."""

        servico = ServicoService.get_servico(
            db, servico_id, current_user.estabelecimento_id
        )

        # Verificar conflito de nome apenas se mudou
        update_data = servico_data.dict(exclude_unset=True)

        if 'nome' in update_data and update_data['nome'] != servico.nome:
            existing_servico = db.query(Servico).filter(
                Servico.nome == update_data['nome'],
                Servico.estabelecimento_id == current_user.estabelecimento_id,
                Servico.id != servico_id
            ).first()

            if existing_servico:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um serviço com este nome no estabelecimento"
                )

        # Atualizar campos
        for field, value in update_data.items():
            setattr(servico, field, value)

        db.commit()
        db.refresh(servico)

        return servico

    @staticmethod
    def deactivate_servico(
        db: Session,
        servico_id: int,
        current_user: User
    ) -> Servico:
        """Desativar serviço (apenas MANAGER ou ADMIN)."""

        servico = ServicoService.get_servico(
            db, servico_id, current_user.estabelecimento_id
        )

        # Verificar se há agendamentos futuros
        from app.models.agendamento import Agendamento, StatusAgendamento
        from datetime import datetime

        agendamentos_futuros = db.query(Agendamento).filter(
            Agendamento.servico_id == servico_id,
            Agendamento.data_inicio > datetime.now(),
            Agendamento.status == StatusAgendamento.AGENDADO
        ).count()

        if agendamentos_futuros > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Não é possível desativar. Há {agendamentos_futuros} agendamentos futuros para este serviço."
            )

        servico.is_active = False
        db.commit()
        db.refresh(servico)

        return servico

    @staticmethod
    def get_agendamentos_servico(
        db: Session,
        servico_id: int,
        estabelecimento_id: int,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None
    ):
        """Listar agendamentos de um serviço específico."""

        servico = ServicoService.get_servico(db, servico_id, estabelecimento_id)

        from app.models.agendamento import Agendamento
        from sqlalchemy import func
        from datetime import datetime

        query = db.query(Agendamento).filter(
            Agendamento.servico_id == servico_id
        )

        if data_inicio:
            data_inicio_dt = datetime.fromisoformat(data_inicio)
            query = query.filter(func.date(Agendamento.data_inicio) >= data_inicio_dt.date())

        if data_fim:
            data_fim_dt = datetime.fromisoformat(data_fim)
            query = query.filter(func.date(Agendamento.data_inicio) <= data_fim_dt.date())

        agendamentos = query.order_by(Agendamento.data_inicio.desc()).all()

        return {
            "servico": servico,
            "agendamentos": agendamentos,
            "total": len(agendamentos)
        }