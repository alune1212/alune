from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.departments.models import Department


async def list_departments(session: AsyncSession) -> list[Department]:
    result = await session.scalars(
        select(Department).order_by(Department.sort_order, Department.code)
    )
    return list(result.all())


async def get_department_by_id(session: AsyncSession, department_id: UUID) -> Department | None:
    return await session.scalar(select(Department).where(Department.id == department_id))


async def get_department_by_code(session: AsyncSession, code: str) -> Department | None:
    return await session.scalar(select(Department).where(Department.code == code))
