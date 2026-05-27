from typing import cast

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.permissions import dependencies
from app.modules.permissions.dependencies import ensure_manage_superuser, ensure_permission_code
from app.modules.permissions.registry import PERMISSION_MANAGE_SUPERUSER


def test_ensure_permission_code_allows_existing_permission() -> None:
    ensure_permission_code({"menu:dashboard", "action:dashboard:read"}, "menu:dashboard")


def test_ensure_permission_code_rejects_missing_permission() -> None:
    with pytest.raises(HTTPException) as exc_info:
        ensure_permission_code({"menu:dashboard"}, "menu:permissions")

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "权限不足"


@pytest.mark.asyncio
async def test_ensure_manage_superuser_allows_superuser() -> None:
    user = User(
        username="root",
        email="root@example.com",
        hashed_password="hash",
        is_superuser=True,
    )

    await ensure_manage_superuser(cast(AsyncSession, None), user)


@pytest.mark.asyncio
async def test_ensure_manage_superuser_allows_manage_superuser_permission(monkeypatch) -> None:
    async def fake_list_permission_codes_for_user(session, current_user):
        return [PERMISSION_MANAGE_SUPERUSER]

    monkeypatch.setattr(
        dependencies,
        "list_permission_codes_for_user",
        fake_list_permission_codes_for_user,
    )
    user = User(
        username="privileged",
        email="privileged@example.com",
        hashed_password="hash",
        is_superuser=False,
    )

    await ensure_manage_superuser(cast(AsyncSession, None), user)


@pytest.mark.asyncio
async def test_ensure_manage_superuser_rejects_regular_user(monkeypatch) -> None:
    async def fake_list_permission_codes_for_user(session, current_user):
        return ["action:users:update"]

    monkeypatch.setattr(
        dependencies,
        "list_permission_codes_for_user",
        fake_list_permission_codes_for_user,
    )
    user = User(
        username="regular",
        email="regular@example.com",
        hashed_password="hash",
        is_superuser=False,
    )

    with pytest.raises(HTTPException) as exc_info:
        await ensure_manage_superuser(cast(AsyncSession, None), user)

    assert exc_info.value.status_code == 403
