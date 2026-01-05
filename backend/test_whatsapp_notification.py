"""
Script para testar envio automático de notificações WhatsApp
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.database import SessionLocal
from app.models import User, Cliente, Servico
from app.services.agendamento_service import AgendamentoService
from app.schemas.agendamento import AgendamentoCreate

BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")

db = SessionLocal()

print("\n" + "="*80)
print("TESTE DE NOTIFICACAO WHATSAPP AUTOMATICA")
print("="*80)

# 1. Buscar qualquer usuário ativo do estabelecimento 1
user = db.query(User).filter(
    User.estabelecimento_id == 1,
    User.is_active == True
).first()

if not user:
    print("ERRO: Nenhum usuario encontrado!")
    db.close()
    exit(1)

print(f"\nUsuario: {user.full_name} ({user.email})")
print(f"Estabelecimento ID: {user.estabelecimento_id}")

# 2. Buscar um cliente qualquer
cliente = db.query(Cliente).filter(
    Cliente.estabelecimento_id == user.estabelecimento_id,
    Cliente.is_active == True
).first()

if not cliente:
    print("ERRO: Nenhum cliente encontrado!")
    db.close()
    exit(1)

print(f"Cliente: {cliente.nome} ({cliente.telefone})")

# 3. Buscar um serviço qualquer
servico = db.query(Servico).filter(
    Servico.estabelecimento_id == user.estabelecimento_id,
    Servico.is_active == True
).first()

if not servico:
    print("ERRO: Nenhum servico encontrado!")
    db.close()
    exit(1)

print(f"Servico: {servico.nome} (R$ {servico.preco})")

# 4. Criar agendamento para AMANHÃ 10:00
data_inicio = datetime.now(BRAZIL_TZ).replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)

print(f"\nCriando agendamento para: {data_inicio.strftime('%d/%m/%Y %H:%M')}")

agendamento_data = AgendamentoCreate(
    data_inicio=data_inicio,
    cliente_id=cliente.id,
    servico_id=servico.id,
    observacoes="TESTE - Agendamento criado via script de teste"
)

print("\nChamando AgendamentoService.create_agendamento()...")
print("Verifique os logs do backend para mensagens de WhatsApp!")
print("-" * 80)

try:
    agendamento = AgendamentoService.create_agendamento(
        db=db,
        agendamento_data=agendamento_data,
        current_user=user
    )

    print(f"\nSUCESSO! Agendamento criado - ID: {agendamento.id}")
    print(f"Status: {agendamento.status}")
    print(f"\nVERIFIQUE O WHATSAPP DO CLIENTE: {cliente.telefone}")
    print(f"Deve ter recebido mensagem de confirmacao de agendamento!")

except Exception as e:
    print(f"\nERRO ao criar agendamento: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*80)

db.close()
