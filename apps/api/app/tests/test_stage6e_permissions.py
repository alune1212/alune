from app.modules.permissions.registry import DEFAULT_PERMISSIONS


def test_stage6e_permissions_are_registered() -> None:
    permission_codes = {permission.code for permission in DEFAULT_PERMISSIONS}

    assert "action:roles:create" in permission_codes
    assert "action:roles:update" in permission_codes
    assert "action:roles:delete" in permission_codes
