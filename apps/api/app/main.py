from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.db.session import dispose_engine
from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.departments.router import router as departments_router
from app.modules.dictionaries.router import router as dictionaries_router
from app.modules.files.router import router as files_router
from app.modules.health.router import router as health_router
from app.modules.roles.router import router as roles_router
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(application)
    application.include_router(audit_router, prefix="/api/v1")
    application.include_router(auth_router, prefix="/api/v1")
    application.include_router(departments_router, prefix="/api/v1")
    application.include_router(dictionaries_router, prefix="/api/v1")
    application.include_router(files_router, prefix="/api/v1")
    application.include_router(health_router, prefix="/api/v1")
    application.include_router(roles_router, prefix="/api/v1")
    application.include_router(users_router, prefix="/api/v1")

    return application


app = create_app()
