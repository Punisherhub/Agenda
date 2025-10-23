"""Sistema de permissões baseado em roles"""
from fastapi import HTTPException, status
from app.models.user import User, UserRole


def check_admin_or_manager(current_user: User):
    """Verificar se usuário é ADMIN ou MANAGER"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores e gerentes podem acessar este recurso."
        )


def check_admin(current_user: User):
    """Verificar se usuário é ADMIN"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar este recurso."
        )


def can_access_servicos(current_user: User) -> bool:
    """Verificar se pode acessar serviços"""
    return current_user.role in [UserRole.ADMIN, UserRole.MANAGER]


def can_access_materiais(current_user: User) -> bool:
    """Verificar se pode acessar materiais"""
    return current_user.role in [UserRole.ADMIN, UserRole.MANAGER]


def can_access_relatorios(current_user: User) -> bool:
    """Verificar se pode acessar relatórios"""
    return current_user.role in [UserRole.ADMIN, UserRole.MANAGER]


def can_access_agendamentos(current_user: User) -> bool:
    """Verificar se pode acessar agendamentos (todos podem)"""
    return True


def can_access_clientes(current_user: User) -> bool:
    """Verificar se pode acessar clientes (todos podem)"""
    return True
