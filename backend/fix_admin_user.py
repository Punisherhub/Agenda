"""Script para corrigir o estabelecimento_id do admin"""
from app.database import engine
from sqlalchemy import text

def fix_admin():
    with engine.connect() as conn:
        # Ver estabelecimentos disponíveis
        print("\nESTABELECIMENTOS DISPONÍVEIS:")
        print("="*100)
        result = conn.execute(text("""
            SELECT id, nome, empresa_id
            FROM estabelecimentos
            ORDER BY id
        """))

        for row in result:
            print(f"ID: {row.id} | Nome: {row.nome} | Empresa ID: {row.empresa_id}")

        # Atualizar admin para usar estabelecimento 1 (Barbearia Moderna - Centro)
        print("\n" + "="*100)
        print("Atualizando usuário admin...")

        conn.execute(text("""
            UPDATE users
            SET estabelecimento_id = 1
            WHERE email = 'admin@barbeariamoderna.com'
        """))

        conn.commit()

        print("✓ Admin atualizado com sucesso!")

        # Verificar
        result = conn.execute(text("""
            SELECT id, full_name, email, role, estabelecimento_id
            FROM users
            WHERE email = 'admin@barbeariamoderna.com'
        """))

        print("\nDADOS ATUALIZADOS DO ADMIN:")
        for row in result:
            print(f"ID: {row.id}")
            print(f"Nome: {row.full_name}")
            print(f"Email: {row.email}")
            print(f"Role: {row.role}")
            print(f"Estabelecimento ID: {row.estabelecimento_id}")

if __name__ == "__main__":
    fix_admin()
