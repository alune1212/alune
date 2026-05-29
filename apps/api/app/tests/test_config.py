import pytest

from app.core.config import Settings


def test_settings_parse_cors_origins_from_comma_separated_env(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:15173",
    )

    settings = Settings(jwt_secret_key="super-secret-key-that-is-long-enough-32chars")

    assert settings.api_cors_origins == ["http://localhost:5173", "http://localhost:15173"]


def test_settings_parse_cors_origins_from_json_env(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_CORS_ORIGINS",
        '["http://localhost:5173", "http://localhost:15173"]',
    )

    settings = Settings(jwt_secret_key="super-secret-key-that-is-long-enough-32chars")

    assert settings.api_cors_origins == ["http://localhost:5173", "http://localhost:15173"]


def test_settings_read_upload_scanner_env(monkeypatch) -> None:
    monkeypatch.setenv("UPLOAD_SCANNER_ENABLED", "true")
    monkeypatch.setenv("UPLOAD_SCANNER_BACKEND", "clamav")
    monkeypatch.setenv("CLAMAV_HOST", "clamav")
    monkeypatch.setenv("CLAMAV_PORT", "3310")
    monkeypatch.setenv("CLAMAV_TIMEOUT_SECONDS", "5")

    settings = Settings(jwt_secret_key="super-secret-key-that-is-long-enough-32chars")

    assert settings.upload_scanner_enabled is True
    assert settings.upload_scanner_backend == "clamav"
    assert settings.clamav_host == "clamav"
    assert settings.clamav_port == 3310
    assert settings.clamav_timeout_seconds == 5


def test_settings_default_environment_is_development(monkeypatch) -> None:
    settings = Settings(jwt_secret_key="super-secret-key-that-is-long-enough-32chars")
    assert settings.environment == "development"


def test_settings_jwt_secret_key_allows_default_value_in_non_production() -> None:
    settings = Settings(jwt_secret_key="please-change-me")
    assert settings.jwt_secret_key == "please-change-me"


def test_settings_jwt_secret_key_allows_short_value_in_non_production() -> None:
    settings = Settings(jwt_secret_key="short")
    assert settings.jwt_secret_key == "short"


def test_settings_jwt_secret_key_accepts_valid_value() -> None:
    settings = Settings(jwt_secret_key="a-very-long-and-random-secret-that-is-safe")
    assert settings.jwt_secret_key == "a-very-long-and-random-secret-that-is-safe"


def test_settings_production_rejects_default_jwt_secret(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        Settings(
            environment="production",
            jwt_secret_key="please-change-me",
        )


def test_settings_production_rejects_default_minio_secret(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    with pytest.raises(ValueError, match="MINIO_SECRET_KEY"):
        Settings(
            environment="production",
            jwt_secret_key="super-secret-key-that-is-long-enough-32chars",
            minio_secret_key="minioadmin",
        )


def test_settings_production_rejects_default_postgres_password(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    with pytest.raises(ValueError, match="POSTGRES_PASSWORD"):
        Settings(
            environment="production",
            jwt_secret_key="super-secret-key-that-is-long-enough-32chars",
            database_url="postgresql+asyncpg://app:app@localhost:5432/company_admin",
        )


def test_settings_production_accepts_secure_config(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    settings = Settings(
        environment="production",
        jwt_secret_key="super-secret-key-that-is-long-enough-32chars",
        database_url="postgresql+asyncpg://app:secure-postgres-password@localhost:5432/company_admin",
        minio_secret_key="a-real-minio-secret",
    )
    assert settings.environment == "production"


def test_settings_rejects_embedding_dimensions_that_do_not_match_schema() -> None:
    with pytest.raises(ValueError, match="AI_EMBEDDING_DIMENSIONS"):
        Settings(
            jwt_secret_key="super-secret-key-that-is-long-enough-32chars",
            ai_embedding_dimensions=1024,
        )
