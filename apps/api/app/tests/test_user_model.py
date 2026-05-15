from sqlalchemy import Boolean, DateTime, String, Uuid

from app.db.base import Base
from app.modules.auth.models import User


def test_user_model_is_registered_in_base_metadata() -> None:
    table = Base.metadata.tables["users"]

    assert User.__tablename__ == "users"
    assert isinstance(table.c.id.type, Uuid)
    assert isinstance(table.c.username.type, String)
    assert isinstance(table.c.email.type, String)
    assert isinstance(table.c.hashed_password.type, String)
    assert isinstance(table.c.is_active.type, Boolean)
    assert isinstance(table.c.is_superuser.type, Boolean)


def test_user_model_uses_timezone_aware_timestamps() -> None:
    table = Base.metadata.tables["users"]
    created_at_type = table.c.created_at.type
    updated_at_type = table.c.updated_at.type

    assert isinstance(created_at_type, DateTime)
    assert isinstance(updated_at_type, DateTime)
    assert created_at_type.timezone is True
    assert updated_at_type.timezone is True
