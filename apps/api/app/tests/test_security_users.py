from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db_session
from app.main import app
from app.modules.auth.models import User
from app.modules.auth.security import create_access_token
from app.modules.permissions.models import Role
from app.modules.permissions.registry import PERMISSION_MANAGE_SUPERUSER
from app.modules.roles import router as roles_router
from app.modules.users import router as users_router
from app.modules.users.schemas import UserCreate, UserUpdate


class FakePermissionResult:
    def __init__(self, values: list[str]) -> None:
        self.values = values

    def all(self) -> list[str]:
        return self.values


class FakeSecuritySession:
    def __init__(self, current_user: User, permission_codes: list[str]) -> None:
        self.current_user = current_user
        self.permission_codes = permission_codes
        self.added_objects: list[object] = []
        self.commits = 0

    async def scalar(self, _: object) -> User:
        return self.current_user

    async def scalars(self, _: object) -> FakePermissionResult:
        return FakePermissionResult(self.permission_codes)

    def add(self, value: object) -> None:
        self.added_objects.append(value)

    async def flush(self) -> None:
        for value in self.added_objects:
            if isinstance(value, User) and value.id is None:
                value.id = uuid4()

    async def commit(self) -> None:
        self.commits += 1

    async def refresh(self, _: object) -> None:
        return None


def build_user(*, is_superuser: bool = False) -> User:
    return User(
        id=uuid4(),
        username=f"user-{uuid4()}",
        email=f"{uuid4()}@example.com",
        hashed_password="hash",
        is_active=True,
        is_superuser=is_superuser,
    )


def override_session(session: FakeSecuritySession):
    async def _override() -> AsyncIterator[FakeSecuritySession]:
        yield session

    return _override


async def request_with_user(
    current_user: User,
    permission_codes: list[str],
    method: str,
    url: str,
    *,
    json: dict[str, object],
):
    session = FakeSecuritySession(current_user, permission_codes)
    app.dependency_overrides[get_db_session] = override_session(session)
    transport = ASGITransport(app=app)
    token = create_access_token(subject=current_user.username)

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.request(
                method,
                url,
                headers={"Authorization": f"Bearer {token}"},
                json=json,
            )
    finally:
        app.dependency_overrides.clear()

    return response, session


class TestSuperuserProtection:
    def test_user_create_schema_is_superuser_defaults_false(self):
        """UserCreate defaults is_superuser=False to prevent accidental superuser creation"""
        payload = UserCreate(
            username="testuser",
            email="test@test.com",
            password="testpass123",
        )
        assert payload.is_superuser is False

    def test_user_update_schema_is_superuser_omitted_by_default(self):
        """UserUpdate omits is_superuser by default when exclude_unset=True"""
        payload = UserUpdate(email="new@test.com")
        data = payload.model_dump(exclude_unset=True)
        assert "is_superuser" not in data

    def test_user_update_schema_can_explicitly_set_is_superuser(self):
        """UserUpdate allows explicitly setting is_superuser (router enforces authorization)"""
        payload = UserUpdate(is_superuser=True)
        data = payload.model_dump(exclude_unset=True)
        assert data["is_superuser"] is True

    def test_user_create_schema_can_explicitly_set_is_superuser(self):
        """UserCreate allows explicitly setting is_superuser=True (router enforces authorization)"""
        payload = UserCreate(
            username="super",
            email="super@test.com",
            password="testpass123456",
            is_superuser=True,
        )
        assert payload.is_superuser is True


class TestSystemRoleProtection:
    def test_role_model_has_is_system_field(self):
        """Role model has is_system field for system role protection"""
        from app.modules.permissions.models import Role
        assert hasattr(Role, "is_system")

    def test_admin_role_is_system_by_default(self):
        """New Role is_system defaults to None (DB server_default 'false')"""
        from app.modules.permissions.models import Role
        role = Role(code="test", name="Test")
        assert role.is_system is None


@pytest.mark.asyncio
async def test_regular_admin_cannot_create_superuser_over_http() -> None:
    current_user = build_user()

    response, _ = await request_with_user(
        current_user,
        ["action:users:create"],
        "POST",
        "/api/v1/users",
        json={
            "username": "new-superuser",
            "email": "new-superuser@example.com",
            "password": "testpass123456",
            "is_superuser": True,
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_regular_admin_cannot_update_superuser_status_over_http(monkeypatch) -> None:
    current_user = build_user()
    target_user = build_user()

    async def fake_get_user_by_id(session, user_id):
        return target_user

    monkeypatch.setattr(users_router, "get_user_by_id", fake_get_user_by_id)

    response, _ = await request_with_user(
        current_user,
        ["action:users:update"],
        "PATCH",
        f"/api/v1/users/{target_user.id}",
        json={"is_superuser": True},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_manage_superuser_permission_can_create_superuser_over_http(monkeypatch) -> None:
    current_user = build_user()

    async def fake_missing_user(session, value):
        return None

    async def fake_record_operation_log(*args, **kwargs):
        return None

    monkeypatch.setattr(users_router, "get_user_by_username", fake_missing_user)
    monkeypatch.setattr(users_router, "get_user_by_email", fake_missing_user)
    monkeypatch.setattr(users_router, "record_operation_log", fake_record_operation_log)

    response, session = await request_with_user(
        current_user,
        ["action:users:create", PERMISSION_MANAGE_SUPERUSER],
        "POST",
        "/api/v1/users",
        json={
            "username": "allowed-superuser",
            "email": "allowed-superuser@example.com",
            "password": "testpass123456",
            "is_superuser": True,
        },
    )

    assert response.status_code == 201
    assert session.commits == 1
    assert response.json()["data"]["is_superuser"] is True


@pytest.mark.asyncio
async def test_regular_admin_cannot_update_system_role_permissions_over_http(monkeypatch) -> None:
    current_user = build_user()
    system_role = Role(id=uuid4(), code="admin", name="管理员", is_system=True)

    async def fake_get_role_by_id(session, role_id):
        return system_role

    monkeypatch.setattr(roles_router, "get_role_by_id", fake_get_role_by_id)

    response, _ = await request_with_user(
        current_user,
        ["action:roles:update_permissions"],
        "PUT",
        f"/api/v1/roles/{system_role.id}/permissions",
        json={"permission_codes": ["menu:dashboard"]},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_current_user_cannot_change_own_superuser_status_over_http(monkeypatch) -> None:
    current_user = build_user(is_superuser=True)

    async def fake_get_user_by_id(session, user_id):
        return current_user

    monkeypatch.setattr(users_router, "get_user_by_id", fake_get_user_by_id)

    response, _ = await request_with_user(
        current_user,
        ["action:users:update"],
        "PATCH",
        f"/api/v1/users/{current_user.id}",
        json={"is_superuser": False},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "不能修改自己的超级用户状态"
