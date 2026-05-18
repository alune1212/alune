import asyncio
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from starlette.responses import FileResponse

from app.common.pagination import Page
from app.common.response import ApiResponse
from app.core.config import Settings, get_settings
from app.modules.audit.repository import record_operation_log
from app.modules.auth.dependencies import DatabaseSession
from app.modules.auth.models import User
from app.modules.files.models import FileAttachment
from app.modules.files.repository import get_file_attachment_by_id, list_file_attachments
from app.modules.files.schemas import FileAttachmentCreate, FileAttachmentPublic
from app.modules.files.storage import LocalFileStorage
from app.modules.permissions.dependencies import require_permission

router = APIRouter(prefix="/files", tags=["files"])
CreateFileDependency = Depends(require_permission("action:files:create"))
ReadFileDependency = Depends(require_permission("action:files:read"))


@router.get(
    "",
    response_model=ApiResponse[Page[FileAttachmentPublic]],
    dependencies=[ReadFileDependency],
)
async def get_file_attachments(
    session: DatabaseSession,
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[Page[FileAttachmentPublic]]:
    files, total = await list_file_attachments(
        session,
        q=q,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    data = [FileAttachmentPublic.model_validate(file) for file in files]
    return ApiResponse(
        success=True,
        data=Page(items=data, page=page, page_size=page_size, total=total),
    )


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


@router.post(
    "/upload",
    response_model=ApiResponse[FileAttachmentPublic],
    status_code=status.HTTP_201_CREATED,
)
async def upload_file_attachment(
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
    upload: Annotated[UploadFile, File()],
    current_user: User = CreateFileDependency,
) -> ApiResponse[FileAttachmentPublic]:
    stored = await LocalFileStorage(settings.local_file_storage_dir).save(upload)
    file_attachment = FileAttachment(
        **stored.model_dump(),
        uploaded_by_user_id=current_user.id,
    )
    session.add(file_attachment)
    await session.flush()
    await record_operation_log(
        session,
        actor_user_id=current_user.id,
        action="upload",
        resource="file_attachment",
        resource_id=str(file_attachment.id),
    )
    await session.commit()
    await session.refresh(file_attachment)
    return ApiResponse(success=True, data=FileAttachmentPublic.model_validate(file_attachment))


@router.get(
    "/{file_id}/download",
    dependencies=[ReadFileDependency],
)
async def download_file_attachment(
    file_id: UUID,
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileResponse:
    file_attachment = await get_file_attachment_by_id(session, file_id)
    if file_attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    try:
        file_path = LocalFileStorage(settings.local_file_storage_dir).resolve(
            file_attachment.storage_path
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid file storage path",
        ) from exc

    if not await asyncio.to_thread(file_path.is_file):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File content not found")

    return FileResponse(
        path=file_path,
        filename=file_attachment.original_filename,
        media_type=file_attachment.content_type,
    )
