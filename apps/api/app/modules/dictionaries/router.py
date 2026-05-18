from fastapi import APIRouter, Depends, HTTPException, status

from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.dictionaries.models import DictionaryItem, DictionaryType
from app.modules.dictionaries.repository import (
    get_dictionary_type_by_code,
    get_dictionary_type_by_id,
    list_dictionary_items,
    list_dictionary_types,
)
from app.modules.dictionaries.schemas import (
    DictionaryItemCreate,
    DictionaryItemPublic,
    DictionaryTypeCreate,
    DictionaryTypePublic,
)
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])
CreateDictionaryDependency = Depends(require_permission("action:dictionaries:create"))


@router.get(
    "/types",
    response_model=ApiResponse[list[DictionaryTypePublic]],
    dependencies=[Depends(require_permission("action:dictionaries:read"))],
)
async def get_dictionary_types(
    session: DatabaseSession,
) -> ApiResponse[list[DictionaryTypePublic]]:
    types = await list_dictionary_types(session)
    data = [DictionaryTypePublic.model_validate(dictionary_type) for dictionary_type in types]
    return ApiResponse(success=True, data=data)


@router.post(
    "/types",
    response_model=ApiResponse[DictionaryTypePublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_dictionary_type(
    payload: DictionaryTypeCreate,
    session: DatabaseSession,
    current_user: User = CreateDictionaryDependency,
) -> ApiResponse[DictionaryTypePublic]:
    existing_type = await get_dictionary_type_by_code(session, payload.code)
    if existing_type is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dictionary code exists")

    dictionary_type = DictionaryType(**payload.model_dump())
    session.add(dictionary_type)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="dictionary_type",
        resource_id=str(dictionary_type.id),
    )
    await session.commit()
    await session.refresh(dictionary_type)
    return ApiResponse(success=True, data=DictionaryTypePublic.model_validate(dictionary_type))


@router.get(
    "/items",
    response_model=ApiResponse[list[DictionaryItemPublic]],
    dependencies=[Depends(require_permission("action:dictionaries:read"))],
)
async def get_dictionary_items(
    session: DatabaseSession,
) -> ApiResponse[list[DictionaryItemPublic]]:
    items = await list_dictionary_items(session)
    data = [DictionaryItemPublic.model_validate(item) for item in items]
    return ApiResponse(success=True, data=data)


@router.post(
    "/items",
    response_model=ApiResponse[DictionaryItemPublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_dictionary_item(
    payload: DictionaryItemCreate,
    session: DatabaseSession,
    current_user: User = CreateDictionaryDependency,
) -> ApiResponse[DictionaryItemPublic]:
    dictionary_type = await get_dictionary_type_by_id(session, payload.type_id)
    if dictionary_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dictionary type missing",
        )

    item = DictionaryItem(**payload.model_dump())
    session.add(item)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="dictionary_item",
        resource_id=str(item.id),
    )
    await session.commit()
    await session.refresh(item)
    return ApiResponse(success=True, data=DictionaryItemPublic.model_validate(item))
