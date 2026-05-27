from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.apps.models import PlatformApp
from app.modules.dictionaries.models import DictionaryItem, DictionaryType

APP_CATEGORY_DICTIONARY_CODE = "app_category"


async def list_platform_apps(
    session: AsyncSession,
    *,
    q: str | None = None,
    category_code: str | None = None,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[PlatformApp], int]:
    statement = select(PlatformApp)
    count_statement = select(func.count()).select_from(PlatformApp)

    if q:
        pattern = f"%{q}%"
        filter_clause = or_(
            PlatformApp.code.ilike(pattern),
            PlatformApp.name.ilike(pattern),
            PlatformApp.description.ilike(pattern),
        )
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)

    if category_code:
        statement = statement.where(PlatformApp.category_code == category_code)
        count_statement = count_statement.where(PlatformApp.category_code == category_code)

    if is_active is not None:
        statement = statement.where(PlatformApp.is_active == is_active)
        count_statement = count_statement.where(PlatformApp.is_active == is_active)

    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(PlatformApp.sort_order, PlatformApp.name).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def get_platform_app_by_id(session: AsyncSession, app_id: UUID) -> PlatformApp | None:
    return await session.scalar(select(PlatformApp).where(PlatformApp.id == app_id))


async def get_platform_app_by_code(session: AsyncSession, code: str) -> PlatformApp | None:
    return await session.scalar(select(PlatformApp).where(PlatformApp.code == code))


async def app_category_exists(session: AsyncSession, category_code: str) -> bool:
    statement = (
        select(DictionaryItem.id)
        .join(DictionaryType, DictionaryType.id == DictionaryItem.type_id)
        .where(
            DictionaryType.code == APP_CATEGORY_DICTIONARY_CODE,
            DictionaryItem.value == category_code,
            DictionaryItem.is_active.is_(True),
        )
    )
    return await session.scalar(statement) is not None
