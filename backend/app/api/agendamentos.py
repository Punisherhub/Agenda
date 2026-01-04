from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
from app.database import get_db
from app.utils.auth import get_current_active_user
from app.utils.timezone import to_brazil_tz
from app.models.user import User
from app.schemas.agendamento import (
    AgendamentoCreate, AgendamentoUpdate, AgendamentoResponse,
    AgendamentoList, AgendamentoCalendar,
    AgendamentoStatusUpdate, StatusAgendamento
)
from app.services.agendamento_service import AgendamentoService

router = APIRouter()


def check_user_has_estabelecimento(current_user: User):
    """Verificar se usuário está vinculado a um estabelecimento."""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )


@router.get("/")
async def listar_agendamentos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    status_filter: Optional[StatusAgendamento] = Query(None, alias="status"),
    cliente_id: Optional[int] = None,
    servico_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar agendamentos do estabelecimento com filtros"""
    check_user_has_estabelecimento(current_user)

    agendamentos, total = AgendamentoService.get_agendamentos_by_estabelecimento(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        skip=skip,
        limit=limit,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=status_filter,
        cliente_id=cliente_id,
        servico_id=servico_id
    )

    # Converter agendamentos para dicionários com dados relacionados
    agendamentos_detalhados = []
    for ag in agendamentos:
        ag_dict = {
            "id": ag.id,
            "data_agendamento": to_brazil_tz(ag.data_agendamento) if ag.data_agendamento else None,
            "data_inicio": to_brazil_tz(ag.data_inicio),
            "data_fim": to_brazil_tz(ag.data_fim),
            "status": ag.status,
            "observacoes": ag.observacoes,
            "observacoes_internas": ag.observacoes_internas,
            "valor_servico": ag.valor_servico,
            "valor_desconto": ag.valor_desconto,
            "valor_final": ag.valor_final,
            "avaliacao_nota": ag.avaliacao_nota,
            "avaliacao_comentario": ag.avaliacao_comentario,
            "cliente_id": ag.cliente_id,
            "servico_id": ag.servico_id,
            "vendedor_id": ag.vendedor_id,
            "estabelecimento_id": ag.estabelecimento_id,
            "created_at": to_brazil_tz(ag.created_at) if ag.created_at else None,
            "updated_at": to_brazil_tz(ag.updated_at) if ag.updated_at else None,
            "canceled_at": to_brazil_tz(ag.canceled_at) if ag.canceled_at else None,
            "completed_at": to_brazil_tz(ag.completed_at) if ag.completed_at else None,
            # Campos de serviço personalizado
            "servico_personalizado": ag.servico_personalizado or False,
            "servico_personalizado_nome": ag.servico_personalizado_nome,
            "servico_personalizado_descricao": ag.servico_personalizado_descricao,
            # Dados relacionados
            "cliente": {
                "id": ag.cliente.id,
                "nome": ag.cliente.nome,
                "email": ag.cliente.email,
                "telefone": ag.cliente.telefone,
            } if ag.cliente else None,
            "servico": {
                "id": ag.servico.id,
                "nome": ag.servico.nome,
                "preco": ag.servico.preco,
                "duracao_minutos": ag.servico.duracao_minutos,
            } if ag.servico else None,
            "vendedor": {
                "id": ag.vendedor.id,
                "full_name": ag.vendedor.full_name,
                "email": ag.vendedor.email,
            } if ag.vendedor else None,
        }
        agendamentos_detalhados.append(ag_dict)

    return {"agendamentos": agendamentos_detalhados, "total": total}


@router.post("/", response_model=AgendamentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_agendamento(
    agendamento_data: AgendamentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar novo agendamento"""
    check_user_has_estabelecimento(current_user)

    agendamento = AgendamentoService.create_agendamento(
        db=db,
        agendamento_data=agendamento_data,
        current_user=current_user
    )

    return agendamento


@router.get("/calendario", response_model=List[AgendamentoCalendar])
async def agendamentos_calendario(
    data_inicio: date = Query(..., description="Data inicial (YYYY-MM-DD)"),
    data_fim: date = Query(..., description="Data final (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Buscar agendamentos para visualização em calendário"""
    check_user_has_estabelecimento(current_user)

    agendamentos = AgendamentoService.get_agendamentos_calendario(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    return agendamentos


@router.get("/{agendamento_id}", response_model=AgendamentoResponse)
async def obter_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter agendamento por ID"""
    check_user_has_estabelecimento(current_user)

    agendamento = AgendamentoService.get_agendamento(
        db=db,
        agendamento_id=agendamento_id,
        estabelecimento_id=current_user.estabelecimento_id
    )

    return agendamento


@router.put("/{agendamento_id}", response_model=AgendamentoResponse)
async def atualizar_agendamento(
    agendamento_id: int,
    agendamento_data: AgendamentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar agendamento"""
    check_user_has_estabelecimento(current_user)

    agendamento = AgendamentoService.update_agendamento(
        db=db,
        agendamento_id=agendamento_id,
        agendamento_data=agendamento_data,
        current_user=current_user
    )

    return agendamento


@router.patch("/{agendamento_id}/status", response_model=AgendamentoResponse)
async def atualizar_status_agendamento(
    agendamento_id: int,
    status_data: AgendamentoStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar apenas o status do agendamento"""
    check_user_has_estabelecimento(current_user)

    agendamento = AgendamentoService.update_status(
        db=db,
        agendamento_id=agendamento_id,
        novo_status=status_data.status,
        current_user=current_user
    )

    return agendamento


@router.delete("/{agendamento_id}")
async def cancelar_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancelar agendamento"""
    check_user_has_estabelecimento(current_user)

    agendamento = AgendamentoService.cancel_agendamento(
        db=db,
        agendamento_id=agendamento_id,
        current_user=current_user
    )

    return {"message": f"Agendamento {agendamento_id} cancelado", "agendamento": agendamento}


@router.delete("/{agendamento_id}/excluir")
async def excluir_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Excluir permanentemente um agendamento (apenas se cancelado ou não compareceu)"""
    check_user_has_estabelecimento(current_user)

    AgendamentoService.delete_agendamento(
        db=db,
        agendamento_id=agendamento_id,
        current_user=current_user
    )

    return {"message": f"Agendamento {agendamento_id} excluído permanentemente"}