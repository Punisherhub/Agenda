"""Sistema de permissões baseado em roles"""
from fastapi import HTTPException, status
from app.models.user import User, UserRole


def _normalize_role(role) -> str:
    """Normalizar role para uppercase para comparação consistente"""
    if isinstance(role, str):
        return role.upper()
    if hasattr(role, 'value'):
        return role.value.upper()
    return str(role).upper()


def check_admin_or_manager(current_user: User):
    """Verificar se usuário é ADMIN ou MANAGER"""
    user_role = _normalize_role(current_user.role)
    allowed_roles = [_normalize_role(UserRole.ADMIN), _normalize_role(UserRole.MANAGER), _normalize_role(UserRole.SUPORTE)]

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores e gerentes podem acessar este recurso."
        )


def check_admin(current_user: User):
    """Verificar se usuário é ADMIN"""
    user_role = _normalize_role(current_user.role)
    allowed_roles = [_normalize_role(UserRole.ADMIN), _normalize_role(UserRole.SUPORTE)]

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar este recurso."
        )


def can_access_servicos(current_user: User) -> bool:
    """Verificar se pode acessar serviços"""
    user_role = _normalize_role(current_user.role)
    allowed_roles = [_normalize_role(UserRole.ADMIN), _normalize_role(UserRole.MANAGER), _normalize_role(UserRole.SUPORTE)]
    return user_role in allowed_roles


def can_access_materiais(current_user: User) -> bool:
    """Verificar se pode acessar materiais"""
    user_role = _normalize_role(current_user.role)
    allowed_roles = [_normalize_role(UserRole.ADMIN), _normalize_role(UserRole.MANAGER), _normalize_role(UserRole.SUPORTE)]
    return user_role in allowed_roles


def can_access_relatorios(current_user: User) -> bool:
    """Verificar se pode acessar relatórios"""
    user_role = _normalize_role(current_user.role)
    allowed_roles = [_normalize_role(UserRole.ADMIN), _normalize_role(UserRole.MANAGER), _normalize_role(UserRole.SUPORTE)]
    return user_role in allowed_roles


def can_access_agendamentos(current_user: User) -> bool:
    """Verificar se pode acessar agendamentos (todos podem)"""
    return True


def can_access_clientes(current_user: User) -> bool:
    """Verificar se pode acessar clientes (todos podem)"""
    return True
