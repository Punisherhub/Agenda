from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.utils.auth import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from app.schemas.estabelecimento import (
    EstabelecimentoCreate, EstabelecimentoUpdate, EstabelecimentoResponse, EstabelecimentoList
)

router = APIRouter()


def check_manager_permission(current_user: User):
    """Verificar se o usuário tem permissão de gerente ou superior"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a gerentes e administradores"
        )


@router.get("/", response_model=EstabelecimentoList)
async def listar_estabelecimentos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar estabelecimentos"""
    return {"estabelecimentos": [], "total": 0}


@router.post("/", response_model=EstabelecimentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_estabelecimento(
    estabelecimento_data: EstabelecimentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar novo estabelecimento"""
    check_manager_permission(current_user)
    return {"message": "Criar estabelecimento - to be implemented"}


@router.get("/{estabelecimento_id}", response_model=EstabelecimentoResponse)
async def obter_estabelecimento(
    estabelecimento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter estabelecimento por ID"""
    return {"message": f"Get estabelecimento {estabelecimento_id} - to be implemented"}


@router.put("/{estabelecimento_id}", response_model=EstabelecimentoResponse)
async def atualizar_estabelecimento(
    estabelecimento_id: int,
    estabelecimento_data: EstabelecimentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar estabelecimento"""
    check_manager_permission(current_user)
    return {"message": f"Update estabelecimento {estabelecimento_id} - to be implemented"}


@router.delete("/{estabelecimento_id}")
async def desativar_estabelecimento(
    estabelecimento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Desativar estabelecimento"""
    check_manager_permission(current_user)
    return {"message": f"Estabelecimento {estabelecimento_id} desativado"}


@router.get("/{estabelecimento_id}/horarios")
async def obter_horarios_funcionamento(
    estabelecimento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter horários de funcionamento do estabelecimento"""
    return {"message": "Horários de funcionamento - to be implemented"}