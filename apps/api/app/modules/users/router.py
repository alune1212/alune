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
from app.modules.users.repository import (
    get_user_by_email,
    get_user_by_id,
    list_user_role_codes,
    list_users,
    replace_user_roles,
)
from app.modules.users.schemas import (
    UserCreate,
    UserManagementItem,
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
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[UserManagementItem]]:
    users, total = await list_users(
        session,
        q=q,
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
