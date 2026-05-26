import json
from functools import lru_cache
from typing import Annotated, Any, Literal
from urllib.parse import unquote, urlsplit

from pydantic import Field, field_validator, model_validator
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
    postgres_password: str | None = None
    redis_url: str = "redis://localhost:6379/0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"],
    )
    jwt_secret_key: str = "please-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    first_superuser_username: str = "admin"
    first_superuser_email: str = "admin@example.com"
    first_superuser_password: str | None = None
    file_storage_backend: str = "local"
    upload_scanner_enabled: bool = False
    upload_scanner_backend: str = "clamav"
    clamav_host: str = "localhost"
    clamav_port: int = 3310
    clamav_timeout_seconds: float = 10.0
    local_file_storage_dir: str = ".local/uploads"
    minio_endpoint: str | None = None
    minio_access_key: str | None = None
    minio_secret_key: str | None = None
    minio_bucket: str | None = None
    minio_secure: bool = True
    max_upload_size_bytes: int = 10 * 1024 * 1024
    allowed_upload_content_types: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
    )

    environment: Literal["development", "staging", "production"] = "development"

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        return cls._parse_string_list(value, "API_CORS_ORIGINS")

    @field_validator("allowed_upload_content_types", mode="before")
    @classmethod
    def parse_allowed_upload_content_types(cls, value: object) -> list[str]:
        return cls._parse_string_list(value, "ALLOWED_UPLOAD_CONTENT_TYPES")

    @classmethod
    def _parse_string_list(cls, value: Any, name: str) -> list[str]:
        if isinstance(value, list):
            return value
        if not isinstance(value, str):
            msg = f"{name} must be a comma-separated string or list"
            raise ValueError(msg)
        raw_value = value.strip()
        if not raw_value.startswith("["):
            return [origin.strip() for origin in raw_value.split(",") if origin.strip()]
        parsed_value = json.loads(raw_value)
        if not isinstance(parsed_value, list):
            msg = f"{name} JSON value must be a list"
            raise ValueError(msg)
        return [str(origin).strip() for origin in parsed_value if str(origin).strip()]

    @model_validator(mode="after")
    def validate_production_security(self) -> Settings:
        if self.environment != "production":
            return self

        failures: list[str] = []

        if self.jwt_secret_key == "please-change-me":
            failures.append("JWT_SECRET_KEY must not use the default value in production")
        if len(self.jwt_secret_key) < 32:
            failures.append("JWT_SECRET_KEY must be at least 32 characters in production")

        database_password = urlsplit(self.database_url).password
        if self.postgres_password == "app" or (
            database_password is not None and unquote(database_password) == "app"
        ):
            failures.append("POSTGRES_PASSWORD must not use the default value 'app' in production")

        if self.minio_secret_key == "minioadmin":
            failures.append(
                "MINIO_SECRET_KEY must not use the default value 'minioadmin' in production"
            )

        if failures:
            raise ValueError("Production security check failed:\n- " + "\n- ".join(failures))

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
