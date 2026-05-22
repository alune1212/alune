from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.auth.repository import get_user_by_username
from app.modules.auth.security import get_password_hash
from app.modules.departments.repository import get_department_by_id
from app.modules.permissions.dependencies import require_permission
from app.modules.permissions.repository import list_permission_codes_for_user
from app.modules.users.repository import (
    bulk_update_user_status,
    get_user_by_email,
    get_user_by_id,
    list_user_role_codes,
    list_users,
    replace_user_roles,
)
from app.modules.users.schemas import (
    UserBulkStatusUpdate,
    UserCreate,
    UserManagementItem,
    UserPasswordUpdate,
    UserRolePublic,
    UserRoleUpdate,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])
CreateUserDependency = Depends(require_permission("action:users:create"))
UpdateUserDependency = Depends(require_permission("action:users:update"))
UpdateUserRolesDependency = Depends(require_permission("action:users:update_roles"))


@router.get(
    "",
    response_model=ApiResponse[Page[UserManagementItem]],
    dependencies=[Depends(require_permission("action:users:read"))],
)
async def get_users(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    department_id: UUID | None = None,
    role_code: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[UserManagementItem]]:
    users, total = await list_users(
        session,
        q=q,
        department_id=department_id,
        role_code=role_code,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [UserManagementItem.model_validate(user) for user in users]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@router.post(
    "",
    response_model=ApiResponse[UserManagementItem],
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    payload: UserCreate,
    session: DatabaseSession,
    current_user: User = CreateUserDependency,
) -> ApiResponse[UserManagementItem]:
    if payload.is_superuser and not current_user.is_superuser:
        permission_codes = await list_permission_codes_for_user(session, current_user)
        if "action:users:manage_superuser" not in permission_codes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only users with manage_superuser permission can create superuser accounts",
            )

    existing_username = await get_user_by_username(session, payload.username)
    if existing_username is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    existing_email = await get_user_by_email(session, payload.email)
    if existing_email is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    if payload.department_id is not None:
        department = await get_department_by_id(session, payload.department_id)
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department missing",
            )

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        department_id=payload.department_id,
        hashed_password=get_password_hash(payload.password),
        is_active=payload.is_active,
        is_superuser=payload.is_superuser,
    )
    session.add(user)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="user",
        resource_id=str(user.id),
    )
    await session.commit()
    await session.refresh(user)
    return ApiResponse(success=True, data=UserManagementItem.model_validate(user))


@router.patch(
    "/bulk-status",
    response_model=ApiResponse[dict[str, int]],
)
async def update_users_status(
    payload: UserBulkStatusUpdate,
    session: DatabaseSession,
    current_user: User = UpdateUserDependency,
) -> ApiResponse[dict[str, int]]:
    if not payload.is_active and current_user.id in payload.user_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user cannot be disabled in bulk",
        )

    updated_count = await bulk_update_user_status(
        session,
        user_ids=payload.user_ids,
        is_active=payload.is_active,
    )
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="bulk_update_status",
        resource="user",
        resource_id=",".join(str(user_id) for user_id in payload.user_ids),
        detail=f"is_active={payload.is_active}; updated_count={updated_count}",
    )
    await session.commit()
    return ApiResponse(success=True, data={"updated_count": updated_count})


@router.get(
    "/{user_id}/roles",
    response_model=ApiResponse[UserRolePublic],
    dependencies=[Depends(require_permission("action:users:read"))],
)
async def get_user_roles(
    user_id: UUID,
    session: DatabaseSession,
) -> ApiResponse[UserRolePublic]:
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    role_codes = await list_user_role_codes(session, user.id)
    return ApiResponse(success=True, data=UserRolePublic(user_id=user.id, role_codes=role_codes))


@router.put(
    "/{user_id}/roles",
    response_model=ApiResponse[UserRolePublic],
)
async def update_user_roles(
    user_id: UUID,
    payload: UserRoleUpdate,
    session: DatabaseSession,
    current_user: User = UpdateUserRolesDependency,
) -> ApiResponse[UserRolePublic]:
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    missing_codes = await replace_user_roles(session, user, payload.role_codes)
    if missing_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown role codes: {', '.join(missing_codes)}",
        )

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update_roles",
        resource="user",
        resource_id=str(user.id),
    )
    await session.commit()
    role_codes = await list_user_role_codes(session, user.id)
    return ApiResponse(success=True, data=UserRolePublic(user_id=user.id, role_codes=role_codes))


@router.patch(
    "/{user_id}/password",
    response_model=ApiResponse[UserManagementItem],
)
async def update_user_password(
    user_id: UUID,
    payload: UserPasswordUpdate,
    session: DatabaseSession,
    current_user: User = UpdateUserDependency,
) -> ApiResponse[UserManagementItem]:
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = get_password_hash(payload.password)
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update_password",
        resource="user",
        resource_id=str(user.id),
    )
    await session.commit()
    await session.refresh(user)
    return ApiResponse(success=True, data=UserManagementItem.model_validate(user))


@router.patch(
    "/{user_id}",
    response_model=ApiResponse[UserManagementItem],
)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    session: DatabaseSession,
    current_user: User = UpdateUserDependency,
) -> ApiResponse[UserManagementItem]:
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)

    if (
        "is_superuser" in update_data
        and update_data["is_superuser"] is not None
        and not current_user.is_superuser
    ):
        permission_codes = await list_permission_codes_for_user(session, current_user)
        if "action:users:manage_superuser" not in permission_codes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: manage_superuser required",
            )

    if (
        "is_active" in update_data
        and update_data["is_active"] is False
        and user.id == current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own account",
        )

    if "email" in update_data and update_data["email"] is not None:
        existing_email = await get_user_by_email(session, update_data["email"])
        if existing_email is not None and existing_email.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    if "department_id" in update_data and update_data["department_id"] is not None:
        department = await get_department_by_id(session, update_data["department_id"])
        if department is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department missing",
            )

    for field_name, value in update_data.items():
        setattr(user, field_name, value)

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="user",
        resource_id=str(user.id),
    )
    await session.commit()
    await session.refresh(user)
    return ApiResponse(success=True, data=UserManagementItem.model_validate(user))
