from fastapi.routing import APIRoute

from app.main import app


def test_stage6d_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert {
        "/api/v1/users/{user_id}/password",
        "/api/v1/dictionaries/items/{item_id}",
    }.issubset(route_paths)
