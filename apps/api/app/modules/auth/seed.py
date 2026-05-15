import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal, dispose_engine
from app.modules.auth.models import User
from app.modules.auth.repository import get_user_by_username
from app.modules.auth.security import get_password_hash
from app.modules.permissions.models import Role
from app.modules.permissions.registry import ADMIN_ROLE_CODE, ADMIN_ROLE_NAME, DEFAULT_PERMISSIONS
from app.modules.permissions.repository import (
    get_permission_by_code,
    get_role_by_code,
    link_role_permission,
    link_user_role,
)

logger = logging.getLogger(__name__)


async def seed_default_rbac(session: AsyncSession) -> Role:
    admin_role = await get_role_by_code(session, ADMIN_ROLE_CODE)
    if admin_role is None:
        admin_role = Role(
            code=ADMIN_ROLE_CODE,
            name=ADMIN_ROLE_NAME,
            description="System administrator role with all default permissions.",
            is_system=True,
        )
        session.add(admin_role)
        await session.flush()

    for permission_definition in DEFAULT_PERMISSIONS:
        permission = await get_permission_by_code(session, permission_definition.code)
        if permission is None:
            permission = Permission(
                code=permission_definition.code,
                name=permission_definition.name,
                type=permission_definition.type,
                description=permission_definition.description,
            )
            session.add(permission)
            await session.flush()

        await link_role_permission(session, admin_role, permission)

    return admin_role


async def seed_first_superuser() -> None:
    settings = get_settings()
    password = settings.first_superuser_password

    if password is None or password == "please-change-me":
        msg = "Set FIRST_SUPERUSER_PASSWORD to a non-default value before seeding."
        raise RuntimeError(msg)

    async with AsyncSessionLocal() as session:
        admin_role = await seed_default_rbac(session)
        existing_user = await get_user_by_username(session, settings.first_superuser_username)
        if existing_user is not None:
            await link_user_role(session, existing_user, admin_role)
            await session.commit()
            logger.info("First superuser already exists: %s", settings.first_superuser_username)
            return

        user = User(
            username=settings.first_superuser_username,
            email=settings.first_superuser_email,
            full_name="System Administrator",
            hashed_password=get_password_hash(password),
            is_active=True,
            is_superuser=True,
        )
        session.add(user)
        await session.flush()
        await link_user_role(session, user, admin_role)
        await session.commit()

    logger.info("Created first superuser: %s", settings.first_superuser_username)


async def async_main() -> None:
    try:
        await seed_first_superuser()
    finally:
        await dispose_engine()


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
