from fastapi.routing import APIRoute

from app.main import app


def test_stage6c_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert {
        "/api/v1/users/{user_id}/roles",
        "/api/v1/departments/tree",
        "/api/v1/files/upload",
        "/api/v1/files/{file_id}/download",
    }.issubset(route_paths)
