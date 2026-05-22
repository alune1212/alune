import pytest
from fastapi.routing import APIRoute
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.auth.security import create_access_token


def test_internal_system_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert "/api/v1/users" in route_paths
    assert "/api/v1/roles" in route_paths
    assert "/api/v1/departments" in route_paths


@pytest.mark.anyio
async def test_delete_nonexistent_department_returns_404() -> None:
    """删除不存在的部门返回 404。"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = create_access_token(subject="admin")
        response = await client.delete(
            "/api/v1/departments/00000000-0000-0000-0000-000000000099",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 404
