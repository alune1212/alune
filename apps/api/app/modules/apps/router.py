from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.modules.apps.models import PlatformApp
from app.modules.apps.repository import (
    app_category_exists,
    get_platform_app_by_code,
    get_platform_app_by_id,
    list_platform_apps,
)
from app.modules.apps.schemas import (
    PlatformAppCreate,
    PlatformAppPublic,
    PlatformAppStatusUpdate,
    PlatformAppUpdate,
    validate_entry_url,
)
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.permissions.dependencies import require_permission
from app.modules.permissions.repository import list_permission_codes_for_user

router = APIRouter(prefix="/apps", tags=["apps"])

ReadAppDependency = Depends(require_permission("action:apps:read"))
CreateAppDependency = Depends(require_permission("action:apps:create"))
UpdateAppDependency = Depends(require_permission("action:apps:update"))
ManageAppStatusDependency = Depends(require_permission("action:apps:manage_status"))
APP_MANAGEMENT_PERMISSIONS = {
    "action:apps:create",
    "action:apps:update",
    "action:apps:manage_status",
}


async def _can_manage_apps(session: DatabaseSession, current_user: User) -> bool:
    if current_user.is_superuser:
        return True
    permission_codes = set(await list_permission_codes_for_user(session, current_user))
    return bool(permission_codes.intersection(APP_MANAGEMENT_PERMISSIONS))


async def _ensure_category_exists(session: DatabaseSession, category_code: str) -> None:
    if not await app_category_exists(session, category_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="App category missing",
        )


@router.get(
    "",
    response_model=ApiResponse[Page[PlatformAppPublic]],
)
async def get_platform_apps(
    session: DatabaseSession,
    current_user: User = ReadAppDependency,
    q: str | None = Query(default=None, max_length=100),
    category_code: str | None = Query(default=None, max_length=100),
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[PlatformAppPublic]]:
    effective_is_active = is_active
    if not await _can_manage_apps(session, current_user):
        effective_is_active = True

    apps, total = await list_platform_apps(
        session,
        q=q,
        category_code=category_code,
        is_active=effective_is_active,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [PlatformAppPublic.model_validate(app) for app in apps]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@router.post(
    "",
    response_model=ApiResponse[PlatformAppPublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_platform_app(
    payload: PlatformAppCreate,
    session: DatabaseSession,
    current_user: User = CreateAppDependency,
) -> ApiResponse[PlatformAppPublic]:
    existing_app = await get_platform_app_by_code(session, payload.code)
    if existing_app is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="App code exists")
    await _ensure_category_exists(session, payload.category_code)

    platform_app = PlatformApp(**payload.model_dump(), created_by_id=current_user.id)
    session.add(platform_app)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="app",
        resource_id=str(platform_app.id),
    )
    await session.commit()
    await session.refresh(platform_app)
    return ApiResponse(success=True, data=PlatformAppPublic.model_validate(platform_app))


@router.patch(
    "/{app_id}",
    response_model=ApiResponse[PlatformAppPublic],
)
async def update_platform_app(
    app_id: UUID,
    payload: PlatformAppUpdate,
    session: DatabaseSession,
    current_user: User = UpdateAppDependency,
) -> ApiResponse[PlatformAppPublic]:
    platform_app = await get_platform_app_by_id(session, app_id)
    if platform_app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("is_active", None)
    if "code" in update_data and update_data["code"] is not None:
        existing_app = await get_platform_app_by_code(session, update_data["code"])
        if existing_app is not None and existing_app.id != platform_app.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="App code exists")

    if "category_code" in update_data and update_data["category_code"] is not None:
        await _ensure_category_exists(session, update_data["category_code"])

    next_entry_type = update_data.get("entry_type", platform_app.entry_type)
    next_entry_url = update_data.get("entry_url", platform_app.entry_url)
    validate_entry_url(next_entry_type, next_entry_url)

    for field_name, value in update_data.items():
        setattr(platform_app, field_name, value)

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="app",
        resource_id=str(platform_app.id),
    )
    await session.commit()
    await session.refresh(platform_app)
    return ApiResponse(success=True, data=PlatformAppPublic.model_validate(platform_app))


@router.patch(
    "/{app_id}/status",
    response_model=ApiResponse[PlatformAppPublic],
)
async def update_platform_app_status(
    app_id: UUID,
    payload: PlatformAppStatusUpdate,
    session: DatabaseSession,
    current_user: User = ManageAppStatusDependency,
) -> ApiResponse[PlatformAppPublic]:
    platform_app = await get_platform_app_by_id(session, app_id)
    if platform_app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    platform_app.is_active = payload.is_active
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="enable" if payload.is_active else "disable",
        resource="app",
        resource_id=str(platform_app.id),
    )
    await session.commit()
    await session.refresh(platform_app)
    return ApiResponse(success=True, data=PlatformAppPublic.model_validate(platform_app))
