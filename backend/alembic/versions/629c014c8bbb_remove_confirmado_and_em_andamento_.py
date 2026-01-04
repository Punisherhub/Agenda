"""remove_confirmado_and_em_andamento_status

Revision ID: 629c014c8bbb
Revises: b1a2c3d4e5f6
Create Date: 2026-01-04 08:32:48.264369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '629c014c8bbb'
down_revision: Union[str, Sequence[str], None] = 'b1a2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # PRIMEIRO: Migrar registros existentes
    # CONFIRMADO → CONCLUIDO (decisão do usuário: já foram atendidos)
    op.execute("UPDATE agendamentos SET status = 'CONCLUIDO' WHERE status = 'CONFIRMADO'")

    # EM_ANDAMENTO → AGENDADO (se existirem, converter para agendado)
    op.execute("UPDATE agendamentos SET status = 'AGENDADO' WHERE status = 'EM_ANDAMENTO'")

    # PostgreSQL: Remover valores CONFIRMADO e EM_ANDAMENTO do enum
    op.execute("ALTER TYPE statusagendamento RENAME TO statusagendamento_old")
    op.execute("CREATE TYPE statusagendamento AS ENUM ('AGENDADO', 'CONCLUIDO', 'CANCELADO', 'NAO_COMPARECEU')")
    op.execute("ALTER TABLE agendamentos ALTER COLUMN status TYPE statusagendamento USING status::text::statusagendamento")
    op.execute("DROP TYPE statusagendamento_old")

    # Renomear campos WhatsApp config
    op.execute("ALTER TABLE whatsapp_configs RENAME COLUMN template_confirmacao TO template_conclusao")
    op.execute("ALTER TABLE whatsapp_configs RENAME COLUMN enviar_confirmacao TO enviar_conclusao")


def downgrade() -> None:
    """Downgrade schema."""
    # Reverter nomes dos campos WhatsApp
    op.execute("ALTER TABLE whatsapp_configs RENAME COLUMN template_conclusao TO template_confirmacao")
    op.execute("ALTER TABLE whatsapp_configs RENAME COLUMN enviar_conclusao TO enviar_confirmacao")

    # Recriar enum com CONFIRMADO e EM_ANDAMENTO
    op.execute("ALTER TYPE statusagendamento RENAME TO statusagendamento_old")
    op.execute("CREATE TYPE statusagendamento AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'NAO_COMPARECEU')")
    op.execute("ALTER TABLE agendamentos ALTER COLUMN status TYPE statusagendamento USING status::text::statusagendamento")
    op.execute("DROP TYPE statusagendamento_old")

    # Nota: Não é possível reverter automaticamente os status migrados
    # Os registros que eram CONFIRMADO e foram migrados para CONCLUIDO permanecerão como CONCLUIDO
    # Os registros que eram EM_ANDAMENTO e foram migrados para AGENDADO permanecerão como AGENDADO
