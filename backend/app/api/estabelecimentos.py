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
    """Verificar se o usuário tem permissão de gerente, administrador ou suporte"""
    # Normalizar role para lowercase para comparação (handle string or enum)
    user_role = current_user.role.lower() if isinstance(current_user.role, str) else current_user.role.value.lower()
    allowed_roles = ["admin", "manager", "suporte"]

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a gerentes, administradores e suporte"
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
    from app.models.estabelecimento import Estabelecimento
    from sqlalchemy.orm import joinedload

    query = db.query(Estabelecimento).options(joinedload(Estabelecimento.empresa))  # Removido filtro is_active para mostrar todos

    if empresa_id:
        query = query.filter(Estabelecimento.empresa_id == empresa_id)

    total = query.count()
    estabelecimentos = query.offset(skip).limit(limit).all()

    return {"estabelecimentos": estabelecimentos, "total": total}


@router.post("/", response_model=EstabelecimentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_estabelecimento(
    estabelecimento_data: EstabelecimentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar novo estabelecimento"""
    check_manager_permission(current_user)

    from app.models.estabelecimento import Estabelecimento
    from app.models.empresa import Empresa

    # Verificar se empresa existe
    empresa = db.query(Empresa).filter(Empresa.id == estabelecimento_data.empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )

    novo_estabelecimento = Estabelecimento(**estabelecimento_data.model_dump())
    db.add(novo_estabelecimento)
    db.commit()
    db.refresh(novo_estabelecimento)

    return novo_estabelecimento


@router.get("/{estabelecimento_id}", response_model=EstabelecimentoResponse)
async def obter_estabelecimento(
    estabelecimento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter estabelecimento por ID"""
    from app.models.estabelecimento import Estabelecimento
    from sqlalchemy.orm import joinedload

    estabelecimento = db.query(Estabelecimento).options(joinedload(Estabelecimento.empresa)).filter(Estabelecimento.id == estabelecimento_id).first()
    if not estabelecimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estabelecimento não encontrado"
        )

    return estabelecimento


@router.put("/{estabelecimento_id}", response_model=EstabelecimentoResponse)
async def atualizar_estabelecimento(
    estabelecimento_id: int,
    estabelecimento_data: EstabelecimentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar estabelecimento"""
    check_manager_permission(current_user)

    from app.models.estabelecimento import Estabelecimento

    estabelecimento = db.query(Estabelecimento).filter(Estabelecimento.id == estabelecimento_id).first()
    if not estabelecimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estabelecimento não encontrado"
        )

    update_data = estabelecimento_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estabelecimento, field, value)

    db.commit()
    db.refresh(estabelecimento)

    return estabelecimento


@router.delete("/{estabelecimento_id}")
async def deletar_estabelecimento(
    estabelecimento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deletar estabelecimento permanentemente - Admin/Manager/Suporte only

    ATENÇÃO: Esta ação é irreversível!
    - Deleta em cascata: Serviços, Usuários, Agendamentos e Materiais
    - Estabelecimento será removido do banco de dados
    """
    check_manager_permission(current_user)

    from app.models.estabelecimento import Estabelecimento

    estabelecimento = db.query(Estabelecimento).filter(Estabelecimento.id == estabelecimento_id).first()
    if not estabelecimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estabelecimento não encontrado"
        )

    # Deletar permanentemente (cascade delete configurado nos relationships)
    db.delete(estabelecimento)
    db.commit()

    return {"message": f"Estabelecimento {estabelecimento_id} deletado permanentemente com sucesso"}


@router.get("/{estabelecimento_id}/horarios")
async def obter_horarios_funcionamento(
    estabelecimento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter horários de funcionamento do estabelecimento"""
    return {"message": "Horários de funcionamento - to be implemented"}