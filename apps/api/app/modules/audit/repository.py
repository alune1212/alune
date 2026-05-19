from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import LoginLog, OperationLog


async def list_operation_logs(
    session: AsyncSession,
    *,
    q: str | None = None,
    status: str | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[OperationLog], int]:
    statement = select(OperationLog)
    count_statement = select(func.count()).select_from(OperationLog)
    filters = []
    if q:
        pattern = f"%{q}%"
        filters.append(
            or_(
                OperationLog.action.ilike(pattern),
                OperationLog.resource.ilike(pattern),
                OperationLog.resource_id.ilike(pattern),
                OperationLog.detail.ilike(pattern),
            )
        )
    if status:
        filters.append(OperationLog.status == status)
    if started_at:
        filters.append(OperationLog.created_at >= started_at)
    if ended_at:
        filters.append(OperationLog.created_at <= ended_at)
    for filter_clause in filters:
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)

    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(OperationLog.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def list_login_logs(
    session: AsyncSession,
    *,
    q: str | None = None,
    status: str | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[LoginLog], int]:
    statement = select(LoginLog)
    count_statement = select(func.count()).select_from(LoginLog)
    filters = []
    if q:
        pattern = f"%{q}%"
        filters.append(
            or_(
                LoginLog.username.ilike(pattern),
                LoginLog.ip_address.ilike(pattern),
                LoginLog.message.ilike(pattern),
            )
        )
    if status:
        filters.append(LoginLog.status == status)
    if started_at:
        filters.append(LoginLog.created_at >= started_at)
    if ended_at:
        filters.append(LoginLog.created_at <= ended_at)
    for filter_clause in filters:
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)

    total = await session.scalar(count_statement)
    result = await session.scalars(
        statement.order_by(LoginLog.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.all()), total or 0


async def record_login_log(
    session: AsyncSession,
    *,
    username: str,
    user_id: UUID | None,
    ip_address: str | None,
    user_agent: str | None,
    status: str,
    message: str | None = None,
) -> None:
    session.add(
        LoginLog(
            username=username,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            message=message,
        )
    )


async def record_operation_log(
    session: AsyncSession,
    *,
    actor_user_id: UUID | None,
    action: str,
    resource: str,
    resource_id: str | None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    status: str = "success",
    detail: str | None = None,
) -> None:
    session.add(
        OperationLog(
            actor_user_id=actor_user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            detail=detail,
        )
    )
