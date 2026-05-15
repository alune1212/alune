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
        code="menu:employees",
        name="Employees menu",
        type="menu",
        description="View the employee navigation item.",
    ),
    PermissionDefinition(
        code="menu:permissions",
        name="Permissions menu",
        type="menu",
        description="View the permissions navigation item.",
    ),
    PermissionDefinition(
        code="action:dashboard:read",
        name="Read dashboard",
        type="action",
        description="Read dashboard data.",
    ),
    PermissionDefinition(
        code="action:employees:read",
        name="Read employees",
        type="action",
        description="Read employee module data.",
    ),
    PermissionDefinition(
        code="action:permissions:read",
        name="Read permissions",
        type="action",
        description="Read permission module data.",
    ),
)
