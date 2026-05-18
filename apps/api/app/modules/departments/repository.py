from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
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


async def count_child_departments(session: AsyncSession, department_id: UUID) -> int:
    count = await session.scalar(
        select(func.count()).select_from(Department).where(Department.parent_id == department_id)
    )
    return count or 0


async def count_users_by_department(session: AsyncSession, department_id: UUID) -> int:
    count = await session.scalar(
        select(func.count()).select_from(User).where(User.department_id == department_id)
    )
    return count or 0
