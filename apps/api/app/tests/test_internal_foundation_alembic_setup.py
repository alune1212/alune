from pathlib import Path


def test_internal_system_foundation_migration_exists() -> None:
    migration_files = list(Path("alembic/versions").glob("*_create_internal_system_foundation.py"))

    assert len(migration_files) == 1
    migration_source = migration_files[0].read_text()
    for expected_fragment in (
        "departments",
        "operation_logs",
        "login_logs",
        "dictionary_types",
        "dictionary_items",
        "file_attachments",
        "department_id",
        "create_foreign_key",
        "drop_table",
    ):
        assert expected_fragment in migration_source
