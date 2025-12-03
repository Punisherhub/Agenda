from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.utils.auth import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from pydantic import BaseModel, EmailStr

router = APIRouter()


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    is_active: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserList(BaseModel):
    users: list
    total: int


def check_admin_permission(current_user: User):
    """Verificar se o usuário tem permissão de administrador ou suporte"""
    print(f"[USERS] Checking permission for user: {current_user.email}, role: {current_user.role}, role type: {type(current_user.role)}")
    print(f"[USERS] UserRole.ADMIN: {UserRole.ADMIN}, UserRole.SUPORTE: {UserRole.SUPORTE}")
    print(f"[USERS] Comparison: role == 'suporte': {current_user.role == 'suporte'}")

    if current_user.role not in [UserRole.ADMIN, UserRole.SUPORTE, "suporte"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso restrito a administradores e suporte. Role atual: {current_user.role}"
        )


@router.get("/")
async def listar_usuarios(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    estabelecimento_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar usuários - Admin only"""
    check_admin_permission(current_user)

    query = db.query(User)  # Removido filtro is_active para mostrar todos

    if estabelecimento_id:
        query = query.filter(User.estabelecimento_id == estabelecimento_id)

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    return {"users": users, "total": total}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Obter dados do usuário logado"""
    return current_user


@router.put("/me")
async def update_current_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar dados do usuário logado"""
    update_data = user_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/{user_id}")
async def obter_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter usuário por ID - Admin only"""
    check_admin_permission(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    return user


@router.put("/{user_id}")
async def atualizar_usuario(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar usuário - Admin only"""
    check_admin_permission(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.put("/{user_id}/role")
async def atualizar_role_usuario(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar role do usuário - Admin only"""
    check_admin_permission(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    # Não pode alterar próprio role
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode alterar sua própria permissão"
        )

    # Converter enum para string em UPPERCASE (banco usa enum UPPERCASE)
    role_value = role_data.role.value if hasattr(role_data.role, 'value') else str(role_data.role)
    user.role = role_value.upper()
    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
async def deletar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deletar usuário permanentemente - Admin/Suporte only

    ATENÇÃO: Esta ação é irreversível!
    - Agendamentos do usuário terão vendedor_id = NULL
    - Usuário será removido do banco de dados
    """
    check_admin_permission(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    # Não pode deletar a si mesmo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar a si mesmo"
        )

    # Deletar permanentemente (agendamentos terão vendedor_id = NULL devido ao ondelete='SET NULL')
    db.delete(user)
    db.commit()

    return {"message": f"Usuário {user_id} deletado permanentemente com sucesso"}
