from app.modules.permissions.registry import DEFAULT_PERMISSIONS


def test_stage6_permissions_are_registered() -> None:
    permission_codes = {permission.code for permission in DEFAULT_PERMISSIONS}

    assert {
        "menu:users",
        "menu:roles",
        "menu:departments",
        "action:users:read",
        "action:roles:read",
        "action:departments:read",
        "action:departments:create",
    }.issubset(permission_codes)
