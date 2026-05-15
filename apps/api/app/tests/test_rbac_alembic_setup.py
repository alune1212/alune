from pathlib import Path


def test_rbac_alembic_revision_creates_permission_tables() -> None:
    versions_dir = Path(__file__).resolve().parents[2] / "alembic" / "versions"
    revisions = list(versions_dir.glob("*_create_rbac_tables.py"))

    assert len(revisions) == 1

    revision_content = revisions[0].read_text(encoding="utf-8")
    assert '"roles"' in revision_content
    assert '"permissions"' in revision_content
    assert '"user_roles"' in revision_content
    assert '"role_permissions"' in revision_content
    assert "op.drop_table(" in revision_content
