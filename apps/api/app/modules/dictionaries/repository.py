from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.dictionaries.models import DictionaryItem, DictionaryType


async def list_dictionary_types(session: AsyncSession) -> list[DictionaryType]:
    result = await session.scalars(select(DictionaryType).order_by(DictionaryType.code))
    return list(result.all())


async def list_dictionary_items(session: AsyncSession) -> list[DictionaryItem]:
    result = await session.scalars(
        select(DictionaryItem).order_by(DictionaryItem.type_id, DictionaryItem.sort_order)
    )
    return list(result.all())


async def get_dictionary_type_by_id(
    session: AsyncSession,
    type_id: UUID,
) -> DictionaryType | None:
    return await session.scalar(select(DictionaryType).where(DictionaryType.id == type_id))


async def get_dictionary_type_by_code(
    session: AsyncSession,
    code: str,
) -> DictionaryType | None:
    return await session.scalar(select(DictionaryType).where(DictionaryType.code == code))


async def count_dictionary_items_by_type(session: AsyncSession, type_id: UUID) -> int:
    count = await session.scalar(
        select(func.count()).select_from(DictionaryItem).where(DictionaryItem.type_id == type_id)
    )
    return count or 0


async def get_dictionary_item_by_id(
    session: AsyncSession,
    item_id: UUID,
) -> DictionaryItem | None:
    return await session.scalar(select(DictionaryItem).where(DictionaryItem.id == item_id))


async def get_dictionary_item_by_type_and_value(
    session: AsyncSession,
    *,
    type_id: UUID,
    value: str,
) -> DictionaryItem | None:
    return await session.scalar(
        select(DictionaryItem).where(
            DictionaryItem.type_id == type_id,
            DictionaryItem.value == value,
        )
    )
