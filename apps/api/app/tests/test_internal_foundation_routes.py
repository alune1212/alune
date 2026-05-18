from fastapi.routing import APIRoute

from app.main import app


def test_internal_system_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert "/api/v1/users" in route_paths
    assert "/api/v1/roles" in route_paths
    assert "/api/v1/departments" in route_paths
