from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.utils.auth import get_current_active_user
from app.models.user import User
from app.schemas.cliente import (
    ClienteCreate, ClienteUpdate, ClienteResponse, ClienteList
)
from app.services.cliente_service import ClienteService

router = APIRouter()


@router.get("/", response_model=ClienteList)
async def listar_clientes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    nome: Optional[str] = None,
    telefone: Optional[str] = None,
    email: Optional[str] = None,
    ativo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar clientes com filtros"""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )

    clientes, total = ClienteService.get_clientes(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        skip=skip,
        limit=limit,
        nome=nome,
        telefone=telefone,
        email=email,
        ativo=ativo
    )

    return ClienteList(clientes=clientes, total=total)


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def criar_cliente(
    cliente_data: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar novo cliente"""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )

    cliente = ClienteService.create_cliente(
        db=db,
        cliente_data=cliente_data,
        estabelecimento_id=current_user.estabelecimento_id
    )
    return cliente


@router.get("/buscar", response_model=ClienteList)
async def buscar_clientes(
    q: str = Query(..., min_length=2, description="Termo de busca (nome, telefone, email)"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Buscar clientes por termo"""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )

    clientes = ClienteService.search_clientes(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        termo=q,
        limit=limit
    )
    return ClienteList(clientes=clientes, total=len(clientes))


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def obter_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter cliente por ID"""
    cliente = ClienteService.get_cliente(db=db, cliente_id=cliente_id)
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def atualizar_cliente(
    cliente_id: int,
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar cliente"""
    cliente = ClienteService.update_cliente(
        db=db,
        cliente_id=cliente_id,
        cliente_data=cliente_data
    )
    return cliente


@router.delete("/{cliente_id}")
async def desativar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Desativar cliente"""
    cliente = ClienteService.deactivate_cliente(db=db, cliente_id=cliente_id)
    return {"message": f"Cliente {cliente_id} desativado", "cliente": cliente}


@router.get("/{cliente_id}/agendamentos")
async def listar_agendamentos_cliente(
    cliente_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar histórico de agendamentos do cliente"""
    resultado = ClienteService.get_cliente_agendamentos(
        db=db,
        cliente_id=cliente_id,
        skip=skip,
        limit=limit
    )
    return resultado