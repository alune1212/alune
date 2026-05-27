from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.dictionaries.models import DictionaryItem, DictionaryType
from app.modules.dictionaries.repository import (
    count_dictionary_items_by_type,
    get_dictionary_item_by_id,
    get_dictionary_item_by_type_and_value,
    get_dictionary_type_by_code,
    get_dictionary_type_by_id,
    list_dictionary_items,
    list_dictionary_types,
)
from app.modules.dictionaries.schemas import (
    DictionaryItemCreate,
    DictionaryItemPublic,
    DictionaryItemUpdate,
    DictionaryTypeCreate,
    DictionaryTypePublic,
    DictionaryTypeUpdate,
)
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])
CreateDictionaryDependency = Depends(require_permission("action:dictionaries:create"))
UpdateDictionaryDependency = Depends(require_permission("action:dictionaries:update"))


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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="字典编码已存在")

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


@router.patch(
    "/types/{type_id}",
    response_model=ApiResponse[DictionaryTypePublic],
)
async def update_dictionary_type(
    type_id: UUID,
    payload: DictionaryTypeUpdate,
    session: DatabaseSession,
    current_user: User = UpdateDictionaryDependency,
) -> ApiResponse[DictionaryTypePublic]:
    dictionary_type = await get_dictionary_type_by_id(session, type_id)
    if dictionary_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="字典类型不存在"
        )
    if dictionary_type.is_system:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="系统字典类型不能修改",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"] is not None:
        existing_type = await get_dictionary_type_by_code(session, update_data["code"])
        if existing_type is not None and existing_type.id != dictionary_type.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="字典编码已存在"
            )

    for field_name, value in update_data.items():
        setattr(dictionary_type, field_name, value)

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="dictionary_type",
        resource_id=str(dictionary_type.id),
    )
    await session.commit()
    await session.refresh(dictionary_type)
    return ApiResponse(success=True, data=DictionaryTypePublic.model_validate(dictionary_type))


@router.delete(
    "/types/{type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_dictionary_type(
    type_id: UUID,
    session: DatabaseSession,
    current_user: User = UpdateDictionaryDependency,
) -> None:
    dictionary_type = await get_dictionary_type_by_id(session, type_id)
    if dictionary_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="字典类型不存在"
        )
    if dictionary_type.is_system:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="系统字典类型不能删除",
        )
    item_count = await count_dictionary_items_by_type(session, dictionary_type.id)
    if item_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="字典类型下仍有字典项"
        )

    await session.delete(dictionary_type)
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="delete",
        resource="dictionary_type",
        resource_id=str(dictionary_type.id),
    )
    await session.commit()


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
            detail="字典类型不存在",
        )
    existing_item = await get_dictionary_item_by_type_and_value(
        session,
        type_id=payload.type_id,
        value=payload.value,
    )
    if existing_item is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="字典项值已存在")

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


@router.patch(
    "/items/{item_id}",
    response_model=ApiResponse[DictionaryItemPublic],
)
async def update_dictionary_item(
    item_id: UUID,
    payload: DictionaryItemUpdate,
    session: DatabaseSession,
    current_user: User = UpdateDictionaryDependency,
) -> ApiResponse[DictionaryItemPublic]:
    item = await get_dictionary_item_by_id(session, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="字典项不存在",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "value" in update_data and update_data["value"] is not None:
        existing_item = await get_dictionary_item_by_type_and_value(
            session,
            type_id=item.type_id,
            value=update_data["value"],
        )
        if existing_item is not None and existing_item.id != item.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="字典项值已存在",
            )

    for field_name, value in update_data.items():
        setattr(item, field_name, value)

    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="update",
        resource="dictionary_item",
        resource_id=str(item.id),
    )
    await session.commit()
    await session.refresh(item)
    return ApiResponse(success=True, data=DictionaryItemPublic.model_validate(item))


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_dictionary_item(
    item_id: UUID,
    session: DatabaseSession,
    current_user: User = UpdateDictionaryDependency,
) -> None:
    item = await get_dictionary_item_by_id(session, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="字典项不存在",
        )

    await session.delete(item)
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="delete",
        resource="dictionary_item",
        resource_id=str(item.id),
    )
    await session.commit()
