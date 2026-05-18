from fastapi import APIRouter, Depends

from app.common.response import ApiResponse
from app.modules.auth.dependencies import DatabaseSession
from app.modules.permissions.dependencies import require_permission
from app.modules.roles.repository import list_roles
from app.modules.roles.schemas import RolePublic

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get(
    "",
    response_model=ApiResponse[list[RolePublic]],
    dependencies=[Depends(require_permission("action:roles:read"))],
)
async def get_roles(session: DatabaseSession) -> ApiResponse[list[RolePublic]]:
    roles = await list_roles(session)
    data = [RolePublic.model_validate(role) for role in roles]
    return ApiResponse(success=True, data=data)
