from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.permissions.dependencies import require_permission
from app.modules.permissions.repository import list_permission_codes_for_user
from app.modules.permissions.models import Role
from app.modules.roles.repository import (
    count_users_by_role,
    get_role_by_code,
    get_role_by_id,
    list_permissions,
    list_role_permission_codes,
    list_roles,
    replace_role_permissions,
)
from app.modules.roles.schemas import (
    PermissionPublic,
    RoleCreate,
    RolePermissionPublic,
    RolePermissionUpdate,
    RolePublic,
    RoleUpdate,
)

router = APIRouter(prefix="/roles", tags=["roles"])
CreateRoleDependency = Depends(require_permission("action:roles:create"))
UpdateRoleDependency = Depends(require_permission("action:roles:update"))
DeleteRoleDependency = Depends(require_permission("action:roles:delete"))
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


@router.post(
    "",
    response_model=ApiResponse[RolePublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    payload: RoleCreate,
    session: DatabaseSession,
    current_user: User = CreateRoleDependency,
) -> ApiResponse[RolePublic]:
    existing_role = await get_role_by_code(session, payload.code)
    if existing_role is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role code exists")

    role = Role(**payload.model_dump(), is_system=False)
    session.add(role)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="role",
        resource_id=str(role.id),
    )
    await session.commit()
    await session.refresh(role)
    return ApiResponse(success=True, data=RolePublic.model_validate(role))


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


@router.patch(
    "/{role_id}",
    response_model=ApiResponse[RolePublic],
)
async def update_role(
    role_id: UUID,
    payload: RoleUpdate,
    session: DatabaseSession,
    current_user: User = UpdateRoleDependency,
) -> ApiResponse[RolePublic]:
    role = await get_role_by_id(session, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="System role cannot be updated"
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"] is not None:
        existing_role = await get_role_by_code(session, update_data["code"])
        if existing_role is not None and existing_role.id != role.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role code exists")

    for field_name, value in update_data.items():
        setattr(role, field_name, value)

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="role",
        resource_id=str(role.id),
    )
    await session.commit()
    await session.refresh(role)
    return ApiResponse(success=True, data=RolePublic.model_validate(role))


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_role(
    role_id: UUID,
    session: DatabaseSession,
    current_user: User = DeleteRoleDependency,
) -> None:
    role = await get_role_by_id(session, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="System role cannot be deleted"
        )
    user_count = await count_users_by_role(session, role.id)
    if user_count > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role has assigned users")

    await session.delete(role)
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="delete",
        resource="role",
        resource_id=str(role.id),
    )
    await session.commit()


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

    if role.is_system:
        permission_codes = await list_permission_codes_for_user(session, current_user)
        if "action:users:manage_superuser" not in permission_codes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only users with manage_superuser permission can modify system role permissions",
            )

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
