from app.database import engine
import sqlalchemy as sa

inspector = sa.inspect(engine)
tables = inspector.get_table_names()

print('=== Tabelas do Sistema de Fidelidade ===\n')

fidelidade_tables = {
    'configuracao_fidelidade': 'Configuração de pontos por estabelecimento',
    'premios': 'Catálogo de prêmios',
    'resgates_premios': 'Histórico de resgates de prêmios',
    'clientes': 'Clientes (com coluna pontos)'
}

for table, desc in fidelidade_tables.items():
    exists = table in tables
    status = '[OK]' if exists else '[FALTA]'
    print(f'{status} {table}')
    print(f'     {desc}')

    if exists:
        cols = [col["name"] for col in inspector.get_columns(table)]
        print(f'     Colunas: {len(cols)} encontradas')

        # Mostrar colunas específicas importantes
        if table == 'clientes' and 'pontos' in cols:
            print('     ✓ Campo pontos existe!')
        elif table == 'configuracao_fidelidade' and 'reais_por_ponto' in cols:
            print('     ✓ Campo reais_por_ponto existe!')
        elif table == 'premios' and 'pontos_necessarios' in cols:
            print('     ✓ Campo pontos_necessarios existe!')
        elif table == 'resgates_premios' and 'pontos_utilizados' in cols:
            print('     ✓ Campo pontos_utilizados existe!')
    print()

print('\n=== Resumo ===')
total = len(fidelidade_tables)
criadas = sum(1 for t in fidelidade_tables if t in tables)
print(f'{criadas}/{total} tabelas criadas com sucesso!')

if criadas == total:
    print('\n✓ Sistema de fidelidade 100% instalado no banco de dados!')
