from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.departments.models import Department


async def list_departments(
    session: AsyncSession,
    *,
    q: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Department], int]:
    statement = select(Department)
    count_statement = select(func.count()).select_from(Department)
    if q:
        pattern = f"%{q}%"
        filter_clause = or_(Department.code.ilike(pattern), Department.name.ilike(pattern))
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)

    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(Department.sort_order, Department.code).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def list_all_departments(session: AsyncSession) -> list[Department]:
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


async def has_descendant_department(
    session: AsyncSession,
    *,
    department_id: UUID,
    maybe_descendant_id: UUID,
) -> bool:
    all_departments = await list_all_departments(session)
    children_map: dict[UUID | None, list[UUID]] = {}
    for dept in all_departments:
        children_map.setdefault(dept.parent_id, []).append(dept.id)

    visited: set[UUID] = set()
    stack = list(children_map.get(department_id, []))
    while stack:
        current = stack.pop()
        if current == maybe_descendant_id:
            return True
        if current in visited:
            continue
        visited.add(current)
        stack.extend(children_map.get(current, []))

    return False
