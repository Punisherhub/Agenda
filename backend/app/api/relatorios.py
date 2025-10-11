from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta

from app.database import get_db
from app.utils.auth import get_current_active_user
from app.models.user import User
from app.schemas.relatorio import DashboardRelatorios
from app.services.relatorio_service import RelatorioService

router = APIRouter()


def check_user_has_estabelecimento(current_user: User):
    """Verificar se usuário está vinculado a um estabelecimento."""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )


@router.get("/dashboard", response_model=DashboardRelatorios)
async def get_dashboard_relatorios(
    data_inicio: date = Query(default=None, description="Data início (padrão: 30 dias atrás)"),
    data_fim: date = Query(default=None, description="Data fim (padrão: hoje)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retorna dashboard completo de relatórios financeiros.

    Inclui:
    - Resumo financeiro do período
    - Estoque de materiais
    - Lucro por serviço
    - Consumo de materiais
    - Receita diária
    """
    check_user_has_estabelecimento(current_user)

    # Definir período padrão (últimos 30 dias)
    if not data_fim:
        data_fim = date.today()

    if not data_inicio:
        data_inicio = data_fim - timedelta(days=30)

    dashboard = RelatorioService.get_dashboard_completo(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        data_inicio=data_inicio,
        data_fim=data_fim
    )

    return dashboard
