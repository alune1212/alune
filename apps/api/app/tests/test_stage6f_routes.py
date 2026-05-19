from fastapi.routing import APIRoute

from app.main import app


def test_stage6f_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert "/api/v1/users/bulk-status" in route_paths
