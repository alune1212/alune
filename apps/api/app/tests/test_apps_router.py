from datetime import UTC, datetime
from typing import cast
from uuid import UUID, uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import Page
from app.modules.apps import router as apps_router
from app.modules.apps.models import PlatformApp
from app.modules.apps.schemas import PlatformAppCreate, PlatformAppStatusUpdate
from app.modules.auth.models import User


class FakeSession:
    def __init__(self) -> None:
        self.added_objects: list[object] = []
        self.commits = 0

    def add(self, value: object) -> None:
        self.added_objects.append(value)

    async def flush(self) -> None:
        for value in self.added_objects:
            if isinstance(value, PlatformApp) and value.id is None:
                value.id = uuid4()
                value.created_at = datetime.now(UTC)
                value.updated_at = datetime.now(UTC)

    async def commit(self) -> None:
        self.commits += 1

    async def refresh(self, value: object) -> None:
        if isinstance(value, PlatformApp):
            value.updated_at = datetime.now(UTC)


def build_user(*, is_superuser: bool = False) -> User:
    return User(
        id=uuid4(),
        username="admin",
        email="admin@example.com",
        hashed_password="hash",
        is_active=True,
        is_superuser=is_superuser,
    )


def build_app(*, is_active: bool = True) -> PlatformApp:
    return PlatformApp(
        id=uuid4(),
        code="notes",
        name="Notes",
        category_code="tool",
        entry_type="internal",
        entry_url="/notes",
        sort_order=1,
        is_active=is_active,
        created_by_id=uuid4(),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_read_only_user_list_is_forced_to_active_apps(monkeypatch) -> None:
    captured_is_active: bool | None = None

    async def fake_list_permission_codes_for_user(session, user):
        return ["action:apps:read"]

    async def fake_list_platform_apps(session, **kwargs):
        nonlocal captured_is_active
        captured_is_active = kwargs["is_active"]
        return [build_app()], 1

    monkeypatch.setattr(
        apps_router,
        "list_permission_codes_for_user",
        fake_list_permission_codes_for_user,
    )
    monkeypatch.setattr(apps_router, "list_platform_apps", fake_list_platform_apps)

    response = await apps_router.get_platform_apps(
        session=cast(AsyncSession, FakeSession()),
        current_user=build_user(),
        q=None,
        category_code=None,
        is_active=None,
        page=1,
        page_size=20,
    )

    assert captured_is_active is True
    assert isinstance(response.data, Page)
    assert response.data.total == 1


@pytest.mark.asyncio
async def test_create_platform_app_records_operation_log(monkeypatch) -> None:
    operation_log: dict[str, object] = {}

    async def fake_get_platform_app_by_code(session, code):
        return None

    async def fake_app_category_exists(session, category_code):
        return True

    async def fake_record_operation_log(*args, **kwargs):
        operation_log.update(kwargs)

    monkeypatch.setattr(apps_router, "get_platform_app_by_code", fake_get_platform_app_by_code)
    monkeypatch.setattr(apps_router, "app_category_exists", fake_app_category_exists)
    monkeypatch.setattr(apps_router, "record_operation_log", fake_record_operation_log)

    session = FakeSession()
    response = await apps_router.create_platform_app(
        payload=PlatformAppCreate(
            code="notes",
            name="Notes",
            category_code="tool",
            entry_type="internal",
            entry_url="/notes",
        ),
        session=cast(AsyncSession, session),
        current_user=build_user(is_superuser=True),
    )

    assert response.data.code == "notes"
    assert session.commits == 1
    assert operation_log["action"] == "create"
    assert operation_log["resource"] == "app"


@pytest.mark.asyncio
async def test_update_platform_app_status_records_enable_or_disable(monkeypatch) -> None:
    platform_app = build_app(is_active=True)
    operation_log: dict[str, object] = {}

    async def fake_get_platform_app_by_id(session, app_id: UUID):
        return platform_app

    async def fake_record_operation_log(*args, **kwargs):
        operation_log.update(kwargs)

    monkeypatch.setattr(apps_router, "get_platform_app_by_id", fake_get_platform_app_by_id)
    monkeypatch.setattr(apps_router, "record_operation_log", fake_record_operation_log)

    session = FakeSession()
    response = await apps_router.update_platform_app_status(
        app_id=platform_app.id,
        payload=PlatformAppStatusUpdate(is_active=False),
        session=cast(AsyncSession, session),
        current_user=build_user(is_superuser=True),
    )

    assert response.data.is_active is False
    assert session.commits == 1
    assert operation_log["action"] == "disable"
    assert operation_log["resource"] == "app"
