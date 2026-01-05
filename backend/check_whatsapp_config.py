"""
Script para verificar configuracao WhatsApp
"""
from app.database import SessionLocal
from app.models.whatsapp_config import WhatsAppConfig

db = SessionLocal()

configs = db.query(WhatsAppConfig).all()

print("\n" + "="*80)
print("CONFIGURACOES WHATSAPP")
print("="*80)

if not configs:
    print("NENHUMA CONFIGURACAO ENCONTRADA!")
else:
    for config in configs:
        print(f"\nEstabelecimento ID: {config.estabelecimento_id}")
        print(f"WAHA URL: {config.waha_url}")
        print(f"Session: {config.waha_session_name}")
        print(f"\nFLAGS DE CONTROLE:")
        print(f"  ativado: {config.ativado} {'OK' if config.ativado else 'DESATIVADO!'}")
        print(f"  enviar_agendamento: {config.enviar_agendamento}")
        print(f"  enviar_lembrete: {config.enviar_lembrete}")
        print(f"  enviar_conclusao: {config.enviar_conclusao}")
        print(f"  enviar_cancelamento: {config.enviar_cancelamento}")
        print(f"  enviar_reciclagem: {config.enviar_reciclagem}")
        print(f"\nTEMPLATES:")
        print(f"  Agendamento: {'Configurado' if config.template_agendamento else 'NAO configurado'}")
        print(f"  Lembrete: {'Configurado' if config.template_lembrete else 'NAO configurado'}")
        print(f"  Conclusao: {'Configurado' if config.template_conclusao else 'NAO configurado'}")
        print(f"  Cancelamento: {'Configurado' if config.template_cancelamento else 'NAO configurado'}")
        print(f"  Reciclagem: {'Configurado' if config.template_reciclagem else 'NAO configurado'}")

print("\n" + "="*80)

db.close()
