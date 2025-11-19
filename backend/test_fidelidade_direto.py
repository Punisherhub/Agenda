"""
Teste direto do sistema de fidelidade
Execute: python test_fidelidade_direto.py
"""
from app.database import SessionLocal
from app.services.fidelidade_service import FidelidadeService
from app.models.agendamento import Agendamento

# ID do agendamento que você acabou de concluir
AGENDAMENTO_ID = 48

db = SessionLocal()

try:
    print("=" * 50)
    print("TESTE DIRETO - SISTEMA DE FIDELIDADE")
    print("=" * 50)

    # Buscar agendamento
    agendamento = db.query(Agendamento).filter(Agendamento.id == AGENDAMENTO_ID).first()

    if not agendamento:
        print(f"[ERRO] Agendamento {AGENDAMENTO_ID} nao encontrado!")
    else:
        print(f"\n[OK] Agendamento encontrado:")
        print(f"   ID: {agendamento.id}")
        print(f"   Status: {agendamento.status}")
        print(f"   Cliente ID: {agendamento.cliente_id}")
        print(f"   Estabelecimento ID: {agendamento.estabelecimento_id}")
        print(f"   Valor Final: R$ {agendamento.valor_final}")

        print(f"\n[PROCESSANDO] Pontos de fidelidade...")
        pontos = FidelidadeService.processar_pontos_agendamento(db, AGENDAMENTO_ID)

        print(f"\n[RESULTADO] Pontos calculados e adicionados: {pontos}")

        # Verificar pontos do cliente
        from app.models.cliente import Cliente
        cliente = db.query(Cliente).filter(Cliente.id == agendamento.cliente_id).first()
        if cliente:
            print(f"   Pontos totais do cliente: {cliente.pontos}")

finally:
    db.close()
