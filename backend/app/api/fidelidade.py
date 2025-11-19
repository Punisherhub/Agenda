from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User
from app.utils.auth import get_current_active_user
from app.utils.permissions import check_admin_or_manager
from app.services.fidelidade_service import FidelidadeService
from app.schemas.fidelidade import (
    ConfiguracaoFidelidadeCreate,
    ConfiguracaoFidelidadeUpdate,
    ConfiguracaoFidelidadeResponse,
    PremioCreate,
    PremioUpdate,
    PremioResponse,
    ResgatePremioCreate,
    ResgatePremioResponse,
    PremiosDisponiveisResponse,
)

router = APIRouter(prefix="/fidelidade", tags=["fidelidade"])


# ==================== ConfiguracaoFidelidade ====================

@router.get("/configuracao", response_model=ConfiguracaoFidelidadeResponse)
def get_configuracao(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Busca configuração de fidelidade do estabelecimento"""
    config = FidelidadeService.get_configuracao(db, current_user.estabelecimento_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração de fidelidade não encontrada"
        )
    return config


@router.post("/configuracao", response_model=ConfiguracaoFidelidadeResponse)
def create_configuracao(
    config_data: ConfiguracaoFidelidadeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cria configuração de fidelidade (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    # Força estabelecimento do usuário
    config_data.estabelecimento_id = current_user.estabelecimento_id
    return FidelidadeService.create_configuracao(db, config_data)


@router.put("/configuracao", response_model=ConfiguracaoFidelidadeResponse)
def update_configuracao(
    config_data: ConfiguracaoFidelidadeUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Atualiza configuração de fidelidade (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    return FidelidadeService.update_configuracao(
        db,
        current_user.estabelecimento_id,
        config_data
    )


# ==================== Premios ====================

@router.get("/premios", response_model=List[PremioResponse])
def list_premios(
    apenas_ativos: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista prêmios do estabelecimento"""
    return FidelidadeService.list_premios(
        db,
        current_user.estabelecimento_id,
        apenas_ativos
    )


@router.get("/premios/{premio_id}", response_model=PremioResponse)
def get_premio(
    premio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Busca prêmio por ID"""
    premio = FidelidadeService.get_premio(db, premio_id)
    if not premio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêmio não encontrado"
        )

    # Verifica se prêmio pertence ao estabelecimento do usuário
    if premio.estabelecimento_id != current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    return premio


@router.post("/premios", response_model=PremioResponse)
def create_premio(
    premio_data: PremioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cria novo prêmio (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    # Força estabelecimento do usuário
    premio_data.estabelecimento_id = current_user.estabelecimento_id
    return FidelidadeService.create_premio(db, premio_data)


@router.put("/premios/{premio_id}", response_model=PremioResponse)
def update_premio(
    premio_id: int,
    premio_data: PremioUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Atualiza prêmio (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    # Verifica permissão
    premio = FidelidadeService.get_premio(db, premio_id)
    if not premio or premio.estabelecimento_id != current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    return FidelidadeService.update_premio(db, premio_id, premio_data)


@router.delete("/premios/{premio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_premio(
    premio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Desativa prêmio (Admin/Manager apenas)"""
    check_admin_or_manager(current_user)
    # Verifica permissão
    premio = FidelidadeService.get_premio(db, premio_id)
    if not premio or premio.estabelecimento_id != current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    FidelidadeService.delete_premio(db, premio_id)


# ==================== Resgates ====================

@router.get("/premios-disponiveis/{cliente_id}", response_model=List[PremiosDisponiveisResponse])
def listar_premios_disponiveis(
    cliente_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista prêmios disponíveis para resgate do cliente"""
    return FidelidadeService.listar_premios_disponiveis(
        db,
        cliente_id,
        current_user.estabelecimento_id
    )


@router.post("/resgatar", response_model=ResgatePremioResponse)
def resgatar_premio(
    resgate_data: ResgatePremioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Resgata um prêmio para o cliente"""
    return FidelidadeService.resgatar_premio(db, resgate_data)


@router.get("/resgates/{cliente_id}", response_model=List[ResgatePremioResponse])
def listar_resgates_cliente(
    cliente_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista resgates do cliente"""
    return FidelidadeService.listar_resgates_cliente(db, cliente_id)


@router.patch("/resgates/{resgate_id}/usar", response_model=ResgatePremioResponse)
def usar_resgate(
    resgate_id: int,
    agendamento_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marca resgate como usado em um agendamento"""
    return FidelidadeService.usar_resgate(db, resgate_id, agendamento_id)
