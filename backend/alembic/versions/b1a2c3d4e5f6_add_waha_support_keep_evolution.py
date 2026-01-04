"""add waha support keep evolution

MIGRAÇÃO SEGURA: Adiciona suporte WAHA mantendo Evolution API intacta

O que esta migration faz:
1. Adiciona 3 novos campos para WAHA (todos nullable):
   - waha_url
   - waha_api_key
   - waha_session_name

2. Altera campos Evolution de NOT NULL → nullable:
   - evolution_api_url
   - evolution_api_key
   - evolution_instance_name
   (Permite usar WAHA sem ter Evolution configurado)

3. Cria nova tabela whatsapp_messages para armazenar mensagens via webhook

GARANTIAS DE SEGURANÇA:
✅ NÃO remove nenhum campo existente
✅ NÃO altera dados existentes
✅ NÃO sobrescreve configurações
✅ Rollback disponível (downgrade)

Revision ID: b1a2c3d4e5f6
Revises: a56f52319943
Create Date: 2025-12-23 14:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b1a2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'a56f52319943'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona suporte WAHA mantendo Evolution API intacta.
    TOTALMENTE SEGURO - não perde dados!
    """

    # ========================================
    # PARTE 1: Adicionar campos WAHA (novos)
    # ========================================
    print("[1/3] Adicionando campos WAHA...")

    op.add_column('whatsapp_configs',
        sa.Column('waha_url', sa.String(length=500), nullable=True))

    op.add_column('whatsapp_configs',
        sa.Column('waha_api_key', sa.String(length=500), nullable=True))

    op.add_column('whatsapp_configs',
        sa.Column('waha_session_name', sa.String(length=100), nullable=True))

    print("   -> waha_url, waha_api_key, waha_session_name adicionados!")

    # ========================================
    # PARTE 2: Tornar campos Evolution nullable
    # ========================================
    print("[2/3] Tornando campos Evolution opcionais...")

    # Altera de NOT NULL para nullable (permite usar só WAHA)
    op.alter_column('whatsapp_configs', 'evolution_api_url',
                    existing_type=sa.String(length=500),
                    nullable=True)

    op.alter_column('whatsapp_configs', 'evolution_api_key',
                    existing_type=sa.String(length=500),
                    nullable=True)

    op.alter_column('whatsapp_configs', 'evolution_instance_name',
                    existing_type=sa.String(length=100),
                    nullable=True)

    print("   -> Campos Evolution agora sao opcionais!")

    # ========================================
    # PARTE 3: Criar tabela whatsapp_messages
    # ========================================
    print("[3/3] Criando tabela whatsapp_messages...")

    op.create_table('whatsapp_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.String(length=255), nullable=False),
        sa.Column('session_name', sa.String(length=100), nullable=False),
        sa.Column('from_number', sa.String(length=50), nullable=False),
        sa.Column('to_number', sa.String(length=50), nullable=True),
        sa.Column('from_me', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('has_media', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('media_url', sa.String(length=1000), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('message_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ack_status', sa.String(length=20), nullable=True),
        sa.Column('payload_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('estabelecimento_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['estabelecimento_id'], ['estabelecimentos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Criar índices para performance
    op.create_index(op.f('ix_whatsapp_messages_message_id'), 'whatsapp_messages', ['message_id'], unique=False)
    op.create_index(op.f('ix_whatsapp_messages_from_number'), 'whatsapp_messages', ['from_number'], unique=False)

    print("   -> Tabela whatsapp_messages criada com sucesso!")
    print("\nMigration concluida com SUCESSO!")
    print("   -> Dados existentes preservados")
    print("   -> Evolution API ainda funciona")
    print("   -> WAHA disponivel para uso")


def downgrade() -> None:
    """
    Reverte as mudanças (remove suporte WAHA, restaura Evolution como obrigatório).

    ATENCAO: Se você ja configurou WAHA, esses dados serao perdidos!
    """

    print("Revertendo migration (downgrade)...")

    # Remove tabela de mensagens
    print("   [1/3] Removendo tabela whatsapp_messages...")
    op.drop_index(op.f('ix_whatsapp_messages_from_number'), table_name='whatsapp_messages')
    op.drop_index(op.f('ix_whatsapp_messages_message_id'), table_name='whatsapp_messages')
    op.drop_table('whatsapp_messages')

    # Torna Evolution campos obrigatórios novamente
    print("   [2/3] Tornando campos Evolution obrigatórios...")
    op.alter_column('whatsapp_configs', 'evolution_instance_name',
                    existing_type=sa.String(length=100),
                    nullable=False)
    op.alter_column('whatsapp_configs', 'evolution_api_key',
                    existing_type=sa.String(length=500),
                    nullable=False)
    op.alter_column('whatsapp_configs', 'evolution_api_url',
                    existing_type=sa.String(length=500),
                    nullable=False)

    # Remove campos WAHA
    print("   [3/3] Removendo campos WAHA...")
    op.drop_column('whatsapp_configs', 'waha_session_name')
    op.drop_column('whatsapp_configs', 'waha_api_key')
    op.drop_column('whatsapp_configs', 'waha_url')

    print("Downgrade concluido!")
