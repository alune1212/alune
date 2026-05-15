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
