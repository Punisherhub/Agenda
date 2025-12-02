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
    from app.utils.timezone import to_brazil_tz

    resultado = ClienteService.get_cliente_agendamentos(
        db=db,
        cliente_id=cliente_id,
        skip=skip,
        limit=limit
    )

    # Serializar agendamentos com dados relacionados
    agendamentos_serializados = []
    for ag in resultado['agendamentos']:
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
        agendamentos_serializados.append(ag_dict)

    return {
        "cliente": resultado['cliente'],
        "agendamentos": agendamentos_serializados,
        "total": resultado['total']
    }