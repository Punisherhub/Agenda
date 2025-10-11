from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.utils.auth import get_current_active_user, get_optional_current_user
from app.models.user import User
from app.schemas.servico import (
    ServicoCreate, ServicoUpdate, ServicoResponse, ServicoList, ServicoPublic
)
from app.services.servico_service import ServicoService

router = APIRouter()


def check_user_has_estabelecimento(current_user: User):
    """Verificar se usuário está vinculado a um estabelecimento."""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )


@router.get("/", response_model=ServicoList)
async def listar_servicos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    categoria: Optional[str] = None,
    ativo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar serviços do estabelecimento"""
    check_user_has_estabelecimento(current_user)

    servicos, total = ServicoService.get_servicos_by_estabelecimento(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        skip=skip,
        limit=limit,
        categoria=categoria,
        ativo=ativo
    )

    return ServicoList(servicos=servicos, total=total)


@router.get("/publicos", response_model=List[ServicoPublic])
async def listar_servicos_publicos(
    estabelecimento_id: int = Query(..., description="ID do estabelecimento"),
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Listar serviços públicos para clientes (não requer autenticação)"""
    servicos = ServicoService.get_servicos_publicos(
        db=db,
        estabelecimento_id=estabelecimento_id,
        categoria=categoria
    )
    return servicos


@router.post("/", response_model=ServicoResponse, status_code=status.HTTP_201_CREATED)
async def criar_servico(
    servico_data: ServicoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar novo serviço"""
    check_user_has_estabelecimento(current_user)
    # Roles são apenas para organização - todos podem criar serviços

    servico = ServicoService.create_servico(
        db=db,
        servico_data=servico_data,
        current_user=current_user
    )
    return servico


@router.get("/{servico_id}", response_model=ServicoResponse)
async def obter_servico(
    servico_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter serviço por ID"""
    check_user_has_estabelecimento(current_user)

    servico = ServicoService.get_servico(
        db=db,
        servico_id=servico_id,
        estabelecimento_id=current_user.estabelecimento_id
    )
    return servico


@router.put("/{servico_id}", response_model=ServicoResponse)
async def atualizar_servico(
    servico_id: int,
    servico_data: ServicoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar serviço"""
    check_user_has_estabelecimento(current_user)
    # Roles são apenas para organização - todos podem editar serviços

    servico = ServicoService.update_servico(
        db=db,
        servico_id=servico_id,
        servico_data=servico_data,
        current_user=current_user
    )
    return servico


@router.delete("/{servico_id}")
async def desativar_servico(
    servico_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Desativar serviço"""
    check_user_has_estabelecimento(current_user)
    # Roles são apenas para organização - todos podem desativar serviços

    servico = ServicoService.deactivate_servico(
        db=db,
        servico_id=servico_id,
        current_user=current_user
    )
    return {"message": f"Serviço {servico_id} desativado", "servico": servico}


@router.get("/{servico_id}/agendamentos")
async def listar_agendamentos_servico(
    servico_id: int,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar agendamentos de um serviço específico"""
    check_user_has_estabelecimento(current_user)

    resultado = ServicoService.get_agendamentos_servico(
        db=db,
        servico_id=servico_id,
        estabelecimento_id=current_user.estabelecimento_id,
        data_inicio=data_inicio,
        data_fim=data_fim
    )
    return resultado