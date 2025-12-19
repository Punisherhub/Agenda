"""migrate from meta api to evolution api

Revision ID: a56f52319943
Revises: f9c6017116f8
Create Date: 2025-12-18 23:01:49.686274

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a56f52319943'
down_revision: Union[str, Sequence[str], None] = 'f9c6017116f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Migra de Meta WhatsApp Business API para Evolution API."""

    # Adicionar novas colunas da Evolution API (temporariamente nullable)
    op.add_column('whatsapp_configs', sa.Column('evolution_api_url', sa.String(length=500), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('evolution_api_key', sa.String(length=500), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('evolution_instance_name', sa.String(length=100), nullable=True))

    # Remover colunas antigas da Meta API
    op.drop_column('whatsapp_configs', 'meta_template_reciclagem')
    op.drop_column('whatsapp_configs', 'meta_template_cancelamento')
    op.drop_column('whatsapp_configs', 'meta_template_confirmacao')
    op.drop_column('whatsapp_configs', 'meta_template_lembrete')
    op.drop_column('whatsapp_configs', 'meta_template_agendamento')
    op.drop_column('whatsapp_configs', 'telefone_id')
    op.drop_column('whatsapp_configs', 'meta_token')

    # Nota: Em produção, você deve:
    # 1. Fazer backup dos dados antes de executar
    # 2. Preencher os novos campos (evolution_*) manualmente ou via script
    # 3. Depois alterar nullable=False se necessário


def downgrade() -> None:
    """Reverte para Meta WhatsApp Business API (não recomendado)."""

    # Adicionar colunas antigas da Meta API de volta
    op.add_column('whatsapp_configs', sa.Column('meta_token', sa.String(length=500), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('telefone_id', sa.String(length=100), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('meta_template_agendamento', sa.String(length=255), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('meta_template_lembrete', sa.String(length=255), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('meta_template_confirmacao', sa.String(length=255), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('meta_template_cancelamento', sa.String(length=255), nullable=True))
    op.add_column('whatsapp_configs', sa.Column('meta_template_reciclagem', sa.String(length=255), nullable=True))

    # Remover colunas da Evolution API
    op.drop_column('whatsapp_configs', 'evolution_instance_name')
    op.drop_column('whatsapp_configs', 'evolution_api_key')
    op.drop_column('whatsapp_configs', 'evolution_api_url')
