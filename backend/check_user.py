"""Script para verificar dados dos usuários no banco"""
from app.database import SessionLocal
from app.models.user import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()

        print("\n" + "="*80)
        print("USUÁRIOS NO BANCO DE DADOS")
        print("="*80)

        for user in users:
            print(f"\nID: {user.id}")
            print(f"Nome: {user.full_name}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Estabelecimento ID: {user.estabelecimento_id}")
            print(f"Ativo: {user.is_active}")
            print("-" * 80)

    finally:
        db.close()

if __name__ == "__main__":
    check_users()
