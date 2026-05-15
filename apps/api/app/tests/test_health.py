import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import OperationalError

from app.main import app
from app.modules.health.router import get_db_session


@pytest.mark.asyncio
async def test_health_check_returns_api_status() -> None:
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {"status": "ok", "service": "api"},
        "message": "OK",
        "error": None,
    }


@pytest.mark.asyncio
async def test_database_health_returns_503_when_database_is_unavailable() -> None:
    async def unavailable_session_override():
        class UnavailableSession:
            async def execute(self, _: object) -> None:
                raise OperationalError("SELECT 1", {}, OSError("connection refused"))

        yield UnavailableSession()

    app.dependency_overrides[get_db_session] = unavailable_session_override
    transport = ASGITransport(app=app)

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/health/db")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json() == {"detail": "Database is unavailable"}
