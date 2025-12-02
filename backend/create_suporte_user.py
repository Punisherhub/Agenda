"""
Script para criar usuário de suporte Eduardo
"""
from app.database import SessionLocal, engine
from app.models.user import User, UserRole
from passlib.context import CryptContext
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_suporte_user():
    db = SessionLocal()
    try:
        # Verificar se usuário já existe
        existing_user = db.query(User).filter(User.email == "eduardo@suporte.com").first()
        if existing_user:
            print("Usuario eduardo@suporte.com ja existe!")
            return

        # Hash da senha
        hashed_password = pwd_context.hash("suporte123")

        # Criar usuário usando SQL direto para garantir lowercase no enum
        sql = text("""
            INSERT INTO users (
                email, username, full_name, hashed_password,
                role, is_active, is_verified, timezone, dias_trabalho
            ) VALUES (
                :email, :username, :full_name, :hashed_password,
                :role, :is_active, :is_verified, :timezone, :dias_trabalho
            ) RETURNING id
        """)

        result = db.execute(sql, {
            "email": "eduardo@suporte.com",
            "username": "eduardo",
            "full_name": "Eduardo - Suporte",
            "hashed_password": hashed_password,
            "role": "suporte",  # lowercase direto
            "is_active": True,
            "is_verified": True,
            "timezone": "America/Sao_Paulo",
            "dias_trabalho": "1111100"
        })

        user_id = result.fetchone()[0]
        db.commit()

        print("Usuario de suporte criado com sucesso!")
        print(f"   Email: eduardo@suporte.com")
        print(f"   Username: eduardo")
        print(f"   Role: suporte")
        print(f"   ID: {user_id}")

    except Exception as e:
        print(f"Erro ao criar usuario: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_suporte_user()
