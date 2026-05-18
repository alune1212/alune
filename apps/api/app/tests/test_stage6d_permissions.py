from app.modules.permissions.registry import DEFAULT_PERMISSIONS


def test_stage6d_permissions_are_registered() -> None:
    permission_codes = {permission.code for permission in DEFAULT_PERMISSIONS}

    assert "action:dictionaries:update" in permission_codes
