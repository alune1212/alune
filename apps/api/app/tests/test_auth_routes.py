from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db_session
from app.main import app
from app.modules.auth.models import User
from app.modules.auth.security import create_access_token, get_password_hash


class FakeUserSession:
    def __init__(self, user: User | None) -> None:
        self.user = user

    async def scalar(self, _: object) -> User | None:
        return self.user


def build_active_user() -> User:
    return User(
        id=uuid4(),
        username="admin",
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("correct-password"),
        is_active=True,
        is_superuser=True,
    )


def override_session(user: User | None):
    async def _override() -> AsyncIterator[FakeUserSession]:
        yield FakeUserSession(user)

    return _override


@pytest.mark.asyncio
async def test_login_returns_access_token_for_valid_credentials() -> None:
    app.dependency_overrides[get_db_session] = override_session(build_active_user())
    transport = ASGITransport(app=app)

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                data={"username": "admin", "password": "correct-password"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["token_type"] == "bearer"
    assert payload["data"]["access_token"]


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials() -> None:
    app.dependency_overrides[get_db_session] = override_session(build_active_user())
    transport = ASGITransport(app=app)

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                data={"username": "admin", "password": "wrong-password"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}


@pytest.mark.asyncio
async def test_me_returns_current_user_from_bearer_token() -> None:
    user = build_active_user()
    token = create_access_token(subject=user.username)
    app.dependency_overrides[get_db_session] = override_session(user)
    transport = ASGITransport(app=app)

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["username"] == "admin"
    assert payload["data"]["email"] == "admin@example.com"
