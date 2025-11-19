"""Add custom service fields to agendamentos

Revision ID: eb57314e75ae
Revises: e1dd44e3116d
Create Date: 2025-10-20 14:13:44.671136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'eb57314e75ae'
down_revision: Union[str, Sequence[str], None] = 'e1dd44e3116d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Adicionar campos para serviço personalizado
    op.add_column('agendamentos', sa.Column('servico_personalizado', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('agendamentos', sa.Column('servico_personalizado_nome', sa.String(length=255), nullable=True))
    op.add_column('agendamentos', sa.Column('servico_personalizado_descricao', sa.Text(), nullable=True))

    # Tornar servico_id nullable para permitir serviços personalizados
    op.alter_column('agendamentos', 'servico_id',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Reverter alterações
    op.alter_column('agendamentos', 'servico_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('agendamentos', 'servico_personalizado_descricao')
    op.drop_column('agendamentos', 'servico_personalizado_nome')
    op.drop_column('agendamentos', 'servico_personalizado')
