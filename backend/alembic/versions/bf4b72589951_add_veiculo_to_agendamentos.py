"""add_veiculo_to_agendamentos

Revision ID: bf4b72589951
Revises: 629c014c8bbb
Create Date: 2026-01-04 22:19:26.570885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf4b72589951'
down_revision: Union[str, Sequence[str], None] = '629c014c8bbb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adiciona coluna veiculo (modelo + placa) à tabela agendamentos."""
    op.add_column('agendamentos', sa.Column('veiculo', sa.String(200), nullable=True))


def downgrade() -> None:
    """Remove coluna veiculo da tabela agendamentos."""
    op.drop_column('agendamentos', 'veiculo')
