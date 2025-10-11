from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://username:password@localhost:5432/agenda_db"
    secret_key: str = "your-secret-key-here"
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()