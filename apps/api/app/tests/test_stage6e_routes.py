from fastapi.routing import APIRoute

from app.main import app


def test_stage6e_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert {
        "/api/v1/roles",
        "/api/v1/roles/{role_id}",
        "/api/v1/dictionaries/types/{type_id}",
        "/api/v1/audit/operation-logs/export",
        "/api/v1/audit/login-logs/export",
    }.issubset(route_paths)
