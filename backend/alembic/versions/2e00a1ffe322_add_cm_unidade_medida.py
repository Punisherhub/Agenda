"""add_cm_unidade_medida

Revision ID: 2e00a1ffe322
Revises: cc82a0b56a14
Create Date: 2025-12-01 15:25:27.333031

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2e00a1ffe322'
down_revision: Union[str, Sequence[str], None] = 'cc82a0b56a14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add CM to UnidadeMedida enum."""
    # PostgreSQL requires using ALTER TYPE to add new enum values
    op.execute("ALTER TYPE unidademedida ADD VALUE IF NOT EXISTS 'CM'")


def downgrade() -> None:
    """Downgrade schema - Cannot remove enum values in PostgreSQL."""
    # PostgreSQL does not support removing enum values
    # This would require recreating the type and all dependent columns
    pass
