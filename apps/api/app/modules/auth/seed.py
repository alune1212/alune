import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal, dispose_engine
from app.modules.auth.models import User
from app.modules.auth.repository import get_user_by_username
from app.modules.auth.security import get_password_hash
from app.modules.departments.models import Department
from app.modules.departments.repository import get_department_by_code
from app.modules.permissions.models import Permission, Role
from app.modules.permissions.registry import ADMIN_ROLE_CODE, ADMIN_ROLE_NAME, DEFAULT_PERMISSIONS
from app.modules.permissions.repository import (
    get_permission_by_code,
    get_role_by_code,
    link_role_permission,
    link_user_role,
)

logger = logging.getLogger(__name__)
DEFAULT_DEPARTMENT_CODE = "headquarters"
DEFAULT_DEPARTMENT_NAME = "Headquarters"


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


async def seed_default_department(session: AsyncSession) -> Department:
    department = await get_department_by_code(session, DEFAULT_DEPARTMENT_CODE)
    if department is not None:
        return department

    department = Department(
        code=DEFAULT_DEPARTMENT_CODE,
        name=DEFAULT_DEPARTMENT_NAME,
        description="Default root department for the internal system foundation.",
        sort_order=0,
        is_active=True,
    )
    session.add(department)
    await session.flush()
    return department


async def seed_first_superuser() -> None:
    settings = get_settings()
    password = settings.first_superuser_password

    if password is None or password == "please-change-me":
        msg = "Set FIRST_SUPERUSER_PASSWORD to a non-default value before seeding."
        raise RuntimeError(msg)

    async with AsyncSessionLocal() as session:
        admin_role = await seed_default_rbac(session)
        root_department = await seed_default_department(session)
        existing_user = await get_user_by_username(session, settings.first_superuser_username)
        if existing_user is not None:
            if existing_user.department_id is None:
                existing_user.department_id = root_department.id
            await link_user_role(session, existing_user, admin_role)
            await session.commit()
            logger.info("First superuser already exists: %s", settings.first_superuser_username)
            return

        user = User(
            username=settings.first_superuser_username,
            email=settings.first_superuser_email,
            full_name="System Administrator",
            department_id=root_department.id,
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
