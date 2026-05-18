from dataclasses import dataclass
from typing import Literal

PermissionType = Literal["menu", "action"]


@dataclass(frozen=True)
class PermissionDefinition:
    code: str
    name: str
    type: PermissionType
    description: str


ADMIN_ROLE_CODE = "admin"
ADMIN_ROLE_NAME = "Administrator"

DEFAULT_PERMISSIONS: tuple[PermissionDefinition, ...] = (
    PermissionDefinition(
        code="menu:dashboard",
        name="Dashboard menu",
        type="menu",
        description="View the dashboard navigation item.",
    ),
    PermissionDefinition(
        code="menu:users",
        name="Users menu",
        type="menu",
        description="View the user management navigation item.",
    ),
    PermissionDefinition(
        code="menu:roles",
        name="Roles menu",
        type="menu",
        description="View the role management navigation item.",
    ),
    PermissionDefinition(
        code="menu:departments",
        name="Departments menu",
        type="menu",
        description="View the department management navigation item.",
    ),
    PermissionDefinition(
        code="action:dashboard:read",
        name="Read dashboard",
        type="action",
        description="Read dashboard data.",
    ),
    PermissionDefinition(
        code="action:users:read",
        name="Read users",
        type="action",
        description="Read user management data.",
    ),
    PermissionDefinition(
        code="action:roles:read",
        name="Read roles",
        type="action",
        description="Read role management data.",
    ),
    PermissionDefinition(
        code="action:departments:read",
        name="Read departments",
        type="action",
        description="Read department management data.",
    ),
    PermissionDefinition(
        code="action:departments:create",
        name="Create departments",
        type="action",
        description="Create department records.",
    ),
)
