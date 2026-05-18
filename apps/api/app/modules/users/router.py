from fastapi import APIRouter, Depends

from app.common.response import ApiResponse
from app.modules.auth.dependencies import DatabaseSession
from app.modules.permissions.dependencies import require_permission
from app.modules.users.repository import list_users
from app.modules.users.schemas import UserManagementItem

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    response_model=ApiResponse[list[UserManagementItem]],
    dependencies=[Depends(require_permission("action:users:read"))],
)
async def get_users(session: DatabaseSession) -> ApiResponse[list[UserManagementItem]]:
    users = await list_users(session)
    data = [UserManagementItem.model_validate(user) for user in users]
    return ApiResponse(success=True, data=data)
