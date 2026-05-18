from uuid import UUID

from sqlalchemy import select
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
