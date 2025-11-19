"""add_pontos_to_clientes

Revision ID: ff77f1a3d468
Revises: eb57314e75ae
Create Date: 2025-11-15 13:00:50.350450

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff77f1a3d468'
down_revision: Union[str, Sequence[str], None] = 'eb57314e75ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Adicionar campo pontos na tabela clientes
    op.add_column('clientes', sa.Column('pontos', sa.Integer(), nullable=False, server_default='0'))

    # Criar tabela de configuração de fidelidade
    op.create_table('configuracao_fidelidade',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reais_por_ponto', sa.Numeric(precision=10, scale=2), nullable=False, comment='Valor em reais para ganhar 1 ponto'),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('estabelecimento_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['estabelecimento_id'], ['estabelecimentos.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_configuracao_fidelidade_estabelecimento_id'), 'configuracao_fidelidade', ['estabelecimento_id'], unique=False)

    # Criar tabela de prêmios
    op.create_table('premios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=100), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('pontos_necessarios', sa.Integer(), nullable=False),
        sa.Column('tipo_premio', sa.String(length=50), nullable=False, comment='DESCONTO_PERCENTUAL, DESCONTO_FIXO, SERVICO_GRATIS, PRODUTO'),
        sa.Column('valor_desconto', sa.Numeric(precision=10, scale=2), nullable=True, comment='Valor do desconto (% ou R$)'),
        sa.Column('servico_id', sa.Integer(), nullable=True, comment='Serviço gratuito (se aplicável)'),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('estabelecimento_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['estabelecimento_id'], ['estabelecimentos.id'], ),
        sa.ForeignKeyConstraint(['servico_id'], ['servicos.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_premios_estabelecimento_id'), 'premios', ['estabelecimento_id'], unique=False)

    # Criar tabela de resgates de prêmios
    op.create_table('resgates_premios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.Column('premio_id', sa.Integer(), nullable=False),
        sa.Column('pontos_utilizados', sa.Integer(), nullable=False),
        sa.Column('data_resgate', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('usado_em_agendamento_id', sa.Integer(), nullable=True, comment='Agendamento onde o prêmio foi usado'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='DISPONIVEL', comment='DISPONIVEL, USADO, EXPIRADO'),
        sa.Column('data_expiracao', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['premio_id'], ['premios.id'], ),
        sa.ForeignKeyConstraint(['usado_em_agendamento_id'], ['agendamentos.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resgates_premios_cliente_id'), 'resgates_premios', ['cliente_id'], unique=False)
    op.create_index(op.f('ix_resgates_premios_status'), 'resgates_premios', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Remover tabelas
    op.drop_index(op.f('ix_resgates_premios_status'), table_name='resgates_premios')
    op.drop_index(op.f('ix_resgates_premios_cliente_id'), table_name='resgates_premios')
    op.drop_table('resgates_premios')
    op.drop_index(op.f('ix_premios_estabelecimento_id'), table_name='premios')
    op.drop_table('premios')
    op.drop_index(op.f('ix_configuracao_fidelidade_estabelecimento_id'), table_name='configuracao_fidelidade')
    op.drop_table('configuracao_fidelidade')

    # Remover campo pontos
    op.drop_column('clientes', 'pontos')
