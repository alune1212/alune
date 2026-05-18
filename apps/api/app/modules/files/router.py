from fastapi import APIRouter, Depends, status

from app.common.response import ApiResponse
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.files.models import FileAttachment
from app.modules.files.repository import list_file_attachments
from app.modules.files.schemas import FileAttachmentCreate, FileAttachmentPublic
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/files", tags=["files"])
CreateFileDependency = Depends(require_permission("action:files:create"))


@router.get(
    "",
    response_model=ApiResponse[list[FileAttachmentPublic]],
    dependencies=[Depends(require_permission("action:files:read"))],
)
async def get_file_attachments(
    session: DatabaseSession,
) -> ApiResponse[list[FileAttachmentPublic]]:
    files = await list_file_attachments(session)
    data = [FileAttachmentPublic.model_validate(file) for file in files]
    return ApiResponse(success=True, data=data)


@router.post(
    "",
    response_model=ApiResponse[FileAttachmentPublic],
    status_code=status.HTTP_201_CREATED,
)
async def create_file_attachment(
    payload: FileAttachmentCreate,
    session: DatabaseSession,
    current_user: User = CreateFileDependency,
) -> ApiResponse[FileAttachmentPublic]:
    file_attachment = FileAttachment(
        **payload.model_dump(),
        uploaded_by_user_id=current_user.id,
    )
    session.add(file_attachment)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="create",
        resource="file_attachment",
        resource_id=str(file_attachment.id),
    )
    await session.commit()
    await session.refresh(file_attachment)
    return ApiResponse(success=True, data=FileAttachmentPublic.model_validate(file_attachment))
