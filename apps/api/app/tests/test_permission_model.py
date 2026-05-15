from sqlalchemy import Boolean, DateTime, ForeignKeyConstraint, String, Uuid

from app.db.base import Base
from app.modules.permissions.models import Permission, Role


def test_rbac_models_are_registered_in_base_metadata() -> None:
    role_table = Base.metadata.tables["roles"]
    permission_table = Base.metadata.tables["permissions"]
    user_roles_table = Base.metadata.tables["user_roles"]
    role_permissions_table = Base.metadata.tables["role_permissions"]

    assert Role.__tablename__ == "roles"
    assert Permission.__tablename__ == "permissions"
    assert isinstance(role_table.c.id.type, Uuid)
    assert isinstance(role_table.c.code.type, String)
    assert isinstance(role_table.c.name.type, String)
    assert isinstance(role_table.c.is_system.type, Boolean)
    assert isinstance(permission_table.c.id.type, Uuid)
    assert isinstance(permission_table.c.code.type, String)
    assert isinstance(permission_table.c.type.type, String)
    assert {column.name for column in user_roles_table.primary_key.columns} == {
        "user_id",
        "role_id",
    }
    assert {column.name for column in role_permissions_table.primary_key.columns} == {
        "role_id",
        "permission_id",
    }
    assert any(
        isinstance(constraint, ForeignKeyConstraint) for constraint in user_roles_table.constraints
    )
    assert any(
        isinstance(constraint, ForeignKeyConstraint)
        for constraint in role_permissions_table.constraints
    )


def test_rbac_models_use_timezone_aware_timestamps() -> None:
    role_created_at = Base.metadata.tables["roles"].c.created_at.type
    permission_created_at = Base.metadata.tables["permissions"].c.created_at.type

    assert isinstance(role_created_at, DateTime)
    assert isinstance(permission_created_at, DateTime)
    assert role_created_at.timezone is True
    assert permission_created_at.timezone is True
