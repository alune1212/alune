from fastapi import APIRouter, Depends

from app.common.response import ApiResponse
from app.modules.audit.repository import list_login_logs, list_operation_logs
from app.modules.audit.schemas import LoginLogPublic, OperationLogPublic
from app.modules.auth.dependencies import DatabaseSession
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get(
    "/operation-logs",
    response_model=ApiResponse[list[OperationLogPublic]],
    dependencies=[Depends(require_permission("action:audit:read"))],
)
async def get_operation_logs(session: DatabaseSession) -> ApiResponse[list[OperationLogPublic]]:
    logs = await list_operation_logs(session)
    data = [OperationLogPublic.model_validate(log) for log in logs]
    return ApiResponse(success=True, data=data)


@router.get(
    "/login-logs",
    response_model=ApiResponse[list[LoginLogPublic]],
    dependencies=[Depends(require_permission("action:audit:read"))],
)
async def get_login_logs(session: DatabaseSession) -> ApiResponse[list[LoginLogPublic]]:
    logs = await list_login_logs(session)
    data = [LoginLogPublic.model_validate(log) for log in logs]
    return ApiResponse(success=True, data=data)
