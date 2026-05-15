import asyncio
import logging

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal, dispose_engine
from app.modules.auth.models import User
from app.modules.auth.repository import get_user_by_username
from app.modules.auth.security import get_password_hash

logger = logging.getLogger(__name__)


async def seed_first_superuser() -> None:
    settings = get_settings()
    password = settings.first_superuser_password

    if password is None or password == "please-change-me":
        msg = "Set FIRST_SUPERUSER_PASSWORD to a non-default value before seeding."
        raise RuntimeError(msg)

    async with AsyncSessionLocal() as session:
        existing_user = await get_user_by_username(session, settings.first_superuser_username)
        if existing_user is not None:
            logger.info("First superuser already exists: %s", settings.first_superuser_username)
            return

        session.add(
            User(
                username=settings.first_superuser_username,
                email=settings.first_superuser_email,
                full_name="System Administrator",
                hashed_password=get_password_hash(password),
                is_active=True,
                is_superuser=True,
            )
        )
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
