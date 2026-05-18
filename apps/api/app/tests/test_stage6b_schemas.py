import pytest
from pydantic import ValidationError

from app.modules.roles.schemas import RolePermissionUpdate
from app.modules.users.schemas import UserCreate


def test_user_create_rejects_short_password() -> None:
    with pytest.raises(ValidationError, match="password"):
        UserCreate(
            username="jane",
            email="jane@example.com",
            full_name="Jane User",
            password="short",
        )


def test_role_permission_update_accepts_permission_codes() -> None:
    payload = RolePermissionUpdate(permission_codes=["menu:users", "action:users:read"])

    assert payload.permission_codes == ["menu:users", "action:users:read"]
