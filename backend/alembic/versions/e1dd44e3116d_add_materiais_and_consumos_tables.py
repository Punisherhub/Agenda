"""add_materiais_and_consumos_tables

Revision ID: e1dd44e3116d
Revises: 4fc1baf0dd3e
Create Date: 2025-10-10 18:10:19.533374

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1dd44e3116d'
down_revision: Union[str, Sequence[str], None] = '4fc1baf0dd3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Criar tabela de materiais
    op.create_table(
        'materiais',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=255), nullable=False),
        sa.Column('descricao', sa.String(length=500), nullable=True),
        sa.Column('valor_custo', sa.Float(), nullable=False),
        sa.Column('unidade_medida', sa.Enum('ML', 'UNIDADE', 'GRAMA', name='unidademedida'), nullable=False),
        sa.Column('quantidade_estoque', sa.Float(), nullable=False),
        sa.Column('quantidade_minima', sa.Float(), nullable=True),
        sa.Column('marca', sa.String(length=255), nullable=True),
        sa.Column('fornecedor', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('estabelecimento_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['estabelecimento_id'], ['estabelecimentos.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_materiais_id'), 'materiais', ['id'], unique=False)

    # Criar tabela de consumos de materiais
    op.create_table(
        'consumos_materiais',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agendamento_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('quantidade_consumida', sa.Float(), nullable=False),
        sa.Column('valor_custo_unitario', sa.Float(), nullable=False),
        sa.Column('valor_total', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['agendamento_id'], ['agendamentos.id'], ),
        sa.ForeignKeyConstraint(['material_id'], ['materiais.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consumos_materiais_id'), 'consumos_materiais', ['id'], unique=False)

    # Popular dados de exemplo
    # Materiais para Barbearia Moderna (estabelecimento_id=1)
    op.execute("""
        INSERT INTO materiais (nome, descricao, valor_custo, unidade_medida, quantidade_estoque, quantidade_minima, marca, fornecedor, is_active, estabelecimento_id)
        VALUES
        ('Shampoo Profissional', 'Shampoo para cabelos oleosos', 2.50, 'ML', 5000.0, 1000.0, 'Loreal Professional', 'Distribuidora ABC', true, 1),
        ('Condicionador', 'Condicionador hidratante', 3.00, 'ML', 4500.0, 1000.0, 'Loreal Professional', 'Distribuidora ABC', true, 1),
        ('Pomada Modeladora', 'Pomada para finalização', 0.80, 'GRAMA', 2000.0, 500.0, 'American Crew', 'Distribuidora XYZ', true, 1),
        ('Cera Modeladora', 'Cera fixação forte', 0.90, 'GRAMA', 1500.0, 500.0, 'Layrite', 'Distribuidora XYZ', true, 1),
        ('Espuma de Barbear', 'Espuma para barbear tradicional', 1.20, 'ML', 3000.0, 800.0, 'Proraso', 'Distribuidora ABC', true, 1),
        ('Óleo para Barba', 'Óleo hidratante para barba', 2.00, 'ML', 1000.0, 200.0, 'Barba Forte', 'Distribuidora XYZ', true, 1),
        ('Creme de Massagem', 'Creme para massagem facial', 1.50, 'GRAMA', 2500.0, 500.0, 'Nivea Men', 'Distribuidora ABC', true, 1),
        ('Toalha Descartável', 'Toalha para uso único', 0.50, 'UNIDADE', 500.0, 100.0, 'Generic', 'Distribuidora ABC', true, 1),
        ('Algodão', 'Algodão para limpeza', 0.10, 'UNIDADE', 1000.0, 200.0, 'Cremer', 'Distribuidora ABC', true, 1),
        ('Álcool 70%', 'Álcool para esterilização', 0.50, 'ML', 5000.0, 1000.0, 'Generic', 'Distribuidora ABC', true, 1);
    """)

    # Materiais para Mecânica Silva (estabelecimento_id=2)
    op.execute("""
        INSERT INTO materiais (nome, descricao, valor_custo, unidade_medida, quantidade_estoque, quantidade_minima, marca, fornecedor, is_active, estabelecimento_id)
        VALUES
        ('Óleo de Motor 5W30', 'Óleo sintético para motor', 25.00, 'ML', 20000.0, 5000.0, 'Mobil', 'AutoPeças BR', true, 2),
        ('Filtro de Óleo', 'Filtro de óleo universal', 15.00, 'UNIDADE', 50.0, 10.0, 'Mann', 'AutoPeças BR', true, 2),
        ('Filtro de Ar', 'Filtro de ar universal', 20.00, 'UNIDADE', 40.0, 10.0, 'Mann', 'AutoPeças BR', true, 2),
        ('Fluido de Freio', 'Fluido DOT 4', 18.00, 'ML', 5000.0, 1000.0, 'Bosch', 'AutoPeças BR', true, 2),
        ('Graxa Multiuso', 'Graxa para chassis', 3.00, 'GRAMA', 10000.0, 2000.0, 'Wurth', 'AutoPeças BR', true, 2);
    """)

    # Materiais para Pet Care Center (estabelecimento_id=3)
    op.execute("""
        INSERT INTO materiais (nome, descricao, valor_custo, unidade_medida, quantidade_estoque, quantidade_minima, marca, fornecedor, is_active, estabelecimento_id)
        VALUES
        ('Shampoo Pet', 'Shampoo hipoalergênico para cães', 3.50, 'ML', 8000.0, 2000.0, 'Pet Society', 'PetShop Distribuidor', true, 3),
        ('Condicionador Pet', 'Condicionador desembaraçante', 4.00, 'ML', 6000.0, 1500.0, 'Pet Society', 'PetShop Distribuidor', true, 3),
        ('Perfume Pet', 'Perfume suave para pets', 2.50, 'ML', 2000.0, 500.0, 'Plush Puppy', 'PetShop Distribuidor', true, 3),
        ('Talco Pet', 'Talco antipulgas', 1.50, 'GRAMA', 3000.0, 800.0, 'Vetnil', 'PetShop Distribuidor', true, 3),
        ('Toalha Microfibra', 'Toalha para secagem', 8.00, 'UNIDADE', 30.0, 10.0, 'Generic', 'PetShop Distribuidor', true, 3);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_consumos_materiais_id'), table_name='consumos_materiais')
    op.drop_table('consumos_materiais')
    op.drop_index(op.f('ix_materiais_id'), table_name='materiais')
    op.drop_table('materiais')
    op.execute('DROP TYPE unidademedida')
