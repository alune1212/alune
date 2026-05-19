from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.permissions.models import Role, user_roles_table


async def list_users(
    session: AsyncSession,
    *,
    q: str | None = None,
    department_id: UUID | None = None,
    role_code: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[User], int]:
    statement = select(User)
    count_statement = select(func.count()).select_from(User)
    if role_code:
        statement = statement.join(user_roles_table, user_roles_table.c.user_id == User.id).join(
            Role,
            Role.id == user_roles_table.c.role_id,
        )
        count_statement = count_statement.join(
            user_roles_table,
            user_roles_table.c.user_id == User.id,
        ).join(Role, Role.id == user_roles_table.c.role_id)
        statement = statement.where(Role.code == role_code)
        count_statement = count_statement.where(Role.code == role_code)
    if department_id:
        statement = statement.where(User.department_id == department_id)
        count_statement = count_statement.where(User.department_id == department_id)
    if q:
        pattern = f"%{q}%"
        filter_clause = or_(
            User.username.ilike(pattern),
            User.email.ilike(pattern),
            User.full_name.ilike(pattern),
        )
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)

    total = await session.scalar(count_statement)
    result = await session.scalars(statement.order_by(User.username).offset(offset).limit(limit))
    return list(result.all()), total or 0


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    return await session.scalar(select(User).where(User.id == user_id))


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def list_user_role_codes(session: AsyncSession, user_id: UUID) -> list[str]:
    statement = (
        select(Role.code)
        .join(user_roles_table, user_roles_table.c.role_id == Role.id)
        .where(user_roles_table.c.user_id == user_id)
        .order_by(Role.code)
    )
    result = await session.scalars(statement)
    return list(result.all())


async def replace_user_roles(
    session: AsyncSession,
    user: User,
    role_codes: list[str],
) -> list[str]:
    roles_result = await session.scalars(select(Role).where(Role.code.in_(role_codes)))
    roles = list(roles_result.all())
    found_codes = {role.code for role in roles}
    missing_codes = sorted(set(role_codes) - found_codes)
    if missing_codes:
        return missing_codes

    await session.execute(delete(user_roles_table).where(user_roles_table.c.user_id == user.id))
    if roles:
        await session.execute(
            user_roles_table.insert(),
            [{"user_id": user.id, "role_id": role.id} for role in roles],
        )
    return []
