from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.auth.repository import get_user_by_username
from app.modules.auth.security import get_password_hash
from app.modules.departments.repository import get_department_by_id
from app.modules.permissions.dependencies import require_permission
from app.modules.users.repository import get_user_by_email, get_user_by_id, list_users
from app.modules.users.schemas import UserCreate, UserManagementItem, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])
CreateUserDependency = Depends(require_permission("action:users:create"))
UpdateUserDependency = Depends(require_permission("action:users:update"))


@router.get(
    "",
    response_model=ApiResponse[list[UserManagementItem]],
    dependencies=[Depends(require_permission("action:users:read"))],
)
async def get_users(session: DatabaseSession) -> ApiResponse[list[UserManagementItem]]:
    users = await list_users(session)
    data = [UserManagementItem.model_validate(user) for user in users]
    return ApiResponse(success=True, data=data)


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
