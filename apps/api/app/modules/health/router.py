from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.response import ApiResponse
from app.db.session import get_db_session

router = APIRouter(prefix="/health", tags=["health"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db_session)]


class HealthStatus(BaseModel):
    status: str
    service: str


class DatabaseHealthStatus(BaseModel):
    status: str
    database: str


@router.get("", response_model=ApiResponse[HealthStatus])
async def health_check() -> ApiResponse[HealthStatus]:
    return ApiResponse(
        success=True,
        data=HealthStatus(status="ok", service="api"),
    )


@router.get("/db", response_model=ApiResponse[DatabaseHealthStatus])
async def database_health_check(
    session: DatabaseSession,
) -> ApiResponse[DatabaseHealthStatus]:
    try:
        await session.execute(text("SELECT 1"))
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc

    return ApiResponse(
        success=True,
        data=DatabaseHealthStatus(status="ok", database="postgresql"),
    )
