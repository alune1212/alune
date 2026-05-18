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
        code="menu:audit",
        name="Audit menu",
        type="menu",
        description="View audit logs navigation items.",
    ),
    PermissionDefinition(
        code="menu:dictionaries",
        name="Dictionaries menu",
        type="menu",
        description="View dictionary management navigation item.",
    ),
    PermissionDefinition(
        code="menu:files",
        name="Files menu",
        type="menu",
        description="View file attachment navigation item.",
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
        code="action:users:create",
        name="Create users",
        type="action",
        description="Create user accounts.",
    ),
    PermissionDefinition(
        code="action:users:update",
        name="Update users",
        type="action",
        description="Update user accounts.",
    ),
    PermissionDefinition(
        code="action:users:update_roles",
        name="Update user roles",
        type="action",
        description="Update roles assigned to users.",
    ),
    PermissionDefinition(
        code="action:roles:read",
        name="Read roles",
        type="action",
        description="Read role management data.",
    ),
    PermissionDefinition(
        code="action:roles:update_permissions",
        name="Update role permissions",
        type="action",
        description="Update permissions assigned to roles.",
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
    PermissionDefinition(
        code="action:departments:update",
        name="Update departments",
        type="action",
        description="Update department records.",
    ),
    PermissionDefinition(
        code="action:departments:delete",
        name="Delete departments",
        type="action",
        description="Delete departments without children or assigned users.",
    ),
    PermissionDefinition(
        code="action:audit:read",
        name="Read audit logs",
        type="action",
        description="Read login and operation logs.",
    ),
    PermissionDefinition(
        code="action:dictionaries:read",
        name="Read dictionaries",
        type="action",
        description="Read dictionary types and items.",
    ),
    PermissionDefinition(
        code="action:dictionaries:create",
        name="Create dictionaries",
        type="action",
        description="Create dictionary types and items.",
    ),
    PermissionDefinition(
        code="action:files:read",
        name="Read files",
        type="action",
        description="Read file attachment metadata.",
    ),
    PermissionDefinition(
        code="action:files:create",
        name="Create files",
        type="action",
        description="Create file attachment metadata and upload file content.",
    ),
)
