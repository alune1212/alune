import json
from functools import lru_cache
from typing import Annotated, Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "alune-platform API"
    app_version: str = "0.1.0"
    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/company_admin"
    redis_url: str = "redis://localhost:6379/0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"],
    )
    jwt_secret_key: str = "please-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            raw_value = value.strip()
            if raw_value.startswith("["):
                parsed_value = json.loads(raw_value)
                if not isinstance(parsed_value, list):
                    msg = "API_CORS_ORIGINS JSON value must be a list"
                    raise ValueError(msg)
                return [str(origin).strip() for origin in parsed_value if str(origin).strip()]
            return [origin.strip() for origin in raw_value.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        msg = "API_CORS_ORIGINS must be a comma-separated string or list"
        raise ValueError(msg)


@lru_cache
def get_settings() -> Settings:
    return Settings()
