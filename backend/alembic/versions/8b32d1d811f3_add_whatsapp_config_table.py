"""add whatsapp config table

Revision ID: 8b32d1d811f3
Revises: 69630dff9f56
Create Date: 2025-12-15 19:07:14.531801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8b32d1d811f3'
down_revision: Union[str, Sequence[str], None] = '69630dff9f56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Criar tabela whatsapp_configs
    op.create_table(
        'whatsapp_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meta_token', sa.String(length=500), nullable=False),
        sa.Column('telefone_id', sa.String(length=100), nullable=False),
        sa.Column('template_agendamento', sa.Text(), nullable=True),
        sa.Column('template_lembrete', sa.Text(), nullable=True),
        sa.Column('template_confirmacao', sa.Text(), nullable=True),
        sa.Column('template_cancelamento', sa.Text(), nullable=True),
        sa.Column('template_reciclagem', sa.Text(), nullable=True),
        sa.Column('ativado', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('enviar_agendamento', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('enviar_lembrete', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('enviar_confirmacao', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('enviar_cancelamento', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('enviar_reciclagem', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('estabelecimento_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['estabelecimento_id'], ['estabelecimentos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('estabelecimento_id')
    )
    op.create_index(op.f('ix_whatsapp_configs_id'), 'whatsapp_configs', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Remover tabela whatsapp_configs
    op.drop_index(op.f('ix_whatsapp_configs_id'), table_name='whatsapp_configs')
    op.drop_table('whatsapp_configs')
