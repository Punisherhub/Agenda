from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database - Usa variável de ambiente ou valor padrão
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://sasconv_user:d5DezoH9fkvGQvAldNebbIAU0FWcm4Fe@dpg-d2195c6uk2gs7380vemg-a.virginia-postgres.render.com:5432/agenda_db?sslmode=require"
    )

    # Secret key - IMPORTANTE: Definir via variável de ambiente em produção
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")

    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"

    # Debug - False em produção
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Timezone do Brasil (Horário de Brasília)
    timezone: str = "America/Sao_Paulo"

    # CORS Origins - Permite configurar via variável de ambiente
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = ".env"


settings = Settings()