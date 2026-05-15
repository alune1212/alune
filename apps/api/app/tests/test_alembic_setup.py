from pathlib import Path


def test_initial_alembic_revision_creates_system_info_table() -> None:
    versions_dir = Path(__file__).resolve().parents[2] / "alembic" / "versions"
    revisions = list(versions_dir.glob("*_create_system_info.py"))

    assert len(revisions) == 1

    revision_content = revisions[0].read_text(encoding="utf-8")
    assert "op.create_table(" in revision_content
    assert '"system_info"' in revision_content
    assert "op.drop_table(" in revision_content
