from typing import Literal

from fastapi import APIRouter, Depends, Query

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
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[OperationLogPublic]]:
    logs, total = await list_operation_logs(
        session,
        q=q,
        status=status,
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
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[LoginLogPublic]]:
    logs, total = await list_login_logs(
        session,
        q=q,
        status=status,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [LoginLogPublic.model_validate(log) for log in logs]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )
