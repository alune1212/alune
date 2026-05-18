from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import LoginLog, OperationLog


async def list_operation_logs(session: AsyncSession) -> list[OperationLog]:
    result = await session.scalars(select(OperationLog).order_by(OperationLog.created_at.desc()))
    return list(result.all())


async def list_login_logs(session: AsyncSession) -> list[LoginLog]:
    result = await session.scalars(select(LoginLog).order_by(LoginLog.created_at.desc()))
    return list(result.all())


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
