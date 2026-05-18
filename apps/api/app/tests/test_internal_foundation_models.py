from sqlalchemy import Boolean, DateTime, ForeignKeyConstraint, Integer, String, Uuid

from app.db.base import Base
from app.modules.audit.models import LoginLog, OperationLog
from app.modules.auth.models import User
from app.modules.departments.models import Department
from app.modules.dictionaries.models import DictionaryItem, DictionaryType
from app.modules.files.models import FileAttachment


def test_stage6_foundation_models_are_registered_in_metadata() -> None:
    expected_tables = {
        "departments",
        "operation_logs",
        "login_logs",
        "dictionary_types",
        "dictionary_items",
        "file_attachments",
    }

    assert expected_tables.issubset(Base.metadata.tables)
    assert Department.__tablename__ == "departments"
    assert OperationLog.__tablename__ == "operation_logs"
    assert LoginLog.__tablename__ == "login_logs"
    assert DictionaryType.__tablename__ == "dictionary_types"
    assert DictionaryItem.__tablename__ == "dictionary_items"
    assert FileAttachment.__tablename__ == "file_attachments"


def test_departments_table_supports_hierarchy_and_user_assignment() -> None:
    departments_table = Base.metadata.tables["departments"]
    users_table = Base.metadata.tables["users"]

    assert isinstance(departments_table.c.id.type, Uuid)
    assert isinstance(departments_table.c.code.type, String)
    assert isinstance(departments_table.c.name.type, String)
    assert isinstance(departments_table.c.parent_id.type, Uuid)
    assert isinstance(departments_table.c.sort_order.type, Integer)
    assert isinstance(departments_table.c.is_active.type, Boolean)
    assert isinstance(users_table.c.department_id.type, Uuid)
    assert any(
        isinstance(constraint, ForeignKeyConstraint) for constraint in users_table.constraints
    )


def test_stage6_foundation_tables_use_timezone_aware_timestamps() -> None:
    for table_name in (
        "departments",
        "operation_logs",
        "login_logs",
        "dictionary_types",
        "dictionary_items",
        "file_attachments",
    ):
        created_at = Base.metadata.tables[table_name].c.created_at.type
        assert isinstance(created_at, DateTime)
        assert created_at.timezone is True


def test_user_model_exposes_department_id() -> None:
    assert hasattr(User, "department_id")
