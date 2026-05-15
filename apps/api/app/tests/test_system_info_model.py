from sqlalchemy import DateTime, String

from app.db.base import Base
from app.modules.system.models import SystemInfo


def test_system_info_model_is_registered_in_base_metadata() -> None:
    table = Base.metadata.tables["system_info"]

    assert SystemInfo.__tablename__ == "system_info"
    assert table.c.key.primary_key
    assert isinstance(table.c.key.type, String)
    assert isinstance(table.c.value.type, String)
    assert isinstance(table.c.description.type, String)
    assert isinstance(table.c.created_at.type, DateTime)
    assert isinstance(table.c.updated_at.type, DateTime)


def test_system_info_model_uses_timezone_aware_timestamps() -> None:
    table = Base.metadata.tables["system_info"]
    created_at_type = table.c.created_at.type
    updated_at_type = table.c.updated_at.type

    assert isinstance(created_at_type, DateTime)
    assert isinstance(updated_at_type, DateTime)
    assert created_at_type.timezone is True
    assert updated_at_type.timezone is True
