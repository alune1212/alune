import csv
from datetime import datetime
from io import StringIO
from typing import Literal

from fastapi import APIRouter, Depends, Query
from starlette.responses import Response

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.modules.audit.repository import list_login_logs, list_operation_logs
from app.modules.audit.schemas import LoginLogPublic, OperationLogPublic
from app.modules.auth.dependencies import DatabaseSession
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get(
    "/operation-logs",
    response_model=ApiResponse[Page[OperationLogPublic]],
    dependencies=[Depends(require_permission("action:audit:read"))],
)
async def get_operation_logs(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    status: Literal["success", "failure", "error"] | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[OperationLogPublic]]:
    logs, total = await list_operation_logs(
        session,
        q=q,
        status=status,
        started_at=started_at,
        ended_at=ended_at,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [OperationLogPublic.model_validate(log) for log in logs]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@router.get(
    "/login-logs",
    response_model=ApiResponse[Page[LoginLogPublic]],
    dependencies=[Depends(require_permission("action:audit:read"))],
)
async def get_login_logs(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    status: Literal["success", "failure"] | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[LoginLogPublic]]:
    logs, total = await list_login_logs(
        session,
        q=q,
        status=status,
        started_at=started_at,
        ended_at=ended_at,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [LoginLogPublic.model_validate(log) for log in logs]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


@router.get(
    "/operation-logs/export",
    dependencies=[Depends(require_permission("action:audit:read"))],
)
async def export_operation_logs(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    status: Literal["success", "failure", "error"] | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
) -> Response:
    logs, _ = await list_operation_logs(
        session,
        q=q,
        status=status,
        started_at=started_at,
        ended_at=ended_at,
        limit=1000,
    )
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["id", "actor_user_id", "action", "resource", "resource_id", "status", "detail"]
    )
    for log in logs:
        writer.writerow(
            [
                log.id,
                log.actor_user_id,
                log.action,
                log.resource,
                log.resource_id,
                log.status,
                log.detail,
            ]
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="operation-logs.csv"'},
    )


@router.get(
    "/login-logs/export",
    dependencies=[Depends(require_permission("action:audit:read"))],
)
async def export_login_logs(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    status: Literal["success", "failure"] | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
) -> Response:
    logs, _ = await list_login_logs(
        session,
        q=q,
        status=status,
        started_at=started_at,
        ended_at=ended_at,
        limit=1000,
    )
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "username", "user_id", "ip_address", "status", "message"])
    for log in logs:
        writer.writerow(
            [log.id, log.username, log.user_id, log.ip_address, log.status, log.message]
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="login-logs.csv"'},
    )
