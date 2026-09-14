from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Rejected outright so a placeholder can never sign a real token.
_FORBIDDEN_SECRETS = {"changeme", "secret", "supersecret", "test", ""}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "DR-XAI Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "production"] = "development"

    # No default: the app must fail loudly at startup rather than silently
    # signing tokens with a guessable key.
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str

    # Comma-separated. Kept as a string because pydantic-settings tries to
    # JSON-parse list-typed fields, which makes "a,b" a startup error.
    FRONTEND_ORIGINS: str = "http://localhost:5173"

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "retina-images"

    # "stub" produces simulated results flagged is_simulated=True.
    MODEL_BACKEND: str = "stub"

    SEED_ADMIN_EMAIL: str = "admin@example.com"
    SEED_ADMIN_PASSWORD: str = ""

    @field_validator("SECRET_KEY")
    @classmethod
    def _reject_weak_secret(cls, v: str) -> str:
        if v.strip().lower() in _FORBIDDEN_SECRETS:
            raise ValueError(
                "SECRET_KEY is a known placeholder value. Generate a real one:\n"
                '  python -c "import secrets; print(secrets.token_urlsafe(64))"'
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters.")
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
