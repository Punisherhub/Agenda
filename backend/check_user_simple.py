"""Script simples para verificar usuários"""
from app.database import engine
from sqlalchemy import text

def check_users():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, full_name, email, role, estabelecimento_id, is_active
            FROM users
            ORDER BY id
        """))

        print("\n" + "="*100)
        print("USUÁRIOS NO BANCO DE DADOS")
        print("="*100)

        for row in result:
            print(f"\nID: {row.id}")
            print(f"Nome: {row.full_name}")
            print(f"Email: {row.email}")
            print(f"Role: {row.role}")
            print(f"Estabelecimento ID: {row.estabelecimento_id}")
            print(f"Ativo: {row.is_active}")
            print("-" * 100)

if __name__ == "__main__":
    check_users()
