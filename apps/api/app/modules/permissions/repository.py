from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.permissions.models import (
    Permission,
    Role,
    role_permissions_table,
    user_roles_table,
)


async def get_permission_by_code(session: AsyncSession, code: str) -> Permission | None:
    return await session.scalar(select(Permission).where(Permission.code == code))


async def get_role_by_code(session: AsyncSession, code: str) -> Role | None:
    return await session.scalar(select(Role).where(Role.code == code))


async def link_role_permission(session: AsyncSession, role: Role, permission: Permission) -> None:
    existing_link = await session.scalar(
        select(role_permissions_table.c.role_id).where(
            role_permissions_table.c.role_id == role.id,
            role_permissions_table.c.permission_id == permission.id,
        )
    )
    if existing_link is None:
        await session.execute(
            role_permissions_table.insert().values(role_id=role.id, permission_id=permission.id)
        )


async def link_user_role(session: AsyncSession, user: User, role: Role) -> None:
    existing_link = await session.scalar(
        select(user_roles_table.c.user_id).where(
            user_roles_table.c.user_id == user.id,
            user_roles_table.c.role_id == role.id,
        )
    )
    if existing_link is None:
        await session.execute(user_roles_table.insert().values(user_id=user.id, role_id=role.id))


async def list_all_permission_codes(session: AsyncSession) -> list[str]:
    result = await session.scalars(select(Permission.code).order_by(Permission.code))
    return sorted(result.all())


async def list_permission_codes_for_user(session: AsyncSession, user: User) -> list[str]:
    if user.is_superuser:
        return await list_all_permission_codes(session)

    statement = (
        select(Permission.code)
        .select_from(Permission)
        .join(role_permissions_table, role_permissions_table.c.permission_id == Permission.id)
        .join(user_roles_table, user_roles_table.c.role_id == role_permissions_table.c.role_id)
        .where(user_roles_table.c.user_id == user.id)
        .distinct()
        .order_by(Permission.code)
    )
    result = await session.scalars(statement)
    return list(result.all())
