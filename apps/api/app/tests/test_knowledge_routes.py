from fastapi.routing import APIRoute

from app.main import app


def test_knowledge_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert "/api/v1/knowledge-bases" in route_paths
    assert "/api/v1/knowledge-bases/{knowledge_base_id}/documents/upload" in route_paths
    assert "/api/v1/knowledge-documents/{document_id}/index" in route_paths
    assert "/api/v1/rag/ask" in route_paths
