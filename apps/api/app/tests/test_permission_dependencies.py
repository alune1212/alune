import pytest
from fastapi import HTTPException

from app.modules.permissions.dependencies import ensure_permission_code


def test_ensure_permission_code_allows_existing_permission() -> None:
    ensure_permission_code({"menu:dashboard", "action:dashboard:read"}, "menu:dashboard")


def test_ensure_permission_code_rejects_missing_permission() -> None:
    with pytest.raises(HTTPException) as exc_info:
        ensure_permission_code({"menu:dashboard"}, "menu:permissions")

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Permission denied"
