from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.permissions.models import Role


async def list_roles(session: AsyncSession) -> list[Role]:
    result = await session.scalars(select(Role).order_by(Role.code))
    return list(result.all())
