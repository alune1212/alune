from fastapi.routing import APIRoute

from app.main import app


def test_stage6b_internal_system_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert {
        "/api/v1/users",
        "/api/v1/users/{user_id}",
        "/api/v1/roles/{role_id}/permissions",
        "/api/v1/departments/{department_id}",
        "/api/v1/audit/operation-logs",
        "/api/v1/audit/login-logs",
        "/api/v1/dictionaries/types",
        "/api/v1/dictionaries/items",
        "/api/v1/files",
    }.issubset(route_paths)
