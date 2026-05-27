from typing import cast

import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.modules.apps.models import PlatformApp
from app.modules.apps.schemas import PlatformAppCreate
from app.modules.auth.models import User
from app.modules.permissions import dependencies
from app.modules.permissions.dependencies import require_permission
from app.modules.permissions.registry import DEFAULT_PERMISSIONS


def test_apps_routes_are_mounted() -> None:
    route_paths = {route.path for route in app.routes if isinstance(route, APIRoute)}

    assert {
        "/api/v1/apps",
        "/api/v1/apps/{app_id}",
        "/api/v1/apps/{app_id}/status",
    }.issubset(route_paths)


def test_platform_app_model_uses_platform_apps_table() -> None:
    assert PlatformApp.__tablename__ == "platform_apps"


def test_platform_app_schema_validates_entry_url_by_type() -> None:
    internal_app = PlatformAppCreate(
        code="notes",
        name="Notes",
        category_code="tool",
        entry_type="internal",
        entry_url="/notes",
    )
    external_app = PlatformAppCreate(
        code="docs",
        name="Docs",
        category_code="resource",
        entry_type="external",
        entry_url="https://example.com/docs",
    )

    assert internal_app.entry_url == "/notes"
    assert external_app.entry_url == "https://example.com/docs"

    with pytest.raises(ValidationError):
        PlatformAppCreate(
            code="invalid-internal",
            name="Invalid",
            category_code="tool",
            entry_type="internal",
            entry_url="https://example.com/not-internal",
        )

    with pytest.raises(ValidationError):
        PlatformAppCreate(
            code="invalid-external",
            name="Invalid",
            category_code="tool",
            entry_type="external",
            entry_url="ftp://example.com/not-allowed",
        )


def test_app_center_permissions_are_registered() -> None:
    permission_codes = {permission.code for permission in DEFAULT_PERMISSIONS}

    assert {
        "menu:apps",
        "action:apps:read",
        "action:apps:create",
        "action:apps:update",
        "action:apps:manage_status",
    }.issubset(permission_codes)


@pytest.mark.asyncio
async def test_app_permission_dependency_rejects_missing_actions(monkeypatch) -> None:
    async def fake_list_permission_codes_for_user(session, current_user):
        return ["action:apps:read"]

    monkeypatch.setattr(
        dependencies,
        "list_permission_codes_for_user",
        fake_list_permission_codes_for_user,
    )
    user = User(
        username="reader",
        email="reader@example.com",
        hashed_password="hash",
        is_active=True,
        is_superuser=False,
    )

    read_dependency = require_permission("action:apps:read")
    create_dependency = require_permission("action:apps:create")

    assert await read_dependency(user, cast(AsyncSession, None)) is user
    with pytest.raises(HTTPException) as exc_info:
        await create_dependency(user, cast(AsyncSession, None))

    assert exc_info.value.status_code == 403
