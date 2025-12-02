"""add_suporte_role

Revision ID: cc82a0b56a14
Revises: 6bf454cefd76
Create Date: 2025-11-30 22:54:11.522229

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc82a0b56a14'
down_revision: Union[str, Sequence[str], None] = '6bf454cefd76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Adicionar novo valor 'suporte' ao enum userrole
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'suporte'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL não permite remover valores de enum facilmente
    # Seria necessário recriar o enum, o que é complexo
    pass
