from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.utils.auth import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from app.schemas.empresa import EmpresaCreate, EmpresaUpdate, EmpresaResponse, EmpresaList

router = APIRouter()


def check_admin_permission(current_user: User):
    """Verificar se o usuário tem permissão de administrador"""
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )


@router.get("/", response_model=EmpresaList)
async def listar_empresas(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar empresas"""
    check_admin_permission(current_user)
    return {"empresas": [], "total": 0}


@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
async def criar_empresa(
    empresa_data: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar nova empresa"""
    check_admin_permission(current_user)
    return {"message": "Criar empresa - to be implemented"}


@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def obter_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter empresa por ID"""
    check_admin_permission(current_user)
    return {"message": f"Get empresa {empresa_id} - to be implemented"}


@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def atualizar_empresa(
    empresa_id: int,
    empresa_data: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar empresa"""
    check_admin_permission(current_user)
    return {"message": f"Update empresa {empresa_id} - to be implemented"}


@router.delete("/{empresa_id}")
async def desativar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Desativar empresa"""
    check_admin_permission(current_user)
    return {"message": f"Empresa {empresa_id} desativada"}