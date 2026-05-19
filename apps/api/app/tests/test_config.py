from app.core.config import Settings


def test_settings_parse_cors_origins_from_comma_separated_env(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:15173",
    )

    settings = Settings()

    assert settings.api_cors_origins == ["http://localhost:5173", "http://localhost:15173"]


def test_settings_parse_cors_origins_from_json_env(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_CORS_ORIGINS",
        '["http://localhost:5173", "http://localhost:15173"]',
    )

    settings = Settings()

    assert settings.api_cors_origins == ["http://localhost:5173", "http://localhost:15173"]


def test_settings_read_upload_scanner_env(monkeypatch) -> None:
    monkeypatch.setenv("UPLOAD_SCANNER_ENABLED", "true")
    monkeypatch.setenv("UPLOAD_SCANNER_BACKEND", "clamav")
    monkeypatch.setenv("CLAMAV_HOST", "clamav")
    monkeypatch.setenv("CLAMAV_PORT", "3310")
    monkeypatch.setenv("CLAMAV_TIMEOUT_SECONDS", "5")

    settings = Settings()

    assert settings.upload_scanner_enabled is True
    assert settings.upload_scanner_backend == "clamav"
    assert settings.clamav_host == "clamav"
    assert settings.clamav_port == 3310
    assert settings.clamav_timeout_seconds == 5
