from app.modules.permissions.registry import DEFAULT_PERMISSIONS


def test_stage6b_permissions_are_registered() -> None:
    permission_codes = {permission.code for permission in DEFAULT_PERMISSIONS}

    assert {
        "menu:audit",
        "menu:dictionaries",
        "menu:files",
        "action:users:create",
        "action:users:update",
        "action:roles:update_permissions",
        "action:departments:update",
        "action:departments:delete",
        "action:audit:read",
        "action:dictionaries:read",
        "action:dictionaries:create",
        "action:files:read",
        "action:files:create",
    }.issubset(permission_codes)
