from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.utils.auth import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from app.schemas.empresa import EmpresaCreate, EmpresaUpdate, EmpresaResponse, EmpresaList

router = APIRouter()


def check_admin_permission(current_user: User):
    """Verificar se o usuário tem permissão de administrador ou suporte"""
    print(f"[EMPRESAS] Checking permission for user: {current_user.email}, role: {current_user.role}, role type: {type(current_user.role)}")
    print(f"[EMPRESAS] UserRole.ADMIN: {UserRole.ADMIN}, UserRole.SUPORTE: {UserRole.SUPORTE}")
    print(f"[EMPRESAS] Comparison: role == 'suporte': {current_user.role == 'suporte'}")

    if current_user.role not in [UserRole.ADMIN, UserRole.SUPORTE, "suporte"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso restrito a administradores e suporte. Role atual: {current_user.role}"
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

    from app.models.empresa import Empresa

    query = db.query(Empresa)  # Removido filtro is_active para mostrar todos
    total = query.count()
    empresas = query.offset(skip).limit(limit).all()

    return {"empresas": empresas, "total": total}


@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
async def criar_empresa(
    empresa_data: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar nova empresa"""
    check_admin_permission(current_user)

    from app.models.empresa import Empresa

    # Verificar se CNPJ já existe
    if db.query(Empresa).filter(Empresa.cnpj == empresa_data.cnpj).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CNPJ já cadastrado"
        )

    nova_empresa = Empresa(**empresa_data.model_dump())
    db.add(nova_empresa)
    db.commit()
    db.refresh(nova_empresa)

    return nova_empresa


@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def obter_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter empresa por ID"""
    check_admin_permission(current_user)

    from app.models.empresa import Empresa

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )

    return empresa


@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def atualizar_empresa(
    empresa_id: int,
    empresa_data: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar empresa"""
    check_admin_permission(current_user)

    from app.models.empresa import Empresa

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )

    update_data = empresa_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(empresa, field, value)

    db.commit()
    db.refresh(empresa)

    return empresa


@router.delete("/{empresa_id}")
async def desativar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Desativar empresa"""
    check_admin_permission(current_user)

    from app.models.empresa import Empresa

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )

    empresa.is_active = False
    db.commit()

    return {"message": f"Empresa {empresa_id} desativada com sucesso"}