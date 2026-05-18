from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.permissions.dependencies import require_permission
from app.modules.roles.repository import (
    get_role_by_id,
    list_permissions,
    list_role_permission_codes,
    list_roles,
    replace_role_permissions,
)
from app.modules.roles.schemas import (
    PermissionPublic,
    RolePermissionPublic,
    RolePermissionUpdate,
    RolePublic,
)

router = APIRouter(prefix="/roles", tags=["roles"])
UpdateRolePermissionsDependency = Depends(require_permission("action:roles:update_permissions"))


@router.get(
    "",
    response_model=ApiResponse[list[RolePublic]],
    dependencies=[Depends(require_permission("action:roles:read"))],
)
async def get_roles(session: DatabaseSession) -> ApiResponse[list[RolePublic]]:
    roles = await list_roles(session)
    data = [RolePublic.model_validate(role) for role in roles]
    return ApiResponse(success=True, data=data)


@router.get(
    "/permissions",
    response_model=ApiResponse[list[PermissionPublic]],
    dependencies=[Depends(require_permission("action:roles:read"))],
)
async def get_permissions(session: DatabaseSession) -> ApiResponse[list[PermissionPublic]]:
    permissions = await list_permissions(session)
    data = [PermissionPublic.model_validate(permission) for permission in permissions]
    return ApiResponse(success=True, data=data)


@router.get(
    "/{role_id}/permissions",
    response_model=ApiResponse[RolePermissionPublic],
    dependencies=[Depends(require_permission("action:roles:read"))],
)
async def get_role_permissions(
    role_id: UUID,
    session: DatabaseSession,
) -> ApiResponse[RolePermissionPublic]:
    role = await get_role_by_id(session, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    permission_codes = await list_role_permission_codes(session, role.id)
    return ApiResponse(
        success=True,
        data=RolePermissionPublic(role_id=role.id, permission_codes=permission_codes),
    )


@router.put(
    "/{role_id}/permissions",
    response_model=ApiResponse[RolePermissionPublic],
)
async def update_role_permissions(
    role_id: UUID,
    payload: RolePermissionUpdate,
    session: DatabaseSession,
    current_user: User = UpdateRolePermissionsDependency,
) -> ApiResponse[RolePermissionPublic]:
    role = await get_role_by_id(session, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    missing_codes = await replace_role_permissions(session, role, payload.permission_codes)
    if missing_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown permission codes: {', '.join(missing_codes)}",
        )

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update_permissions",
        resource="role",
        resource_id=str(role.id),
    )
    await session.commit()
    permission_codes = await list_role_permission_codes(session, role.id)
    return ApiResponse(
        success=True,
        data=RolePermissionPublic(role_id=role.id, permission_codes=permission_codes),
    )
