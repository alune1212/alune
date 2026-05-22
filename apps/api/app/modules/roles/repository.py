from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.permissions.models import (
    Permission,
    Role,
    role_permissions_table,
    user_roles_table,
)


async def list_roles(session: AsyncSession) -> list[Role]:
    result = await session.scalars(select(Role).order_by(Role.code))
    return list(result.all())


async def get_role_by_id(session: AsyncSession, role_id: UUID) -> Role | None:
    return await session.scalar(select(Role).where(Role.id == role_id))


async def get_role_by_code(session: AsyncSession, code: str) -> Role | None:
    return await session.scalar(select(Role).where(Role.code == code))


async def count_users_by_role(session: AsyncSession, role_id: UUID) -> int:
    count = await session.scalar(
        select(func.count())
        .select_from(user_roles_table)
        .where(user_roles_table.c.role_id == role_id)
    )
    return count or 0


async def list_permissions(session: AsyncSession) -> list[Permission]:
    result = await session.scalars(select(Permission).order_by(Permission.type, Permission.code))
    return list(result.all())


async def list_role_permission_codes(session: AsyncSession, role_id: UUID) -> list[str]:
    statement = (
        select(Permission.code)
        .join(role_permissions_table, role_permissions_table.c.permission_id == Permission.id)
        .where(role_permissions_table.c.role_id == role_id)
        .order_by(Permission.code)
    )
    result = await session.scalars(statement)
    return list(result.all())


async def replace_role_permissions(
    session: AsyncSession,
    role: Role,
    permission_codes: list[str],
) -> list[str]:
    permissions_result = await session.scalars(
        select(Permission).where(Permission.code.in_(permission_codes))
    )
    permissions = list(permissions_result.all())
    found_codes = {permission.code for permission in permissions}
    missing_codes = sorted(set(permission_codes) - found_codes)
    if missing_codes:
        return missing_codes

    await session.execute(
        delete(role_permissions_table).where(role_permissions_table.c.role_id == role.id)
    )

    if permissions:
        await session.execute(
            role_permissions_table.insert(),
            [{"role_id": role.id, "permission_id": permission.id} for permission in permissions],
        )

    return []
